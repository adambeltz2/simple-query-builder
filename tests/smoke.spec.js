// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Core smoke path', () => {
  test('loads with an empty schema', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page).toHaveTitle('QueryCraft');
    await expect(page.locator('#tblBadge')).toHaveText('0');
  });

  test('Sample button loads DDL and Parse extracts tables + FKs', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await expect(page.locator('#ddlIn')).not.toHaveValue('');
    await page.click('#btnParse');
    await expect(page.locator('#tblBadge')).not.toHaveText('0');
    await expect(page.locator('#parseMsg')).toContainText('table(s)');
  });

  test('adding a table to canvas and picking a FROM table generates SQL', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await expect(page.locator('#sqlOut')).toContainText('FROM');
    await expect(page.locator('#sqlOut')).toContainText('customers');
  });

  test('WHERE values containing an apostrophe are escaped in the generated SQL (B-005)', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('#btnAddWhere');
    const row = page.locator('.where-row').first();
    await row.locator('select').nth(0).selectOption('customers.name');
    await row.locator('input.ti').fill("O'Brien");
    const sql = await page.locator('#sqlOut').innerText();
    expect(sql).toContain("O''Brien");
    expect(sql).not.toMatch(/[^']'O'Brien'[^']/);
  });
});
