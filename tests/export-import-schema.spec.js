// @ts-check
const { test, expect } = require('@playwright/test');

const FAKE_SQLJS = `
class FakeDatabase {
  constructor() { this.tables = {}; }
  run(sql) {
    sql.split(';').map(s => s.trim()).filter(Boolean).forEach(stmt => {
      const m = stmt.match(/^CREATE TABLE\\s+"?(\\w+)"?\\s*\\(([\\s\\S]+)\\)$/i);
      if (m) {
        const cols = m[2].split(',').map(c => c.trim().split(/\\s+/)[0].replace(/["'\`]/g, ''));
        this.tables[m[1]] = { cols, rows: [[1, 'Test Row']] };
      }
    });
  }
  exec(sql) {
    const m = sql.match(/FROM\\s+"?(\\w+)"?/i);
    if (!m) return [];
    const table = this.tables[m[1]];
    if (!table || !table.rows.length) return [];
    return [{ columns: table.cols, values: table.rows }];
  }
}
window.initSqlJs = function() { return Promise.resolve({ Database: FakeDatabase }); };
`;

test.describe('Export parsed schema as JSON (F-001)', () => {
  test('downloads a JSON file with tables/fks/views after parsing', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#btnExportSchemaJson'),
    ]);
    expect(download.suggestedFilename()).toBe('querycraft-schema.json');
    const fs = require('fs');
    const content = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    expect(Object.keys(content.tables)).toContain('customers');
    expect(Array.isArray(content.fks)).toBe(true);
  });
});

test.describe('Upload a .sql file (F-005)', () => {
  test('uploading a .sql file parses it the same as pasting', async ({ page }) => {
    await page.goto('/index.html');
    await page.setInputFiles('#sqlFileInput', {
      name: 'schema.sql',
      mimeType: 'text/plain',
      buffer: Buffer.from('CREATE TABLE widgets (id INTEGER PRIMARY KEY, label TEXT);', 'utf8'),
    });
    await expect(page.locator('#tblBadge')).toHaveText('1');
    await expect(page.locator('#parseMsg')).toContainText('1 table(s)');
  });
});

test.describe('Export results as JSON (F-018)', () => {
  test('downloads a JSON array of row objects after running a query', async ({ page }) => {
    await page.route('**/sql-wasm.js', route => route.fulfill({ contentType: 'application/javascript', body: FAKE_SQLJS }));
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('button[data-t="seed"]');
    await page.fill('#seedIn', "CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);");
    await page.click('#btnSeed');
    await page.click('button[data-t="sql"]');
    await page.click('#btnRunTop');
    await expect(page.locator('#btnExportJson')).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#btnExportJson'),
    ]);
    expect(download.suggestedFilename()).toMatch(/^querycraft-results-.*\.json$/);
  });
});
