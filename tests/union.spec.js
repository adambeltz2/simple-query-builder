// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('UNION / UNION ALL (F-010)', () => {
  test('selecting UNION ALL and typing a second query appends it to the generated SQL', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');

    await expect(page.locator('#unionQuery')).toBeHidden();
    await page.selectOption('#unionType', 'UNION ALL');
    await expect(page.locator('#unionQuery')).toBeVisible();
    await page.fill('#unionQuery', 'SELECT id, name FROM products;');

    const sql = await page.locator('#sqlOut').innerText();
    expect(sql).toContain('UNION ALL');
    expect(sql).toContain('SELECT id, name FROM products');
    expect(sql.trim().endsWith(';')).toBe(true);
    expect((sql.match(/;/g) || []).length).toBe(1);
  });

  test('selecting "none" removes the union clause', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.selectOption('#unionType', 'UNION');
    await page.fill('#unionQuery', 'SELECT id, name FROM products');
    await page.selectOption('#unionType', '');
    await expect(page.locator('#sqlOut')).not.toContainText('UNION');
  });
});
