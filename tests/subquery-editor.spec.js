// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Subquery support in WHERE (F-008)', () => {
  test('the subquery modal edits an IN condition value and reflects it in generated SQL', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('#btnAddWhere');

    const row = page.locator('.where-row').first();
    await row.locator('select').nth(0).selectOption('customers.id');
    await row.locator('select').nth(1).selectOption('IN');
    await row.locator('button:has-text("⌘")').click();

    await expect(page.locator('#subqueryModal')).toBeVisible();
    await page.fill('#subqueryText', "SELECT customer_id FROM orders WHERE status = 'shipped'");
    await page.click('#btnSubqueryOk');
    await expect(page.locator('#subqueryModal')).toBeHidden();

    const sql = await page.locator('#sqlOut').innerText();
    expect(sql).toContain("IN (SELECT customer_id FROM orders WHERE status = 'shipped')");
  });

  test('Escape closes the subquery modal without applying changes', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('#btnAddWhere');
    const row = page.locator('.where-row').first();
    await row.locator('select').nth(0).selectOption('customers.id');
    await row.locator('select').nth(1).selectOption('IN');
    await row.locator('button:has-text("⌘")').click();
    await page.fill('#subqueryText', 'SELECT 1');
    await page.keyboard.press('Escape');
    await expect(page.locator('#subqueryModal')).toBeHidden();
    await expect(page.locator('#sqlOut')).not.toContainText('SELECT 1');
  });
});
