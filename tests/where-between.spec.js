// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('BETWEEN / NOT BETWEEN WHERE operator (F-031)', () => {
  test('BETWEEN renders two inputs and generates a low/high AND clause', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'orders');
    await page.click('#btnAddWhere');
    const row = page.locator('.where-row').first();
    await row.locator('select').nth(0).selectOption('orders.amount');
    await row.locator('select').nth(1).selectOption('BETWEEN');
    const inputs = row.locator('input.ti');
    await expect(inputs).toHaveCount(2);
    await inputs.nth(0).fill('10');
    await inputs.nth(1).fill('100');

    const sql = await page.locator('#sqlOut').innerText();
    expect(sql).toContain('BETWEEN 10 AND 100');
  });

  test('NOT BETWEEN with a non-numeric bound is quoted and escaped', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('#btnAddWhere');
    const row = page.locator('.where-row').first();
    await row.locator('select').nth(0).selectOption('customers.name');
    await row.locator('select').nth(1).selectOption('NOT BETWEEN');
    const inputs = row.locator('input.ti');
    await inputs.nth(0).fill("O'Brien");
    await inputs.nth(1).fill('Zeta');

    const sql = await page.locator('#sqlOut').innerText();
    expect(sql).toContain("NOT BETWEEN 'O''Brien' AND 'Zeta'");
  });
});
