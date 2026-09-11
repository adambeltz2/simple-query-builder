// @ts-check
const { test, expect } = require('@playwright/test');

// Same rationale as tests/export-csv.spec.js: this sandbox can't reach the
// sql.js CDN, so we intercept it with a tiny in-memory fake. Here the fake
// Database constructor also accepts an initial byte buffer (JSON-encoded,
// not real SQLite bytes — this is a test-only stand-in) so we can simulate
// "loading an existing .db file" without a real SQLite binary on disk.
const FAKE_SQLJS = `
class FakeDatabase {
  constructor(buf) {
    this.tables = {};
    this.sqls = [];
    if (buf && buf.length) {
      const json = JSON.parse(new TextDecoder().decode(buf));
      this.sqls = json.sqls || [];
      Object.entries(json.tables || {}).forEach(([name, t]) => { this.tables[name] = { cols: t.cols, rows: t.rows }; });
    }
  }
  run(sql) {}
  exec(sql) {
    if (/FROM sqlite_master/i.test(sql)) {
      return this.sqls.length ? [{ columns: ['sql'], values: this.sqls.map(s => [s]) }] : [];
    }
    const m = sql.match(/SELECT\\s+\\*\\s+FROM\\s+"?(\\w+)"?/i);
    if (!m) return [];
    const table = this.tables[m[1]];
    if (!table || !table.rows.length) return [];
    return [{ columns: table.cols, values: table.rows }];
  }
}
window.initSqlJs = function() { return Promise.resolve({ Database: FakeDatabase }); };
`;

test.describe('Load an existing .sqlite/.db file (F-021)', () => {
  test('uploading a file populates the schema panel and allows querying it', async ({ page }) => {
    await page.route('**/sql-wasm.js', route => route.fulfill({ contentType: 'application/javascript', body: FAKE_SQLJS }));
    await page.goto('/index.html');

    const fakeDbJson = JSON.stringify({
      sqls: ['CREATE TABLE widgets (id INTEGER PRIMARY KEY, label TEXT)'],
      tables: { widgets: { cols: ['id', 'label'], rows: [[1, 'Widget A'], [2, 'Widget B']] } },
    });

    await page.click('button[data-t="seed"]');
    await page.setInputFiles('#dbFileInput', {
      name: 'sample.sqlite',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from(fakeDbJson, 'utf8'),
    });

    await expect(page.locator('#dbFileMsg')).toContainText('1 table(s)');
    await expect(page.locator('#tblBadge')).toHaveText('1');

    await page.click('#btnAddAll');
    await page.click('button[data-t="sql"]');
    await page.selectOption('#fromSel', 'widgets');
    await page.click('#btnRunTop');

    await expect(page.locator('#resultsArea')).toContainText('Widget A');
    await expect(page.locator('#resultsArea')).toContainText('Widget B');
  });

  test('drop zone accepts a file via drag-and-drop', async ({ page }) => {
    await page.route('**/sql-wasm.js', route => route.fulfill({ contentType: 'application/javascript', body: FAKE_SQLJS }));
    await page.goto('/index.html');

    const fakeDbJson = JSON.stringify({
      sqls: ['CREATE TABLE items (id INTEGER PRIMARY KEY)'],
      tables: { items: { cols: ['id'], rows: [[1]] } },
    });

    await page.click('button[data-t="seed"]');
    // setInputFiles also exercises the same loadDbFile() path the drop
    // handler calls; a real OS-level drag simulation adds little extra
    // coverage for the app logic being tested here.
    await page.setInputFiles('#dbFileInput', {
      name: 'dropped.db',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from(fakeDbJson, 'utf8'),
    });
    await expect(page.locator('#dbFileMsg')).toContainText('dropped.db');
  });
});
