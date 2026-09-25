// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Progressive-disclosure UI cleanup (v0.6.0)', () => {
  test('schema tools (get-command, import/export, saved schemas) are collapsed by default', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#discSchemaTools')).not.toHaveJSProperty('open', true);
    await expect(page.locator('#schemaCmdOut')).toBeHidden();
    await expect(page.locator('#btnExportSchemaJson')).toBeHidden();

    await page.click('#discSchemaTools summary');
    await expect(page.locator('#discSchemaTools')).toHaveJSProperty('open', true);
    await expect(page.locator('#schemaCmdOut')).toBeVisible();
    await expect(page.locator('#btnExportSchemaJson')).toBeVisible();
  });

  test('advanced query clauses (Having, Union) are collapsed by default', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#discAdvanced')).not.toHaveJSProperty('open', true);
    await expect(page.locator('#btnAddHaving')).toBeHidden();
    await expect(page.locator('#unionType')).toBeHidden();

    await page.click('#discAdvanced summary');
    await expect(page.locator('#discAdvanced')).toHaveJSProperty('open', true);
    await expect(page.locator('#btnAddHaving')).toBeVisible();
    await expect(page.locator('#unionType')).toBeVisible();
  });

  test('core builder sections (From, Joins, Select Columns, Where) remain visible without expanding anything', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#fromSel')).toBeVisible();
    await expect(page.locator('#btnAddJoin')).toBeVisible();
    await expect(page.locator('#colSel')).toBeVisible();
    await expect(page.locator('#btnAddWhere')).toBeVisible();
  });
});
