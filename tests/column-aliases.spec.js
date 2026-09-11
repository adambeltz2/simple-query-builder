// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Column aliases (F-009)', () => {
  test('checking a column reveals an alias input, and the alias appears as AS in generated SQL', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');

    const group = page.locator('.col-group').filter({ hasText: 'customers' });
    await group.locator('.col-check', { hasText: 'name' }).locator('input[type=checkbox]').check();

    const aliasInput = group.locator('.alias-input');
    await expect(aliasInput).toBeVisible();
    await aliasInput.fill('customer_name');

    await expect(page.locator('#sqlOut')).toContainText('"customers"."name" AS "customer_name"');
  });

  test('unchecking a column hides its alias input and drops the alias from the SQL', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');

    const group = page.locator('.col-group').filter({ hasText: 'customers' });
    const checkbox = group.locator('.col-check', { hasText: 'name' }).locator('input[type=checkbox]');
    await checkbox.check();
    await group.locator('.alias-input').fill('customer_name');
    await checkbox.uncheck();

    await expect(group.locator('.alias-input')).toHaveCount(0);
    await expect(page.locator('#sqlOut')).not.toContainText('AS "customer_name"');
  });
});
