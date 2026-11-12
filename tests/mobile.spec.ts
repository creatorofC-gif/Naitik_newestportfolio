import { test, expect, type Page } from '@playwright/test';

/** Intro curtain is fixed with z-[100]; it unmounts when done. */
const curtain = (page: Page) => page.locator('[class*="z-[100]"]');

async function openSite(page: Page, errors: string[]) {
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    // Any missing same-origin file (bundle, video, favicon) is a broken deploy.
    if (r.url().startsWith('http://localhost') && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto('./', { waitUntil: 'domcontentloaded' });
}

async function waitForIntro(page: Page) {
  await expect(curtain(page)).toHaveCount(0, { timeout: 15_000 });
}

test('intro locks scrolling, then the site starts at the top and scrolls', async ({ page }) => {
  const errors: string[] = [];
  await openSite(page, errors);

  // While the curtain is up the page must not move (iOS ignores overflow:hidden for touch).
  await expect(curtain(page)).toBeVisible();
  expect(await page.evaluate(() => document.body.style.position)).toBe('fixed');
  await page.evaluate(() => window.scrollTo(0, 2000));
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await waitForIntro(page);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(await page.evaluate(() => document.body.style.position)).toBe('');

  // After the intro, scrolling works.
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);

  expect(errors, errors.join('\n')).toEqual([]);
});

test('every section fits the screen: no sideways scroll, pinned views fill the viewport', async ({ page }) => {
  const errors: string[] = [];
  await openSite(page, errors);
  await waitForIntro(page);

  for (const id of ['hero', 'skills', 'projects', 'experience', 'contact']) {
    await page.evaluate((id) => {
      const el = document.getElementById(id)!;
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 10);
    }, id);
    await page.waitForTimeout(400);

    const { docW, vw } = await page.evaluate(() => ({ docW: document.documentElement.scrollWidth, vw: window.innerWidth }));
    expect(docW, `#${id} is wider than the screen`).toBeLessThanOrEqual(vw);
    await expect(page.locator(`#${id}`), `#${id} not rendered`).toBeVisible();
  }

  // Pinned scenes use the stable small-viewport height: never taller than the visible screen.
  const heights = await page.evaluate(() =>
    Array.from(document.querySelectorAll('section .sticky.h-viewport')).map((e) => e.getBoundingClientRect().height),
  );
  const vh = await page.evaluate(() => window.innerHeight);
  expect(heights.length).toBeGreaterThanOrEqual(4);
  for (const h of heights) expect(h).toBeLessThanOrEqual(vh + 1);

  expect(errors, errors.join('\n')).toEqual([]);
});

/** Stand-in for Google DNS: company.dev can receive mail, gmail.con doesn't exist. */
async function fakeDns(page: Page) {
  await page.route('https://dns.google/**', (route) => {
    const name = new URL(route.request().url()).searchParams.get('name');
    const body = name === 'company.dev' ? { Status: 0, Answer: [{ type: 15, data: '10 mx.company.dev.' }] } : { Status: 3 };
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
  });
}

async function fillContact(page: Page, email: string) {
  await page.evaluate(() => document.getElementById('contact')!.scrollIntoView());
  await page.getByPlaceholder('Your name').fill('Test Recruiter');
  await page.getByPlaceholder('you@company.com').fill(email);
  await page.locator('#contact textarea').fill('Hello from the mobile check — are you open to an internship?');
  await page.waitForTimeout(3100); // past the "too fast to be human" timer
  await page.getByRole('button', { name: 'Send' }).click();
}

test('contact form: send shows the confirmation', async ({ page }) => {
  const errors: string[] = [];
  await openSite(page, errors);
  await fakeDns(page);
  await waitForIntro(page);

  // Stand-in for the Apps Script backend, so the check never writes to the real sheet.
  await page.route('https://script.google.com/**', (r) => r.fulfill({ contentType: 'application/json', body: '{"ok":true}' }));
  await fillContact(page, 'recruiter@company.dev');
  await expect(page.getByText(/Your message has been sent/)).toBeVisible({ timeout: 10_000 });

  expect(errors, errors.join('\n')).toEqual([]);
});

test('contact form: blocks an address whose domain cannot receive mail', async ({ page }) => {
  const errors: string[] = [];
  await openSite(page, errors);
  await fakeDns(page);
  await page.route('https://script.google.com/**', (r) => r.fulfill({ contentType: 'application/json', body: '{"ok":true}' }));
  await waitForIntro(page);

  await fillContact(page, 'recruiter@gmail.con');
  await expect(page.getByText(/can’t receive email/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Your message has been sent/)).toHaveCount(0);

  expect(errors, errors.join('\n')).toEqual([]);
});

/** Focusing a field must not zoom, slide sideways, or sit inside a moving/pinned scene. */
async function checkFieldsStayPut(page: Page) {
  await page.evaluate(() => document.getElementById('contact')!.scrollIntoView());
  const fields = page.locator('#contact input:not([name="botcheck"]), #contact textarea');
  const count = await fields.count();
  expect(count).toBe(4);
  for (let i = 0; i < count; i++) {
    const f = fields.nth(i);
    await f.focus();
    await page.waitForTimeout(200);
    const s = await f.evaluate((el) => {
      // Any box around the field that the browser scrolled to reveal it (slides the mail app out of place).
      let shifted = 0;
      for (let a = el.parentElement; a && a.id !== 'contact'; a = a.parentElement) shifted += a.scrollTop + a.scrollLeft;
      return {
        font: parseFloat(getComputedStyle(el).fontSize),
        docW: document.documentElement.scrollWidth,
        vw: window.innerWidth,
        shifted,
      };
    });
    expect(s.font, `field ${i} font under 16px (iOS zooms)`).toBeGreaterThanOrEqual(16);
    expect(s.docW).toBeLessThanOrEqual(s.vw);
    expect(s.shifted, `field ${i}: mail app scrolled inside the screen`).toBe(0);
  }
  const layout = await page.evaluate(() => {
    const sec = document.getElementById('contact')!;
    const pinned = Array.from(sec.querySelectorAll('*')).some((e) => getComputedStyle(e).position === 'sticky');
    const transformed = Array.from(sec.querySelectorAll('*')).some((e) => {
      const cs = getComputedStyle(e);
      return e.querySelector('form') && (cs.transform !== 'none' || cs.perspective !== 'none');
    });
    return { pinned, transformed };
  });
  expect(layout.pinned, 'contact scene pinned on a touch device').toBe(false);
  expect(layout.transformed, 'form sits inside a transformed element').toBe(false);
}

test('contact form: focusing fields does not zoom or move the page', async ({ page }) => {
  const errors: string[] = [];
  await openSite(page, errors);
  await waitForIntro(page);
  await checkFieldsStayPut(page);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('contact form: same on a phone turned sideways', async ({ page }) => {
  const errors: string[] = [];
  await page.setViewportSize({ width: 844, height: 390 });
  await openSite(page, errors);
  await waitForIntro(page);
  await checkFieldsStayPut(page);
  expect(errors, errors.join('\n')).toEqual([]);
});
