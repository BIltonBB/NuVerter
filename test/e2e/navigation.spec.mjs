import { test, expect } from '@playwright/test';

// Regression guard for the kind of breakage a text editor causes: a view that
// throws on open, a missing h1, or a console error from a renamed asset/API.
test('every sidebar view opens without console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

  // Mark the welcome tour as seen before the app boots, otherwise it opens on a
  // timer and races the first click.
  await page.addInitScript(() => {
    try {
      localStorage.setItem('NuVerter-prefs', JSON.stringify({ seenWelcome: true }));
      localStorage.setItem('NuVerter-launched', '1');
    } catch {}
  });
  await page.goto('/index.html');
  await expect(page.locator('#sidebar .nav-item[data-tool]').first()).toBeVisible();

  const tools = await page.$$eval('#sidebar .nav-item[data-tool]', (els) =>
    [...new Set(els.map((el) => el.getAttribute('data-tool')))].filter(Boolean)
  );
  expect(tools.length).toBeGreaterThanOrEqual(10);

  for (const tool of tools) {
    const item = page.locator(`#sidebar .nav-item[data-tool="${tool}"]`).first();
    await item.scrollIntoViewIfNeeded();
    await item.click();
    await expect(page.locator('main h1').first(), `view ${tool} must render an h1`).toBeVisible();
    await page.waitForTimeout(120);
  }

  expect(errors, errors.join('\n')).toEqual([]);
});
