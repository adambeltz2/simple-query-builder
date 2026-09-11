// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Subqueries in FROM (F-023)', () => {
  test('FROM (SELECT ...) AS alias is parsed and the alias becomes a virtual table on canvas', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnPasteSQL');
    await page.fill('#sqlPaste', `
      SELECT sub.customer_id, sub.total FROM (SELECT customer_id, amount AS total FROM orders WHERE status = 'shipped') AS sub WHERE sub.total > 5
    `);
    await page.click('#btnParseSQLOk');

    await expect(page.locator('#parseMsg')).not.toContainText("couldn't be placed on canvas");
    await expect(page.locator('#nd-sub')).toBeVisible();
    await expect(page.locator('#nd-sub')).toContainText('customer_id');
    await expect(page.locator('#nd-sub')).toContainText('total');
  });
});
