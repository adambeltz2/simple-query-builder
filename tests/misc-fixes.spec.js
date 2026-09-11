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
        this.tables[m[1]] = { cols, rows: [] };
      }
    });
  }
  exec(sql) {
    if (/FROM sqlite_master/i.test(sql)) {
      return [{ columns: ['name'], values: Object.keys(this.tables).map(n => [n]) }];
    }
    const m = sql.match(/SELECT\\s+\\*\\s+FROM\\s+"?(\\w+)"?/i);
    if (!m) return [];
    return [{ columns: ['x'], values: [[1]] }];
  }
}
window.initSqlJs = function() { return Promise.resolve({ Database: FakeDatabase }); };
`;

test.describe('B-007: dialect mismatch note on Run', () => {
  test('shows an info note when running with a non-SQLite dialect selected', async ({ page }) => {
    await page.route('**/sql-wasm.js', route => route.fulfill({ contentType: 'application/javascript', body: FAKE_SQLJS }));
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('[data-d="mysql"]');
    await page.click('#btnRunTop');
    await expect(page.locator('#runMsg')).toContainText('SQLite semantics');
  });

  test('shows no note when running with the default SQLite dialect', async ({ page }) => {
    await page.route('**/sql-wasm.js', route => route.fulfill({ contentType: 'application/javascript', body: FAKE_SQLJS }));
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('#btnRunTop');
    await expect(page.locator('#runMsg')).toBeEmpty();
  });
});

test.describe('B-008: Clear DB still succeeds normally', () => {
  test('Clear DB reports success when there are no drop errors', async ({ page }) => {
    await page.route('**/sql-wasm.js', route => route.fulfill({ contentType: 'application/javascript', body: FAKE_SQLJS }));
    await page.goto('/index.html');
    await page.click('button[data-t="seed"]');
    await page.fill('#seedIn', 'CREATE TABLE t1 (id INTEGER);');
    await page.click('#btnSeed');
    await page.click('#btnClearDB');
    await expect(page.locator('#seedMsg')).toContainText('DB cleared');
    await expect(page.locator('#seedMsg')).not.toContainText('errors');
  });
});
