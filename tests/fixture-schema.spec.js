// @ts-check
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const FIXTURE_PATH = path.join(__dirname, '..', 'test', 'sample_schema.sql');

test.describe('sqlite_master fixture (I-002 / B-001 / B-004 regression)', () => {
  test('parses the sqlite_master fixture with rootpage + escaped-quote DEFAULT/CHECK', async ({ page }) => {
    const fixture = fs.readFileSync(FIXTURE_PATH, 'utf8');
    await page.goto('/index.html');
    await page.fill('#ddlIn', fixture);
    await page.click('#btnParse');
    await expect(page.locator('#parseMsg')).toContainText('3 table(s)');
    await expect(page.locator('#parseMsg')).toContainText('1 view(s)');
    await expect(page.locator('#tblBadge')).toHaveText('3');
  });
});
