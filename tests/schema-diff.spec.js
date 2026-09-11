// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Schema diff on re-import (F-002)', () => {
  test('re-parsing a changed schema shows added/dropped tables and columns', async ({ page }) => {
    await page.goto('/index.html');
    await page.fill('#ddlIn', `
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);
      CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER);
    `);
    await page.click('#btnParse');
    await expect(page.locator('#schemaDiffMsg')).toBeEmpty();

    await page.fill('#ddlIn', `
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
      CREATE TABLE products (id INTEGER PRIMARY KEY, label TEXT);
    `);
    await page.click('#btnParse');

    const diff = page.locator('#schemaDiffMsg');
    await expect(diff).toContainText('new table(s): products');
    await expect(diff).toContainText('dropped table(s): orders');
    await expect(diff).toContainText('customers');
    await expect(diff).toContainText('+email');
  });

  test('re-parsing an identical schema reports no changes', async ({ page }) => {
    await page.goto('/index.html');
    const ddl = 'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);';
    await page.fill('#ddlIn', ddl);
    await page.click('#btnParse');
    await page.fill('#ddlIn', ddl);
    await page.click('#btnParse');
    await expect(page.locator('#schemaDiffMsg')).toContainText('No schema changes');
  });
});
