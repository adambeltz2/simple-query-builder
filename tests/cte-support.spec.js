// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('CTE (WITH clause) support (F-022)', () => {
  test('a WITH cte AS (...) query is parsed, the CTE becomes a virtual table, and it is placed on canvas', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnPasteSQL');
    await page.fill('#sqlPaste', `
      WITH recent_orders AS (
        SELECT customer_id, amount FROM orders WHERE status = 'shipped'
      )
      SELECT ro.customer_id, ro.amount FROM recent_orders ro WHERE ro.amount > 10
    `);
    await page.click('#btnParseSQLOk');

    await expect(page.locator('#parseMsg')).not.toContainText("couldn't be placed on canvas");
    await expect(page.locator('.tch').filter({ hasText: 'recent_orders' })).toBeVisible();
    await expect(page.locator('#nd-recent_orders')).toBeVisible();
    await expect(page.locator('#nd-recent_orders')).toContainText('customer_id');
    await expect(page.locator('#nd-recent_orders')).toContainText('amount');
  });
});
