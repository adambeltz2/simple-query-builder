// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Parser debug log (B-009)', () => {
  test('clicking Parse shows debug output in #debugOut', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#discSchemaTools summary');
    await expect(page.locator('#debugOut')).toBeHidden();

    await page.fill('#ddlIn', 'CREATE TABLE t (id INTEGER PRIMARY KEY);');
    await page.click('#btnParse');

    const dbgOut = page.locator('#debugOut');
    await expect(dbgOut).toBeVisible();
    await expect(dbgOut).toContainText('Input length:');
  });
});
