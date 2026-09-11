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
        this.tables[m[1]] = { cols, rows: [[1, 'Row A']] };
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

test.describe('Query history (F-019)', () => {
  test('running a query logs it to history, and Re-run works', async ({ page }) => {
    await page.route('**/sql-wasm.js', route => route.fulfill({ contentType: 'application/javascript', body: FAKE_SQLJS }));
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('button[data-t="seed"]');
    await page.fill('#seedIn', 'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);');
    await page.click('#btnSeed');
    await page.click('button[data-t="sql"]');
    await page.click('#btnRunTop');

    await page.click('button[data-t="history"]');
    const entries = page.locator('#historyList .where-row');
    await expect(entries).toHaveCount(1);
    await expect(entries.first()).toContainText('1 row');

    await entries.first().locator('[data-hist-run]').click();
    await expect(page.locator('#resultsArea')).toContainText('Row A');
  });

  test('Clear History empties the list', async ({ page }) => {
    await page.route('**/sql-wasm.js', route => route.fulfill({ contentType: 'application/javascript', body: FAKE_SQLJS }));
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('button[data-t="seed"]');
    await page.fill('#seedIn', 'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);');
    await page.click('#btnSeed');
    await page.click('button[data-t="sql"]');
    await page.click('#btnRunTop');

    await page.click('button[data-t="history"]');
    await page.click('#btnClearHistory');
    await expect(page.locator('#historyList')).toContainText('No queries run yet');
  });
});
