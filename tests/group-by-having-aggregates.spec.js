// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Aggregate functions in SELECT (F-007)', () => {
  test('applying an aggregate function wraps the column in the generated SQL', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'orders');

    const group = page.locator('.col-group').filter({ hasText: 'orders' });
    await group.locator('.col-check', { hasText: 'amount' }).locator('input[type=checkbox]').check();
    await group.locator('.agg-select').selectOption('SUM');

    await expect(page.locator('#sqlOut')).toContainText('SUM("orders"."amount")');
  });
});

test.describe('GROUP BY / HAVING (F-006)', () => {
  test('adding a GROUP BY column and a HAVING condition generates the correct clauses', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'orders');

    await page.click('#btnAddGroupBy');
    const gbRow = page.locator('#groupByList .where-row').first();
    await gbRow.locator('select').selectOption('orders.status');

    await page.click('#discAdvanced summary');
    await page.click('#btnAddHaving');
    const havingRow = page.locator('#havingList .where-row').first();
    await havingRow.locator('select').nth(0).selectOption('COUNT');
    await havingRow.locator('select').nth(1).selectOption('orders.id');
    await havingRow.locator('select').nth(2).selectOption('>');
    await havingRow.locator('input.ti').fill('1');

    const sql = await page.locator('#sqlOut').innerText();
    expect(sql).toContain('GROUP BY "orders"."status"');
    expect(sql).toContain('HAVING');
    expect(sql).toContain('COUNT("orders"."id") > 1');
  });

  test('HAVING section is disabled until a GROUP BY column exists', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'orders');
    await expect(page.locator('#havingList')).toContainText('Add a GROUP BY column first');
  });
});
