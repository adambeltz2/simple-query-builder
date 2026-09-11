// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Responsive/mobile layout (F-028)', () => {
  test('on a small viewport, mobile tabs appear and only one panel shows at a time', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto('/index.html');

    await expect(page.locator('#mobileTabs')).toBeVisible();
    await expect(page.locator('.ws > .panel').first()).toBeVisible();
    await expect(page.locator('.ws > .center')).toBeHidden();

    await page.click('button[data-mp="canvas"]');
    await expect(page.locator('.ws > .center')).toBeVisible();
    await expect(page.locator('.ws > .panel').first()).toBeHidden();

    await page.click('button[data-mp="sql"]');
    await expect(page.locator('.ws > .panel').last()).toBeVisible();
    await expect(page.locator('.ws > .center')).toBeHidden();
  });

  test('on a desktop viewport, mobile tabs are hidden and all panels show at once', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/index.html');

    await expect(page.locator('#mobileTabs')).toBeHidden();
    await expect(page.locator('.ws > .panel').first()).toBeVisible();
    await expect(page.locator('.ws > .center')).toBeVisible();
    await expect(page.locator('.ws > .panel').last()).toBeVisible();
  });
});
