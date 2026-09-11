// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Multiple WHERE condition groups (F-011)', () => {
  test('toggling ( and ) on rows produces a grouped (A AND B) OR (C AND D) clause', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'orders');

    for (let i = 0; i < 4; i++) await page.click('#btnAddWhere');
    const rows = page.locator('.where-row');

    // Row 0: status = 'shipped', opens a group
    await rows.nth(0).locator('select').nth(0).selectOption('orders.status');
    await rows.nth(0).locator('input.ti').fill('shipped');
    await rows.nth(0).locator('button:has-text("(")').click();

    // Row 1: AND amount > 100, closes the group
    await rows.nth(1).locator('select').nth(0).selectOption('AND');
    await rows.nth(1).locator('select').nth(1).selectOption('orders.amount');
    await rows.nth(1).locator('select').nth(2).selectOption('>');
    await rows.nth(1).locator('input.ti').fill('100');
    await rows.nth(1).locator('button:has-text(")")').click();

    // Row 2: OR status = 'pending', opens a second group
    await rows.nth(2).locator('select').nth(0).selectOption('OR');
    await rows.nth(2).locator('select').nth(1).selectOption('orders.status');
    await rows.nth(2).locator('input.ti').fill('pending');
    await rows.nth(2).locator('button:has-text("(")').click();

    // Row 3: AND amount < 50, closes the second group
    await rows.nth(3).locator('select').nth(0).selectOption('AND');
    await rows.nth(3).locator('select').nth(1).selectOption('orders.amount');
    await rows.nth(3).locator('select').nth(2).selectOption('<');
    await rows.nth(3).locator('input.ti').fill('50');
    await rows.nth(3).locator('button:has-text(")")').click();

    const sql = await page.locator('#sqlOut').innerText();
    expect(sql).toContain('("orders"."status" = \'shipped\'');
    expect(sql).toContain('"orders"."amount" > 100)');
    expect(sql).toContain('OR ("orders"."status" = \'pending\'');
    expect(sql).toContain('"orders"."amount" < 50)');
  });
});
