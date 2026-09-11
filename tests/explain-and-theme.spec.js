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
    if (/^EXPLAIN QUERY PLAN/i.test(sql)) {
      return [{ columns: ['id', 'parent', 'notused', 'detail'], values: [[2, 0, 0, 'SCAN customers']] }];
    }
    return [];
  }
}
window.initSqlJs = function() { return Promise.resolve({ Database: FakeDatabase }); };
`;

test.describe('EXPLAIN QUERY PLAN view (F-035)', () => {
  test('shows the query plan and hides export buttons', async ({ page }) => {
    await page.route('**/sql-wasm.js', route => route.fulfill({ contentType: 'application/javascript', body: FAKE_SQLJS }));
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('#btnExplain');
    await expect(page.locator('#resultsArea')).toContainText('SCAN customers');
    await expect(page.locator('#exportRow')).toBeHidden();
  });
});

test.describe('Dark/light theme toggle (F-026)', () => {
  test('toggles the light class and persists the choice across reloads', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('body')).not.toHaveClass(/light/);
    await page.click('#btnTheme');
    await expect(page.locator('body')).toHaveClass(/light/);
    await page.reload();
    await expect(page.locator('body')).toHaveClass(/light/);
    await page.click('#btnTheme');
    await expect(page.locator('body')).not.toHaveClass(/light/);
  });
});
