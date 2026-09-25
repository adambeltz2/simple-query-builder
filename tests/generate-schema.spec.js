// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Generate a schema helper', () => {
  test('picking a preset domain, generating, and auto-populating fills the canvas', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnGenDdl');
    await expect(page.locator('#genDdlModal')).toBeVisible();

    await page.selectOption('#genDomain', 'blog');
    await expect(page.locator('#genCustomRow')).toBeHidden();
    await page.click('#btnGenDdlOk');

    await expect(page.locator('#genDdlModal')).toBeHidden();
    await expect(page.locator('#ddlIn')).toHaveValue(/CREATE TABLE authors/);
    await expect(page.locator('#tblBadge')).toHaveText('5');
    // auto-populate is checked by default, so all 5 tables should already be on canvas
    await expect(page.locator('.tnode')).toHaveCount(5);
  });

  test('custom topic generates a chain of N generic tables named after the topic', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnGenDdl');
    await page.selectOption('#genDomain', 'custom');
    await expect(page.locator('#genCustomRow')).toBeVisible();
    await page.fill('#genTopic', 'Fitness Club');
    await page.fill('#genTableCount', '4');
    await page.click('#btnGenDdlOk');

    await expect(page.locator('#tblBadge')).toHaveText('4');
    await expect(page.locator('#ddlIn')).toHaveValue(/CREATE TABLE fitness_club_categories/);
    await expect(page.locator('.tnode')).toHaveCount(4);
  });

  test('unchecking auto-populate only loads the DDL without touching the canvas', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnGenDdl');
    await page.selectOption('#genDomain', 'library');
    await page.click('#genAutoPopulate');
    await page.click('#btnGenDdlOk');

    await expect(page.locator('#ddlIn')).toHaveValue(/CREATE TABLE authors/);
    await expect(page.locator('#tblBadge')).toHaveText('0');
    await expect(page.locator('.tnode')).toHaveCount(0);
  });
});
