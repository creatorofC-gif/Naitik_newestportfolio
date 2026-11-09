import React from 'react';

/* ──────────────────────────────────────────────────────────────
   A small voxel character built from real CSS 3D boxes (6 faces each).
   No WebGL, no model files — just transforms, so it composites cheaply.
   Origin (0,0,0) is between the feet; +y is down (CSS), +z faces camera.

   States (class on the root):  walking · falling · landing
   Limb swings / idle bob / landing squash live in index.css (.vox-*).
   ────────────────────────────────────────────────────────────── */

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + 255 * amt)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `rgb(${r},${g},${b})`;
}

interface BoxProps {
  w: number;
  h: number;
  d: number;
  x?: number;
  y?: number;
  z?: number;
  color: string;
  front?: React.ReactNode;
}

const Box: React.FC<BoxProps> = ({ w, h, d, x = 0, y = 0, z = 0, color, front }) => {
  const face = (fw: number, fh: number, transform: string, bg: string, children?: React.ReactNode) => (
    <div
      className="vox-face"
      style={{ width: fw, height: fh, left: -fw / 2, top: -fh / 2, transform, background: bg }}
    >
      {children}
    </div>
  );
  return (
    <div className="vox-box" style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }}>
      {face(w, h, `translateZ(${d / 2}px)`, color, front)}
      {face(w, h, `rotateY(180deg) translateZ(${d / 2}px)`, shade(color, -0.22))}
      {face(d, h, `rotateY(90deg) translateZ(${w / 2}px)`, shade(color, -0.12))}
      {face(d, h, `rotateY(-90deg) translateZ(${w / 2}px)`, shade(color, -0.16))}
      {face(w, d, `rotateX(90deg) translateZ(${h / 2}px)`, shade(color, 0.1))}
      {face(w, d, `rotateX(-90deg) translateZ(${h / 2}px)`, shade(color, -0.3))}
    </div>
  );
};

/** A limb that swings from a pivot (hip / shoulder). The pivot is animated, the outer div positions it. */
const Limb: React.FC<{ x: number; y: number; className: string; children: React.ReactNode }> = ({ x, y, className, children }) => (
  <div className="vox-box" style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}>
    <div className={`vox-pivot ${className}`}>{children}</div>
  </div>
);

const SKIN = '#E8B796';
const HAIR = '#2B2118';
const HOODIE = '#5E6875'; // gunmetal-steel hoodie
const PANTS = '#353B44';
const SHOES = '#E3E6EA';

export const VoxelAvatar: React.FC<{ state: string; yaw: number }> = ({ state, yaw }) => (
  <div className={`vox ${state}`} style={{ transform: `rotateX(-14deg) rotateY(${yaw}deg)` }}>
    <div className="vox-body">
      {/* legs (pivot at hip, y = -18) */}
      <Limb x={-5} y={-18} className="vox-leg-l">
        <Box w={8} h={14} d={8} y={7} color={PANTS} />
        <Box w={8.5} h={4} d={10} y={16} z={1} color={SHOES} />
      </Limb>
      <Limb x={5} y={-18} className="vox-leg-r">
        <Box w={8} h={14} d={8} y={7} color={PANTS} />
        <Box w={8.5} h={4} d={10} y={16} z={1} color={SHOES} />
      </Limb>

      {/* torso (hoodie) with a little pocket + logo on the front */}
      <Box
        w={20}
        h={20}
        d={11}
        y={-28}
        color={HOODIE}
        front={
          <>
            <span className="absolute left-[7px] top-[5px] h-[3px] w-[6px] rounded-[1px] bg-[#C8F25C]" />
            <span className="absolute bottom-[3px] left-[4px] h-[5px] w-[12px] rounded-[1px] bg-black/15" />
          </>
        }
      />

      {/* arms (pivot at shoulder, y = -37) */}
      <Limb x={-13} y={-37} className="vox-arm-l">
        <Box w={6} h={14} d={6} y={7} color={HOODIE} />
        <Box w={5.5} h={4} d={5.5} y={16} color={SKIN} />
      </Limb>
      <Limb x={13} y={-37} className="vox-arm-r">
        <Box w={6} h={14} d={6} y={7} color={HOODIE} />
        <Box w={5.5} h={4} d={5.5} y={16} color={SKIN} />
      </Limb>

      {/* head + hair */}
      <Box
        w={18}
        h={18}
        d={18}
        y={-48}
        color={SKIN}
        front={
          <>
            <span className="absolute left-[4px] top-[8px] h-[4px] w-[3px] bg-[#1B1F2A]" />
            <span className="absolute right-[4px] top-[8px] h-[4px] w-[3px] bg-[#1B1F2A]" />
            <span className="absolute bottom-[3px] left-[6px] h-[1.5px] w-[6px] bg-[#B9806A]" />
          </>
        }
      />
      <Box w={19} h={5} d={19} y={-56} color={HAIR} />
      <Box w={19} h={9} d={4} y={-51} z={-8} color={HAIR} />
      <Box w={19} h={3} d={4} y={-53} z={8.6} color={HAIR} />
    </div>
  </div>
);
