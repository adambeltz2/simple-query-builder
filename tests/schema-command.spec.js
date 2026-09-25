// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Schema extraction sample command (per dialect)', () => {
  test('defaults to the SQLite sqlite_master query', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#schemaCmdDialect')).toHaveText('SQLite');
    await expect(page.locator('#schemaCmdOut')).toContainText('FROM sqlite_master');
  });

  test('switches to a mysqldump command when MySQL is selected', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('[data-d="mysql"]');
    await expect(page.locator('#schemaCmdDialect')).toHaveText('MySQL');
    await expect(page.locator('#schemaCmdOut')).toContainText('mysqldump');
  });

  test('switches to a pg_dump command when PostgreSQL is selected', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('[data-d="postgres"]');
    await expect(page.locator('#schemaCmdDialect')).toHaveText('PostgreSQL');
    await expect(page.locator('#schemaCmdOut')).toContainText('pg_dump');
  });

  test('copy button copies the current dialect command to the clipboard', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard-read permission is only granted on Chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/index.html');
    await page.click('[data-d="postgres"]');
    await page.click('#discSchemaTools summary');
    await page.click('#btnCopySchemaCmd');
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('pg_dump');
  });

  test('reverts to the SQLite command when switching back', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('[data-d="mysql"]');
    await page.click('[data-d="sqlite"]');
    await expect(page.locator('#schemaCmdDialect')).toHaveText('SQLite');
    await expect(page.locator('#schemaCmdOut')).toContainText('FROM sqlite_master');
  });
});
