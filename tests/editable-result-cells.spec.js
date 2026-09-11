// @ts-check
const { test, expect } = require('@playwright/test');

const FAKE_SQLJS = `
class FakeDatabase {
  constructor() { this.tables = {}; }
  run(sql) {
    sql.split(';').map(s => s.trim()).filter(Boolean).forEach(stmt => {
      let m;
      if ((m = stmt.match(/^CREATE TABLE\\s+"?(\\w+)"?\\s*\\(([\\s\\S]+)\\)$/i))) {
        const cols = m[2].split(',').map(c => c.trim().split(/\\s+/)[0].replace(/["'\`]/g, ''));
        this.tables[m[1]] = { cols, rows: [[1, 'Alice']] };
      } else if ((m = stmt.match(/^UPDATE\\s+"?(\\w+)"?\\s+SET\\s+"?(\\w+)"?\\s*=\\s*(.+?)\\s+WHERE\\s+"?(\\w+)"?\\s*=\\s*(.+)$/i))) {
        const table = this.tables[m[1]];
        const colIdx = table.cols.indexOf(m[2]);
        const pkIdx = table.cols.indexOf(m[4]);
        const pkVal = m[5].replace(/'/g, '');
        const newVal = m[3] === 'NULL' ? null : m[3].replace(/'/g, '');
        table.rows.forEach(r => { if (String(r[pkIdx]) === pkVal) r[colIdx] = newVal; });
      }
    });
  }
  exec(sql) {
    const m = sql.match(/FROM\\s+"?(\\w+)"?/i);
    if (!m) return [];
    const table = this.tables[m[1]];
    if (!table || !table.rows.length) return [];
    return [{ columns: table.cols, values: table.rows.map(r => r.slice()) }];
  }
}
window.initSqlJs = function() { return Promise.resolve({ Database: FakeDatabase }); };
`;

test.describe('Editable result cells (F-020)', () => {
  test('clicking a non-PK cell edits it and issues an UPDATE for single-table queries', async ({ page }) => {
    await page.route('**/sql-wasm.js', route => route.fulfill({ contentType: 'application/javascript', body: FAKE_SQLJS }));
    await page.goto('/index.html');
    await page.fill('#ddlIn', 'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('button[data-t="seed"]');
    await page.fill('#seedIn', 'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);');
    await page.click('#btnSeed');
    await page.click('button[data-t="sql"]');
    await page.click('#btnRunTop');

    const nameCell = page.locator('#resultsArea td.editable-cell').first();
    await expect(nameCell).toContainText('Alice');
    await nameCell.click();
    await page.locator('#resultsArea input.ti').fill('Alicia');
    await page.locator('#resultsArea input.ti').press('Enter');

    await expect(page.locator('#resultsArea')).toContainText('Alicia');
    await expect(page.locator('#resultsArea')).not.toContainText('Alice ');
  });

  test('the primary key cell itself is not editable', async ({ page }) => {
    await page.route('**/sql-wasm.js', route => route.fulfill({ contentType: 'application/javascript', body: FAKE_SQLJS }));
    await page.goto('/index.html');
    await page.fill('#ddlIn', 'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('button[data-t="seed"]');
    await page.fill('#seedIn', 'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);');
    await page.click('#btnSeed');
    await page.click('button[data-t="sql"]');
    await page.click('#btnRunTop');

    const cells = page.locator('#resultsArea tbody td');
    await expect(cells.nth(0)).not.toHaveClass(/editable-cell/);
    await expect(cells.nth(1)).toHaveClass(/editable-cell/);
  });
});
