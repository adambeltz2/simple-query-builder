// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Composite (multi-column) join keys (F-033)', () => {
  test('adding a second AND pair to a join generates a multi-column ON clause', async ({ page }) => {
    await page.goto('/index.html');
    await page.fill('#ddlIn', `
      CREATE TABLE a (id INTEGER PRIMARY KEY, x INTEGER, y INTEGER);
      CREATE TABLE b (id INTEGER PRIMARY KEY, x INTEGER, y INTEGER);
    `);
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'a');
    await page.click('#btnAddJoin');

    const joinRow = page.locator('.join-row').first();
    await joinRow.locator('select').nth(1).selectOption('b'); // rt
    await joinRow.locator('select').nth(2).selectOption('a.x'); // left col
    await joinRow.locator('select').nth(3).selectOption('b.x'); // right col

    await page.click('button:has-text("+ AND (composite key)")');
    const extraRow = page.locator('.join-row').nth(1);
    await extraRow.locator('select').nth(0).selectOption('y');
    await extraRow.locator('select').nth(1).selectOption('y');

    const sql = await page.locator('#sqlOut').innerText();
    expect(sql).toContain('ON "a"."x" = "b"."x"');
    expect(sql).toContain('AND "a"."y" = "b"."y"');
  });

  test('removing the extra pair drops it from the ON clause', async ({ page }) => {
    await page.goto('/index.html');
    await page.fill('#ddlIn', `
      CREATE TABLE a (id INTEGER PRIMARY KEY, x INTEGER, y INTEGER);
      CREATE TABLE b (id INTEGER PRIMARY KEY, x INTEGER, y INTEGER);
    `);
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'a');
    await page.click('#btnAddJoin');
    const joinRow = page.locator('.join-row').first();
    await joinRow.locator('select').nth(1).selectOption('b');
    await joinRow.locator('select').nth(2).selectOption('a.x');
    await joinRow.locator('select').nth(3).selectOption('b.x');
    await page.click('button:has-text("+ AND (composite key)")');
    const extraRow = page.locator('.join-row').nth(1);
    await extraRow.locator('select').nth(0).selectOption('y');
    await extraRow.locator('select').nth(1).selectOption('y');
    await extraRow.locator('button.dng').click();

    const sql = await page.locator('#sqlOut').innerText();
    expect(sql).toContain('ON "a"."x" = "b"."x"');
    expect(sql).not.toContain('AND "a"."y" = "b"."y"');
  });
});
