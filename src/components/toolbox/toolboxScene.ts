import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Skill, SkillCategory } from '../../data/profileData';
import {
  TIMELINE,
  categoryCode,
  clamp01,
  easeInOutCubic,
  lerp,
  pad2,
  progressIn,
} from './toolboxConfig';

/* ──────────────────────────────────────────────────────────────
   Dimensions (world units). The case is a two-tray cantilever box:
   base (open shell) → two trays sitting on top → lid hinged at back.
   ────────────────────────────────────────────────────────────── */
const BASE = { w: 3.2, h: 0.8, d: 1.6, wall: 0.06 } as const;
const TRAY = { w: 3.2, h: 0.28, d: 0.8, wall: 0.04 } as const;
const LID = { h: 0.24, openAngle: 1.95 } as const;
const TOP_Y = BASE.h + TRAY.h;
const TILE = { w: 1, h: 0.46, depth: 0.06 } as const;
const FACE = { w: TILE.w - 0.035, h: TILE.h - 0.035 } as const;
const FACE_PX = { w: 512, h: Math.round((512 * FACE.h) / FACE.w) } as const;
const HOME_ROT_X = -0.2;
const BASE_ROWS_Z = [-0.42, -0.64, -0.2];

const FONT_DISPLAY = '"Geist", "Inter", system-ui, sans-serif';
const FONT_MONO = '"Geist Mono", "JetBrains Mono", monospace';
const FONT_BODY = '"Geist", "Inter", system-ui, sans-serif';

/* ──────────────────────────────────────────────────────────────
   Responsive framing
   ────────────────────────────────────────────────────────────── */
interface Frame {
  w: number;
  h: number;
  cy: number;
  cz: number;
}
interface ViewLayout {
  box: Frame;
  /** Fraction of the viewport the stage may occupy (overlay takes the rest). */
  fracW: number;
  fracH: number;
  /** Shift of the projected stage centre, as a fraction of viewport size. */
  offsetX: number;
  offsetY: number;
}

function getViewLayout(width: number, height: number): ViewLayout {
  const aspect = width / height;
  if (width >= 1024) {
    return {
      box: { w: 4.4, h: 2.8, cy: 0.85, cz: 0.2 },
      fracW: 0.6,
      fracH: 0.88,
      offsetX: -0.19,
      offsetY: 0,
    };
  }
  if (aspect < 0.9) {
    return {
      box: { w: 3.9, h: 2.8, cy: 0.85, cz: 0.2 },
      fracW: 0.98,
      fracH: 0.6,
      offsetX: 0,
      offsetY: -0.03,
    };
  }
  return {
    box: { w: 4.4, h: 2.8, cy: 0.85, cz: 0.2 },
    fracW: 0.94,
    fracH: 0.66,
    offsetX: 0,
    offsetY: -0.06,
  };
}

/**
 * Camera keyframes along the scroll.
 * `zoom` scales the distance to the box framing; `dive` (0→1) moves the look-at
 * target from the box's centre to the floor of the open case and removes the
 * stage offset, so the final frames look straight down into it.
 */
const CAMERA_KEYS = [
  { p: 0, yaw: 0.78, pitch: 0.26, zoom: 1.12, dive: 0 },
  { p: 0.1, yaw: 0.5, pitch: 0.34, zoom: 1.0, dive: 0 },
  { p: 0.3, yaw: 0.22, pitch: 0.6, zoom: 1.05, dive: 0 },
  { p: 0.44, yaw: 0, pitch: 1.42, zoom: 0.92, dive: 0.6 },
  { p: 0.54, yaw: 0, pitch: 1.52, zoom: 0.34, dive: 1 },
  { p: 1, yaw: 0, pitch: 1.52, zoom: 0.3, dive: 1 },
] as const;
const DIVE_TARGET = { y: BASE.h * 0.6, z: 0 } as const;

/* ──────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────── */
interface Pose {
  pos: THREE.Vector3;
  rotX: number;
  rotY: number;
  scale: number;
}
const makePose = (): Pose => ({ pos: new THREE.Vector3(), rotX: 0, rotY: 0, scale: 1 });

interface LinkAnchor {
  /** (z, y) pivot on the base side. */
  base: THREE.Vector2;
  /** (z, y) pivot relative to the tray origin. */
  tray: THREE.Vector2;
}

interface TrayRig {
  group: THREE.Group;
  anchors: LinkAnchor[];
  length: number;
  angleClosed: number;
  angleOpen: number;
  armX: number;
  arms: THREE.Mesh[];
}

type ContainerKind = 'front' | 'back' | 'base';

interface ToolTile {
  group: THREE.Group;
  container: ContainerKind;
  homeLocal: THREE.Vector3;
  homeScale: number;
}

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */
function createShell(
  w: number,
  h: number,
  d: number,
  t: number,
  outer: THREE.Material,
  inner: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  const r = Math.min(0.018, t / 2.2);
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    g.add(m);
  };
  add(new RoundedBoxGeometry(w, t, d, 2, r), outer, 0, t / 2, 0);
  const fb = new RoundedBoxGeometry(w, h, t, 2, r);
  add(fb, outer, 0, h / 2, d / 2 - t / 2);
  add(fb, outer, 0, h / 2, -d / 2 + t / 2);
  const side = new RoundedBoxGeometry(t, h, d - 2 * t, 2, r);
  add(side, outer, w / 2 - t / 2, h / 2, 0);
  add(side, outer, -w / 2 + t / 2, h / 2, 0);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * t, d - 2 * t), inner);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = t + 0.002;
  g.add(floor);
  return g;
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function drawTileFace(canvas: HTMLCanvasElement, skill: Skill, code: string, label: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#20242A');
  bg.addColorStop(1, '#0F1114');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(200, 242, 92,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, W - 12, H - 12);

  // Corner registration ticks
  ctx.strokeStyle = '#C8F25C';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(6, 30);
  ctx.lineTo(6, 6);
  ctx.lineTo(30, 6);
  ctx.moveTo(W - 30, H - 6);
  ctx.lineTo(W - 6, H - 6);
  ctx.lineTo(W - 6, H - 30);
  ctx.stroke();

  ctx.textBaseline = 'alphabetic';
  ctx.font = `500 21px ${FONT_MONO}`;
  ctx.fillStyle = '#C8F25C';
  ctx.textAlign = 'left';
  ctx.fillText(code, 30, 50);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.fillText(label, W - 30, 50);

  ctx.textAlign = 'left';
  let size = 58;
  ctx.font = `600 ${size}px ${FONT_DISPLAY}`;
  while (ctx.measureText(skill.name).width > W - 60 && size > 28) {
    size -= 2;
    ctx.font = `600 ${size}px ${FONT_DISPLAY}`;
  }
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(skill.name, 30, 136);

  ctx.fillStyle = '#C8F25C';
  ctx.fillRect(30, 160, 36, 2);

  ctx.font = `400 23px ${FONT_BODY}`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(skill.highlightTag ?? '', 30, 198);
}

function drawLidDecal(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(200, 242, 92,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, W - 8, H - 8);
  ctx.strokeStyle = 'rgba(200, 242, 92,0.18)';
  ctx.strokeRect(16, 16, W - 32, H - 32);
  const grad = ctx.createLinearGradient(0, 40, 0, 180);
  grad.addColorStop(0, '#DDF89B');
  grad.addColorStop(1, '#8FB52E');
  ctx.fillStyle = grad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 120px ${FONT_DISPLAY}`;
  ctx.fillText('NG', W / 2, 162);
  ctx.font = `500 20px ${FONT_MONO}`;
  ctx.fillStyle = 'rgba(200, 242, 92,0.75)';
  ctx.fillText('ENGINEERING  TOOLKIT', W / 2, 212);
}

function drawFrontPlate(canvas: HTMLCanvasElement, modules: number, tools: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.fillStyle = '#0F1114';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(200, 242, 92,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, W - 6, H - 6);
  ctx.textBaseline = 'middle';
  ctx.font = `500 26px ${FONT_MONO}`;
  ctx.fillStyle = '#C8F25C';
  ctx.textAlign = 'left';
  ctx.fillText('N.GUPTA', 26, H / 2);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`${pad2(modules)} MOD · ${pad2(tools)} TOOLS`, W - 26, H / 2);
}

function makeFloorTexture() {
  const c = makeCanvas(1024, 1024);
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.strokeStyle = 'rgba(168, 176, 186,0.14)'; // titanium grid
    ctx.lineWidth = 1;
    for (let i = 0; i <= 1024; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i + 0.5, 0);
      ctx.lineTo(i + 0.5, 1024);
      ctx.moveTo(0, i + 0.5);
      ctx.lineTo(1024, i + 0.5);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(168, 176, 186,0.26)';
    for (let i = 0; i <= 1024; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i + 0.5, 0);
      ctx.lineTo(i + 0.5, 1024);
      ctx.moveTo(0, i + 0.5);
      ctx.lineTo(1024, i + 0.5);
      ctx.stroke();
    }
    // Fade the grid out radially
    ctx.globalCompositeOperation = 'destination-in';
    const fade = ctx.createRadialGradient(512, 512, 40, 512, 512, 512);
    fade.addColorStop(0, 'rgba(0,0,0,1)');
    fade.addColorStop(0.55, 'rgba(0,0,0,0.5)');
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, 1024, 1024);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeShadowTexture() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    g.addColorStop(0, 'rgba(0,0,0,0.75)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  return new THREE.CanvasTexture(c);
}

/* ──────────────────────────────────────────────────────────────
   Scene
   ────────────────────────────────────────────────────────────── */
export class ToolboxScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  private readonly pmrem: THREE.PMREMGenerator;
  private readonly envTexture: THREE.Texture;

  private readonly lidPivot = new THREE.Group();
  private readonly latches: THREE.Group[] = [];
  private readonly trays: { front: TrayRig; back: TrayRig };
  private readonly innerLight = new THREE.PointLight(0xe8f7c4, 0, 4, 1.6);
  private readonly tiles: ToolTile[] = [];
  private readonly redrawables: (() => void)[] = [];

  private layout: ViewLayout = getViewLayout(1, 1);
  private width = 1;
  private height = 1;

  private readonly pointerNdc = new THREE.Vector2();
  private pointerActive = false;
  private readonly parallax = new THREE.Vector2();

  private readonly poseHome = makePose();
  private readonly camTarget = new THREE.Vector3();

  private disposed = false;

  constructor(host: HTMLElement, categories: SkillCategory[]) {
    // Perf: MSAA only where pixels are big enough to need it; high-DPI screens are
    // capped at 1.25x (the adaptive governor in ToolboxScroller can lower it further).
    const dpr = window.devicePixelRatio || 1;
    this.renderer = new THREE.WebGLRenderer({
      antialias: dpr < 1.5,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setPixelRatio(Math.min(dpr, 1.25));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = this.renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    // Image-based lighting gives the metal something to reflect.
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.envTexture = this.pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    this.scene.environment = this.envTexture;
    this.scene.environmentIntensity = 0.32;

    this.addLights();
    this.addFloor();
    this.trays = this.buildCase(categories);
    this.buildTiles(categories);

    // Redraw canvas textures once web fonts are ready.
    document.fonts?.ready.then(() => {
      if (this.disposed) return;
      this.redrawables.forEach((fn) => fn());
      // Re-upload the redrawn textures now (idle, under the intro) rather than lazily mid-scroll.
      this.scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) if ('map' in m && m.map instanceof THREE.Texture) this.renderer.initTexture(m.map);
      });
    });

    this.resize(host.clientWidth || 1, host.clientHeight || 1);
  }

  /* ─── Construction ─────────────────────────────────────────── */

  private addLights() {
    const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
    key.position.set(4, 6, 5);
    const rim = new THREE.DirectionalLight(0xdfe6ee, 2.2);
    rim.position.set(-5, 3.5, -4);
    const fill = new THREE.DirectionalLight(0xa8b0ba, 0.55);
    fill.position.set(-4, 2, 5);
    this.innerLight.position.set(0, 0.95, 0);
    this.scene.add(key, rim, fill, this.innerLight);
  }

  private addFloor() {
    const grid = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshBasicMaterial({ map: makeFloorTexture(), transparent: true, depthWrite: false, toneMapped: false }),
    );
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -0.001;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 3.4),
      new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false, color: 0x000000 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.002, 0.15);
    this.scene.add(grid, shadow);
  }

  private buildCase(categories: SkillCategory[]) {
    // Standard (not Physical/clearcoat) materials: one lighting pass per fragment instead of two.
    const shell = new THREE.MeshStandardMaterial({ color: 0x23272d, metalness: 0.72, roughness: 0.42 }); // matte gunmetal
    const trayShell = new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.65, roughness: 0.46 });
    const interior = new THREE.MeshStandardMaterial({ color: 0x0e1012, roughness: 0.95, metalness: 0.05 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xc3cad3, metalness: 1, roughness: 0.34 }); // brushed titanium hardware
    const steel = new THREE.MeshStandardMaterial({ color: 0x5a626d, metalness: 0.9, roughness: 0.32 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x0f1113, metalness: 0.1, roughness: 0.75 });

    // Base
    const base = createShell(BASE.w, BASE.h, BASE.d, BASE.wall, shell, interior);
    this.scene.add(base);

    // Gold seam along the base rim
    const rimFB = new THREE.BoxGeometry(BASE.w + 0.02, 0.022, 0.03);
    const rimSide = new THREE.BoxGeometry(0.03, 0.022, BASE.d + 0.02);
    for (const z of [BASE.d / 2, -BASE.d / 2]) {
      const m = new THREE.Mesh(rimFB, gold);
      m.position.set(0, BASE.h - 0.011, z);
      base.add(m);
    }
    for (const x of [BASE.w / 2, -BASE.w / 2]) {
      const m = new THREE.Mesh(rimSide, gold);
      m.position.set(x, BASE.h - 0.011, 0);
      base.add(m);
    }

    // Steel corner guards
    const guard = new RoundedBoxGeometry(0.1, BASE.h * 0.98, 0.1, 2, 0.02);
    for (const x of [-1, 1]) {
      for (const z of [-1, 1]) {
        const m = new THREE.Mesh(guard, steel);
        m.position.set(x * (BASE.w / 2 - 0.035), BASE.h / 2, z * (BASE.d / 2 - 0.035));
        base.add(m);
      }
    }

    // Front name plate
    const toolCount = categories.reduce((n, c) => n + c.skills.length, 0);
    const plateCanvas = makeCanvas(512, 96);
    const plateTex = new THREE.CanvasTexture(plateCanvas);
    plateTex.colorSpace = THREE.SRGBColorSpace;
    const drawPlate = () => {
      drawFrontPlate(plateCanvas, categories.length, toolCount);
      plateTex.needsUpdate = true;
    };
    drawPlate();
    this.redrawables.push(drawPlate);
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.4 * (96 / 512)),
      new THREE.MeshBasicMaterial({ map: plateTex, toneMapped: false }),
    );
    plate.position.set(0, BASE.h * 0.45, BASE.d / 2 + 0.002);
    base.add(plate);

    // Trays (each driven by a parallelogram linkage on both sides)
    const makeTray = () => {
      const g = createShell(TRAY.w, TRAY.h, TRAY.d, TRAY.wall, trayShell, interior);
      this.scene.add(g);
      return g;
    };
    const front: TrayRig = this.makeRig(
      makeTray(),
      { closedZ: TRAY.d / 2, closedY: BASE.h },
      { base: new THREE.Vector2(0.55, 0.45), tray: new THREE.Vector2(-0.15, 0.1) },
      THREE.MathUtils.degToRad(58),
      BASE.w / 2 + 0.025,
      steel,
      gold,
      base,
    );
    const back: TrayRig = this.makeRig(
      makeTray(),
      { closedZ: -TRAY.d / 2, closedY: BASE.h },
      { base: new THREE.Vector2(0.1, 0.4), tray: new THREE.Vector2(0.15, 0.1) },
      THREE.MathUtils.degToRad(75),
      BASE.w / 2 + 0.065,
      steel,
      gold,
      base,
    );

    // Latches live on the front tray and clip onto the lid
    const latchGeo = new RoundedBoxGeometry(0.2, 0.3, 0.025, 2, 0.01);
    for (const x of [-1.05, 1.05]) {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.13, TRAY.d / 2 + 0.016);
      const plateMesh = new THREE.Mesh(latchGeo, gold);
      plateMesh.position.y = 0.15;
      pivot.add(plateMesh);
      front.group.add(pivot);
      this.latches.push(pivot);
    }

    // Lid
    this.lidPivot.position.set(0, TOP_Y, -BASE.d / 2);
    this.scene.add(this.lidPivot);
    const lid = new THREE.Mesh(new RoundedBoxGeometry(BASE.w, LID.h, BASE.d, 3, 0.045), shell);
    lid.position.set(0, LID.h / 2, BASE.d / 2);
    this.lidPivot.add(lid);

    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, BASE.w * 0.92, 20), steel);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(0, 0, -0.015);
    this.lidPivot.add(hinge);

    // Handle
    const post = new RoundedBoxGeometry(0.09, 0.14, 0.1, 2, 0.02);
    for (const x of [-0.58, 0.58]) {
      const m = new THREE.Mesh(post, gold);
      m.position.set(x, LID.h + 0.06, BASE.d / 2);
      this.lidPivot.add(m);
    }
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.24, 24), rubber);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(0, LID.h + 0.15, BASE.d / 2);
    this.lidPivot.add(grip);

    // Lid monogram
    const decalCanvas = makeCanvas(512, 256);
    const decalTex = new THREE.CanvasTexture(decalCanvas);
    decalTex.colorSpace = THREE.SRGBColorSpace;
    const drawDecal = () => {
      drawLidDecal(decalCanvas);
      decalTex.needsUpdate = true;
    };
    drawDecal();
    this.redrawables.push(drawDecal);
    const decal = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.75),
      new THREE.MeshBasicMaterial({ map: decalTex, transparent: true, toneMapped: false }),
    );
    decal.rotation.x = -Math.PI / 2;
    decal.position.set(0, LID.h + 0.002, BASE.d / 2 + 0.22);
    this.lidPivot.add(decal);

    return { front, back };
  }

  private makeRig(
    group: THREE.Group,
    closed: { closedZ: number; closedY: number },
    primary: LinkAnchor,
    angleOpen: number,
    armX: number,
    armMat: THREE.Material,
    boltMat: THREE.Material,
    base: THREE.Group,
  ): TrayRig {
    const offset = new THREE.Vector2(-0.24, -0.04);
    const anchors: LinkAnchor[] = [
      primary,
      { base: primary.base.clone().add(offset), tray: primary.tray.clone().add(offset) },
    ];
    const dz = closed.closedZ + primary.tray.x - primary.base.x;
    const dy = closed.closedY + primary.tray.y - primary.base.y;
    const rig: TrayRig = {
      group,
      anchors,
      length: Math.hypot(dz, dy),
      angleClosed: Math.atan2(dy, dz),
      angleOpen,
      armX,
      arms: [],
    };

    const armGeo = new THREE.BoxGeometry(0.03, 1, 0.07);
    const boltGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.05, 16);
    boltGeo.rotateZ(Math.PI / 2);
    for (const side of [-1, 1]) {
      for (const a of anchors) {
        const arm = new THREE.Mesh(armGeo, armMat);
        this.scene.add(arm);
        rig.arms.push(arm);
        const baseBolt = new THREE.Mesh(boltGeo, boltMat);
        baseBolt.position.set(side * armX, a.base.y, a.base.x);
        base.add(baseBolt);
        const trayBolt = new THREE.Mesh(boltGeo, boltMat);
        trayBolt.position.set(side * armX, a.tray.y, a.tray.x);
        group.add(trayBolt);
      }
    }
    this.setTray(rig, 0);
    return rig;
  }

  private buildTiles(categories: SkillCategory[]) {
    const bodyGeo = new RoundedBoxGeometry(TILE.w, TILE.h, TILE.depth, 2, 0.022);
    const faceGeo = new THREE.PlaneGeometry(FACE.w, FACE.h);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1c2026, metalness: 0.6, roughness: 0.4 });
    const anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());

    categories.forEach((cat, c) => {
      const n = cat.skills.length;
      const label = categoryCode(cat.id);
      const container: ContainerKind = c === 0 ? 'front' : c === 1 ? 'back' : 'base';
      const spacing = (BASE.w - 0.3) / n;
      const homeScale = Math.min(container === 'base' ? 0.6 : 0.5, (spacing - 0.05) / TILE.w);
      const floorY = container === 'base' ? BASE.wall : TRAY.wall;
      const rowZ = container === 'base' ? BASE_ROWS_Z[(c - 2) % BASE_ROWS_Z.length] : 0.02;

      cat.skills.forEach((skill, i) => {
        const canvas = makeCanvas(FACE_PX.w, FACE_PX.h);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = anisotropy;
        const code = `${pad2(c + 1)}.${pad2(i + 1)}`;
        const draw = () => {
          drawTileFace(canvas, skill, code, label);
          texture.needsUpdate = true;
        };
        draw();
        this.redrawables.push(draw);

        const group = new THREE.Group();
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        const face = new THREE.Mesh(faceGeo, new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
        face.position.z = TILE.depth / 2 + 0.001;
        group.add(body, face);
        this.scene.add(group);

        this.tiles.push({
          group,
          container,
          homeLocal: new THREE.Vector3(
            (i - (n - 1) / 2) * spacing,
            floorY + (TILE.h * homeScale) / 2 + 0.004,
            rowZ,
          ),
          homeScale,
        });
      });
    });
  }

  /* ─── Public API ───────────────────────────────────────────── */

  resize(width: number, height: number) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setSize(this.width, this.height, false);
    this.layout = getViewLayout(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.setViewOffset(
      this.width,
      this.height,
      this.layout.offsetX * this.width,
      this.layout.offsetY * this.height,
      this.width,
      this.height,
    );
    this.camera.updateProjectionMatrix();
  }

  /**
   * Do all one-time GPU work up front: upload every texture and compile every
   * shader program, then draw one frame. Three.js otherwise does this lazily the
   * first time each object enters the view — which is what caused the 100–300ms
   * hitches while scrolling into / opening the case.
   */
  warmup() {
    this.scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) if ('map' in m && m.map instanceof THREE.Texture) this.renderer.initTexture(m.map);
    });
    // Compile with every object forced visible so nothing is skipped by frustum culling.
    const culled: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (obj.frustumCulled) {
        obj.frustumCulled = false;
        culled.push(obj);
      }
    });
    this.renderer.compile(this.scene, this.camera);
    this.render(0, 0);
    culled.forEach((obj) => (obj.frustumCulled = true));
  }

  /** Current render resolution multiplier. */
  get pixelRatio() {
    return this.renderer.getPixelRatio();
  }

  /** Lower (or raise) render resolution at runtime — used by the adaptive frame-rate governor. */
  setPixelRatio(ratio: number) {
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(this.width, this.height, false);
  }

  setPointer(ndcX: number, ndcY: number) {
    this.pointerNdc.set(ndcX, ndcY);
    this.pointerActive = true;
  }

  clearPointer() {
    this.pointerActive = false;
  }

  /** Advance the scene to the given scroll progress and draw. Returns true while still easing. */
  render(progress: number, dt: number): boolean {
    const p = clamp01(progress);
    this.applyMechanics(p);
    this.applyTiles(p);
    const camMoving = this.applyCamera(p, dt);
    this.renderer.render(this.scene, this.camera);
    return camMoving;
  }

  dispose() {
    this.disposed = true;
    const textures = new Set<THREE.Texture>();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if ('map' in m && m.map instanceof THREE.Texture) textures.add(m.map);
          m.dispose();
        }
      }
    });
    textures.forEach((t) => t.dispose());
    this.envTexture.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /* ─── Per-frame ────────────────────────────────────────────── */

  private setTray(rig: TrayRig, t: number) {
    const a = lerp(rig.angleClosed, rig.angleOpen, t);
    const primary = rig.anchors[0];
    const z = primary.base.x + rig.length * Math.cos(a) - primary.tray.x;
    const y = primary.base.y + rig.length * Math.sin(a) - primary.tray.y;
    rig.group.position.set(0, y, z);

    let k = 0;
    for (const side of [-1, 1]) {
      for (const anc of rig.anchors) {
        const arm = rig.arms[k++];
        const bz = z + anc.tray.x;
        const by = y + anc.tray.y;
        const dz = bz - anc.base.x;
        const dy = by - anc.base.y;
        arm.position.set(side * rig.armX, (by + anc.base.y) / 2, (bz + anc.base.x) / 2);
        arm.scale.y = Math.hypot(dz, dy);
        arm.rotation.x = Math.atan2(dz, dy);
      }
    }
  }

  private applyMechanics(p: number) {
    const latch = easeInOutCubic(progressIn(p, TIMELINE.latch));
    const lid = easeInOutCubic(progressIn(p, TIMELINE.lid));
    const trays = progressIn(p, TIMELINE.trays);

    for (const l of this.latches) l.rotation.x = latch * 2.5;
    this.lidPivot.rotation.x = -lid * LID.openAngle;
    this.setTray(this.trays.front, easeInOutCubic(clamp01(trays * 1.25)));
    this.setTray(this.trays.back, easeInOutCubic(clamp01(trays * 1.25 - 0.25)));
    this.innerLight.intensity = lid * 1.6 + trays * 1.4;
  }

  private containerOrigin(kind: ContainerKind, out: THREE.Vector3) {
    if (kind === 'front') return out.copy(this.trays.front.group.position);
    if (kind === 'back') return out.copy(this.trays.back.group.position);
    return out.set(0, 0, 0);
  }

  /**
   * Tiles stay seated in their trays — they ride along as the trays deploy and
   * are what the camera looks down onto. The readable skill cards are the HTML
   * compartments the canvas hands over to once the camera is inside the case.
   */
  private applyTiles(p: number) {
    // Tiles lean back slightly as the camera climbs overhead so their faces stay readable from above.
    const lean = easeInOutCubic(progressIn(p, TIMELINE.overhead));
    for (const tile of this.tiles) {
      this.containerOrigin(tile.container, this.poseHome.pos).add(tile.homeLocal);
      tile.group.position.copy(this.poseHome.pos);
      tile.group.rotation.set(lerp(HOME_ROT_X, -1.2, lean), 0, 0);
      tile.group.scale.setScalar(tile.homeScale);
    }
  }

  private applyCamera(p: number, dt: number): boolean {
    let k = 0;
    while (k < CAMERA_KEYS.length - 2 && p > CAMERA_KEYS[k + 1].p) k++;
    const k0 = CAMERA_KEYS[k];
    const k1 = CAMERA_KEYS[k + 1];
    const t = easeInOutCubic(clamp01((p - k0.p) / (k1.p - k0.p)));

    const L = this.layout;
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const aspect = this.camera.aspect;
    const fit = (f: Frame) => Math.max(f.h / (2 * tan * L.fracH), f.w / (2 * tan * aspect * L.fracW));
    const dive = lerp(k0.dive, k1.dive, t);
    const dist = fit(L.box) * lerp(k0.zoom, k1.zoom, t);

    // Re-centre the stage as we go overhead (the desktop layout parks the closed box left of centre).
    this.camera.setViewOffset(
      this.width,
      this.height,
      L.offsetX * this.width * (1 - dive),
      L.offsetY * this.height * (1 - dive),
      this.width,
      this.height,
    );
    this.camera.updateProjectionMatrix();

    // Pointer parallax (desktop only — pointer is never set on touch)
    const ease = 1 - Math.exp(-dt * 4);
    const tx = this.pointerActive ? this.pointerNdc.x : 0;
    const ty = this.pointerActive ? this.pointerNdc.y : 0;
    this.parallax.x += (tx - this.parallax.x) * ease;
    this.parallax.y += (ty - this.parallax.y) * ease;

    const yaw = lerp(k0.yaw, k1.yaw, t) + this.parallax.x * 0.07;
    const pitch = lerp(k0.pitch, k1.pitch, t) - this.parallax.y * 0.035;
    this.camTarget.set(0, lerp(L.box.cy, DIVE_TARGET.y, dive), lerp(L.box.cz, DIVE_TARGET.z, dive));
    this.camera.position.set(
      this.camTarget.x + dist * Math.sin(yaw) * Math.cos(pitch),
      this.camTarget.y + dist * Math.sin(pitch),
      this.camTarget.z + dist * Math.cos(yaw) * Math.cos(pitch),
    );
    this.camera.lookAt(this.camTarget);

    return Math.abs(tx - this.parallax.x) > 0.001 || Math.abs(ty - this.parallax.y) > 0.001;
  }
}
