// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Undo/redo for canvas changes (F-027)', () => {
  test('undoing a table add removes it, redoing brings it back', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await expect(page.locator('#nd-customers')).toBeVisible();

    await page.click('#btnUndo');
    await expect(page.locator('#nd-customers')).toHaveCount(0);

    await page.click('#btnRedo');
    await expect(page.locator('#nd-customers')).toBeVisible();
  });

  test('undoing a join removal restores it', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.click('button[data-s="fk"]');
    await page.locator('.fk-chip').first().click();
    await expect(page.locator('.join-row')).toHaveCount(1);

    await page.locator('.join-row button.dng').first().click();
    await expect(page.locator('.join-row')).toHaveCount(0);

    await page.click('#btnUndo');
    await expect(page.locator('.join-row')).toHaveCount(1);
  });

  test('Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts work', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await expect(page.locator('#nd-customers')).toBeVisible();

    await page.locator('body').click();
    await page.keyboard.press('Control+z');
    await expect(page.locator('#nd-customers')).toHaveCount(0);

    await page.keyboard.press('Control+Shift+z');
    await expect(page.locator('#nd-customers')).toBeVisible();
  });
});
