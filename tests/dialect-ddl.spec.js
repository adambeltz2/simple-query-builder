// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('PostgreSQL-specific DDL (F-003)', () => {
  test('parses SERIAL PKs, ::casts in DEFAULT, and a schema-qualified table/FK', async ({ page }) => {
    await page.goto('/index.html');
    const ddl = `
      CREATE TABLE public.customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()::timestamptz
      );
      CREATE TABLE public.orders (
        id BIGSERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES public.customers(id),
        amount NUMERIC(10,2)
      );
    `;
    await page.fill('#ddlIn', ddl);
    await page.click('#btnParse');
    await expect(page.locator('#parseMsg')).toContainText('2 table(s)');
    await expect(page.locator('#parseMsg')).toContainText('1 FK(s)');
    await expect(page.locator('#tblBadge')).toHaveText('2');
  });
});

test.describe('MySQL-specific DDL (F-004)', () => {
  test('parses AUTO_INCREMENT, ENGINE=InnoDB trailing options, TINYINT(1), and backticks', async ({ page }) => {
    await page.goto('/index.html');
    const ddl = `
      CREATE TABLE \`customers\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`active\` TINYINT(1) DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      CREATE TABLE \`orders\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`customer_id\` INT NOT NULL,
        CONSTRAINT \`fk_orders_customer\` FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`)
      ) ENGINE=InnoDB;
    `;
    await page.fill('#ddlIn', ddl);
    await page.click('#btnParse');
    await expect(page.locator('#parseMsg')).toContainText('2 table(s)');
    await expect(page.locator('#parseMsg')).toContainText('1 FK(s)');
    await expect(page.locator('#tblBadge')).toHaveText('2');
  });
});
