// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Dialect-aware DDL placeholder and sample (bug report)', () => {
  test('switching dialect changes the Import DDL placeholder text', async ({ page }) => {
    await page.goto('/index.html');
    const ddlIn = page.locator('#ddlIn');
    await expect(ddlIn).toHaveAttribute('placeholder', /SQLite/);

    await page.click('[data-d="mysql"]');
    await expect(ddlIn).toHaveAttribute('placeholder', /MySQL/);
    await expect(ddlIn).toHaveAttribute('placeholder', /mysqldump/);

    await page.click('[data-d="postgres"]');
    await expect(ddlIn).toHaveAttribute('placeholder', /PostgreSQL/);
    await expect(ddlIn).toHaveAttribute('placeholder', /pg_dump/);
  });

  test('clicking Sample loads dialect-specific DDL that parses correctly', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('[data-d="mysql"]');
    await page.click('#btnSample');
    await expect(page.locator('#ddlIn')).toHaveValue(/AUTO_INCREMENT/);
    await page.click('#btnParse');
    await expect(page.locator('#tblBadge')).toHaveText('4');
  });
});

test.describe('Additional SQL dialects: Snowflake, Oracle, DuckDB', () => {
  for (const { d, label, markers } of [
    { d: 'snowflake', label: 'Snowflake', markers: ['AUTOINCREMENT', 'GET_DDL'] },
    { d: 'oracle', label: 'Oracle', markers: ['VARCHAR2', 'DBMS_METADATA'] },
    { d: 'duckdb', label: 'DuckDB', markers: ['duckdb_tables'] },
  ]) {
    test(`${label} dialect button selects, updates schema command and sample DDL`, async ({ page }) => {
      await page.goto('/index.html');
      await page.click(`[data-d="${d}"]`);
      await expect(page.locator(`[data-d="${d}"]`)).toHaveClass(/on/);

      await page.click('#discSchemaTools summary');
      await expect(page.locator('#schemaCmdDialect')).toHaveText(label);

      await page.click('#btnSample');
      const val = await page.locator('#ddlIn').inputValue();
      expect(val).toContain('CREATE TABLE customers');

      await page.click('#btnParse');
      await expect(page.locator('#tblBadge')).toHaveText('4');
    });
  }
});
