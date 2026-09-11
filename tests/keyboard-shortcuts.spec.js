// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Keyboard shortcuts (F-025)', () => {
  test('Escape closes the Parse SQL modal', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnPasteSQL');
    await expect(page.locator('#sqlModal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#sqlModal')).toBeHidden();
  });

  test('clicking a canvas node selects it, and Delete removes it', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');

    const node = page.locator('#nd-customers');
    await node.locator('.tnode-hdr').click();
    await expect(node).toHaveClass(/\bsel\b/);

    await page.keyboard.press('Delete');
    await expect(page.locator('#nd-customers')).toHaveCount(0);
  });

  test('Delete key does nothing when focus is in a text field', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.locator('#nd-customers .tnode-hdr').click();

    await page.locator('#ddlIn').click();
    await page.keyboard.press('Delete');
    await expect(page.locator('#nd-customers')).toHaveCount(1);
  });

  test('Ctrl+C copies the generated SQL when nothing else is selected', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard-read permission is only granted on Chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.locator('body').click();
    await page.keyboard.press('Control+c');
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('FROM "customers"');
  });
});
