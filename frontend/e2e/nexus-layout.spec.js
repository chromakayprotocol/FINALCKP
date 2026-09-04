/**
 * Nexus 16:9 layout validation.
 *
 * The fixed-aspect cinematic composition is INTENTIONAL. These tests exist
 * to prove it holds up across the viewport and zoom matrix below — not to
 * argue it should become a conventional responsive page. A failure here
 * means something in the composition genuinely clips, disappears, or
 * becomes unreachable at that size; it is not a prompt to replace the
 * stage with cards.
 */

import { test, expect } from '@playwright/test';

/**
 * `poster: true` marks a viewport below UniversityNexus.css's 720px
 * breakpoint, where the stage deliberately becomes a fixed 720px-wide,
 * horizontally scrollable poster instead of reflowing the radial layout
 * into a stack. That is an intentional design decision, so horizontal
 * scrolling is the CONTRACT at those sizes, not a defect — the assertions
 * below check that the whole composition stays reachable by scrolling
 * rather than demanding it fit.
 */
const POSTER_BREAKPOINT = 720;

const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: 'iPad landscape', width: 1024, height: 768 },
  { name: 'iPad portrait', width: 768, height: 1024 },
  { name: 'narrow mobile', width: 375, height: 667, poster: true },
];

const ZOOM_LEVELS = [1.25, 1.5, 2];

const PROTOCOLS = [
  'The Fracture Protocol',
  'The Reflection Protocol',
  'The Crucible Protocol',
  'The Reclamation Protocol',
];

async function gotoNexus(page, query = '') {
  await page.goto(`/${query}`);
  await expect(page.locator('.un-frame')).toBeVisible();
  // Wait for the learner-state load to settle so measurements are taken
  // against final content, not the loading pass.
  await expect(page.locator('.un-axis__caption strong')).not.toHaveText('Loading…');
}

/** True when an element's rendered text is cut off by its own box. */
async function isTextClipped(locator) {
  return locator.evaluate((el) => {
    const tolerance = 1;
    return (
      el.scrollWidth > el.clientWidth + tolerance || el.scrollHeight > el.clientHeight + tolerance
    );
  });
}

async function documentOverflow(page) {
  return page.evaluate(() => ({
    horizontal: document.documentElement.scrollWidth > window.innerWidth + 1,
    vertical: document.documentElement.scrollHeight > window.innerHeight + 1,
  }));
}

for (const viewport of VIEWPORTS) {
  test.describe(`at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('the stage keeps its 16:9 frame and the background stays visible', async ({ page }) => {
      await gotoNexus(page);

      const frame = page.locator('.un-frame');
      const box = await frame.boundingBox();
      expect(box.width / box.height).toBeCloseTo(16 / 9, 1);

      // The background art is a CSS custom property on the root element and
      // painted by .un-stage; assert it actually resolved to the Nexus image.
      const background = await page
        .locator('.un-stage')
        .evaluate((el) => getComputedStyle(el).backgroundImage);
      expect(background).toContain('Nexus_Background.png');
    });

    test('the central Hall stays reachable and all four protocol nodes stay visible', async ({
      page,
    }) => {
      await gotoNexus(page);

      const hall = page.locator('.un-axis__hall');
      await expect(hall).toBeVisible();

      const targets = [hall, ...PROTOCOLS.map((title) => page.getByLabel(new RegExp(`^${title}`)))];

      for (const target of targets) {
        await expect(target).toBeVisible();
        if (viewport.poster) {
          // Poster mode: reachable by scrolling is the contract.
          await target.scrollIntoViewIfNeeded();
        }
        await expect(target).toBeInViewport();
      }
    });

    test('the locked state stays obvious on both unavailable protocols', async ({ page }) => {
      await gotoNexus(page);

      for (const title of ['The Crucible Protocol', 'The Reclamation Protocol']) {
        const node = page.getByLabel(`${title} — coming soon`);
        await expect(node).toHaveAttribute('aria-disabled', 'true');
        await expect(node.locator('.un-protocol__lock')).toBeVisible();
      }
      await expect(page.locator('.un-protocol__stat-label', { hasText: 'Coming Soon' })).toHaveCount(
        2
      );
    });

    test('the dock stays usable and its meters stay on screen', async ({ page }) => {
      await gotoNexus(page);

      const dock = page.locator('.un-dock');
      await expect(dock).toBeVisible();
      await expect(page.locator('.un-meter')).toHaveCount(3);

      for (const target of [dock, ...(await page.locator('.un-dock__btn').all())]) {
        await expect(target).toBeVisible();
        if (viewport.poster) await target.scrollIntoViewIfNeeded();
        await expect(target).toBeInViewport();
      }
    });

    test('no text is clipped by its own box', async ({ page }) => {
      await gotoNexus(page);

      const textNodes = [
        '.un-header__eyebrow',
        '.un-header h1',
        '.un-axis__label',
        '.un-axis__caption strong',
        '.un-protocol__title',
        '.un-protocol__stat-label',
        '.un-meter__label',
        '.un-meter__value',
        '.un-dock__name',
        '.un-dock__btn',
      ];

      for (const selector of textNodes) {
        for (const element of await page.locator(selector).all()) {
          expect(
            await isTextClipped(element),
            `${selector} is clipped at ${viewport.name}`
          ).toBe(false);
        }
      }
    });

    test('there are no unintended scrollbars', async ({ page }) => {
      await gotoNexus(page);
      const overflow = await documentOverflow(page);

      if (viewport.poster) {
        // Below the breakpoint the stage is a 720px poster inside an
        // `overflow-x: auto` container, so the horizontal scroll lives on
        // .university-nexus, not on the document. The document itself must
        // still not scroll in either direction.
        expect(overflow).toEqual({ horizontal: false, vertical: false });
        const scroller = await page.locator('.university-nexus').evaluate((el) => ({
          scrollsHorizontally: el.scrollWidth > el.clientWidth,
          reachesFullStage: el.scrollWidth >= 720,
        }));
        expect(scroller).toEqual({ scrollsHorizontally: true, reachesFullStage: true });
        return;
      }

      expect(overflow).toEqual({ horizontal: false, vertical: false });
    });

    test('every interactive control is keyboard reachable', async ({ page }) => {
      await gotoNexus(page);

      // Keyboard reachability does not depend on what is currently in
      // view, so this holds identically in poster mode.
      const focusable = await page.evaluate(() => {
        const selector = 'button, a[href], [tabindex]:not([tabindex="-1"])';
        return [...document.querySelectorAll(selector)].map(
          (el) => el.getAttribute('aria-label') ?? el.textContent.trim()
        );
      });

      for (const title of PROTOCOLS) {
        expect(focusable.some((name) => name.startsWith(title))).toBe(true);
      }
      expect(focusable.some((name) => name.includes('Hermetic Hall'))).toBe(true);
      expect(focusable.some((name) => name.includes('Logout'))).toBe(true);
    });
  });
}

for (const zoom of ZOOM_LEVELS) {
  test.describe(`at ${zoom * 100}% browser zoom`, () => {
    // Browser zoom scales CSS pixels, so a zoomed 1920x1080 viewport is
    // equivalent to a proportionally smaller CSS viewport.
    test.use({
      viewport: { width: Math.round(1920 / zoom), height: Math.round(1080 / zoom) },
      deviceScaleFactor: zoom,
    });

    test('the composition survives and stays scroll-free', async ({ page }) => {
      await gotoNexus(page);

      await expect(page.locator('.un-axis__hall')).toBeInViewport();
      await expect(page.locator('.un-dock')).toBeInViewport();
      for (const title of PROTOCOLS) {
        await expect(page.getByLabel(new RegExp(`^${title}`))).toBeInViewport();
      }
      expect(await documentOverflow(page)).toEqual({ horizontal: false, vertical: false });
    });
  });
}

test.describe('data-state rendering in a real browser', () => {
  test('the signed-out notice renders inside the frame without disturbing the composition', async ({
    page,
  }) => {
    await page.goto('/?state=signed-out');
    const notice = page.getByTestId('nexus-data-state');
    await expect(notice).toBeVisible();
    await expect(notice).toHaveText(/Signed out/);

    // Still inside the 16:9 frame, still above the axis.
    const frameBox = await page.locator('.un-frame').boundingBox();
    const noticeBox = await notice.boundingBox();
    expect(noticeBox.y).toBeGreaterThanOrEqual(frameBox.y);
    expect(noticeBox.y + noticeBox.height).toBeLessThan(
      (await page.locator('.un-axis').boundingBox()).y
    );

    expect(await documentOverflow(page)).toEqual({ horizontal: false, vertical: false });
  });

  test('a schema failure renders the error notice and no fabricated percentages', async ({
    page,
  }) => {
    await page.goto('/?state=error');
    await expect(page.getByTestId('nexus-data-state')).toContainText('PGRST205');

    const body = await page.locator('.un-frame').innerText();
    for (const forbidden of ['64%', '72%', '51%', '68%', '23%', '32%', '27%']) {
      expect(body).not.toContain(forbidden);
    }
    expect(await documentOverflow(page)).toEqual({ horizontal: false, vertical: false });
  });
});
