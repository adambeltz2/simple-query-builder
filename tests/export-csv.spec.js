// @ts-check
const fs = require('fs');
const { test, expect } = require('@playwright/test');

// This sandbox cannot reach the sql.js CDN, so `initSqlJs` never loads and
// the real app reports "SQLite not ready" for every query. Intercepting the
// CDN script and serving a tiny in-memory fake (CREATE TABLE / INSERT /
// SELECT * only — just enough for this test's seed + query) lets us drive
// the actual Run Query -> Export CSV flow instead of only asserting on
// generated SQL text. This fake is test-only; it is never shipped in
// index.html and real users still get the genuine sql.js from the CDN.
const FAKE_SQLJS = `
function parseValues(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    while (s[i] === ' ' || s[i] === ',') i++;
    if (i >= s.length) break;
    if (s[i] === "'") {
      i++;
      let v = '';
      while (i < s.length) {
        if (s[i] === "'") {
          if (s[i + 1] === "'") { v += "'"; i += 2; }
          else { i++; break; }
        } else v += s[i++];
      }
      out.push(v);
    } else {
      let v = '';
      while (i < s.length && s[i] !== ',') v += s[i++];
      out.push(v.trim());
    }
  }
  return out;
}
class FakeDatabase {
  constructor() { this.tables = {}; }
  run(sql) {
    sql.split(';').map(s => s.trim()).filter(Boolean).forEach(stmt => {
      let m;
      if ((m = stmt.match(/^CREATE TABLE\\s+"?(\\w+)"?\\s*\\(([\\s\\S]+)\\)$/i))) {
        const cols = m[2].split(',').map(c => c.trim().split(/\\s+/)[0].replace(/["'\`]/g, ''));
        this.tables[m[1]] = { cols, rows: [] };
      } else if ((m = stmt.match(/^INSERT INTO\\s+"?(\\w+)"?\\s*\\(([^)]+)\\)\\s*VALUES\\s*\\(([^)]+)\\)$/i))) {
        const table = this.tables[m[1]];
        const insertCols = m[2].split(',').map(c => c.trim());
        const vals = parseValues(m[3]);
        table.rows.push(table.cols.map(c => { const idx = insertCols.indexOf(c); return idx >= 0 ? vals[idx] : null; }));
      }
    });
  }
  exec(sql) {
    const m = sql.match(/SELECT\\s+\\*\\s+FROM\\s+"?(\\w+)"?/i);
    if (!m) return [];
    const table = this.tables[m[1]];
    if (!table || !table.rows.length) return [];
    return [{ columns: table.cols, values: table.rows }];
  }
}
window.initSqlJs = function() { return Promise.resolve({ Database: FakeDatabase }); };
`;

test.describe('Export results as CSV (F-017)', () => {
  test('Export CSV button is hidden until a query returns rows, then downloads a matching CSV', async ({ page }) => {
    await page.route('**/sql-wasm.js', route => route.fulfill({ contentType: 'application/javascript', body: FAKE_SQLJS }));

    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');

    await expect(page.locator('#btnExportCsv')).toBeHidden();

    await page.click('button[data-t="seed"]');
    await page.fill('#seedIn', `
      CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, email TEXT, city TEXT, created_at TEXT);
      INSERT INTO customers (id, name, email, city) VALUES (1, 'O''Brien', 'a@example.com', 'Boston');
      INSERT INTO customers (id, name, email, city) VALUES (2, 'Lee, Jane', 'b@example.com', 'NYC');
    `);
    await page.click('#btnSeed');
    await expect(page.locator('#seedMsg')).toContainText('DB loaded');

    await page.click('button[data-t="sql"]');
    await page.click('#btnRunTop');

    await expect(page.locator('#btnExportCsv')).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#btnExportCsv'),
    ]);
    expect(download.suggestedFilename()).toMatch(/^simplequery-results-.*\.csv$/);
    const csvPath = await download.path();
    const content = fs.readFileSync(csvPath, 'utf8');
    expect(content.split('\r\n')[0]).toBe('id,name,email,city,created_at');
    expect(content).toContain("O'Brien");
    expect(content).toContain('"Lee, Jane"');
  });
});
