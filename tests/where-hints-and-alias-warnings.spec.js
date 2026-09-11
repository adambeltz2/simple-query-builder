// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('WHERE type-mismatch hints (F-036)', () => {
  test('warns when comparing a TEXT column to a bare number', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('#btnAddWhere');
    const row = page.locator('.where-row').first();
    await row.locator('select').nth(0).selectOption('customers.name');
    await row.locator('input.ti').fill('123');
    await expect(page.locator('.where-hint')).toContainText('is TEXT');
  });

  test('warns when comparing a numeric column to a non-numeric value', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'orders');
    await page.click('#btnAddWhere');
    const row = page.locator('.where-row').first();
    await row.locator('select').nth(0).selectOption('orders.amount');
    await row.locator('input.ti').fill('abc');
    await expect(page.locator('.where-hint')).toContainText("isn't numeric");
  });

  test('no hint when types line up', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'orders');
    await page.click('#btnAddWhere');
    const row = page.locator('.where-row').first();
    await row.locator('select').nth(0).selectOption('orders.amount');
    await row.locator('input.ti').fill('99.5');
    await expect(page.locator('.where-hint')).toHaveCount(0);
  });
});

test.describe('SQL->Visual alias resolution warnings (F-024)', () => {
  test('warns when a query references a table not in the loaded schema', async ({ page }) => {
    await page.goto('/index.html');
    // No schema loaded yet.
    await page.click('#btnPasteSQL');
    await page.fill('#sqlPaste', 'SELECT u.id FROM unknown_table u WHERE u.id = 1');
    await page.click('#btnParseSQLOk');
    await expect(page.locator('#parseMsg')).toContainText('unknown_table');
    await expect(page.locator('#parseMsg')).toContainText("couldn't be placed on canvas");
  });

  test('no warning when the referenced table is in the loaded schema', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnPasteSQL');
    await page.fill('#sqlPaste', 'SELECT c.id FROM customers c WHERE c.id = 1');
    await page.click('#btnParseSQLOk');
    await expect(page.locator('#parseMsg')).not.toContainText('⚠');
  });
});
