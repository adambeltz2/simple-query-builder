// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Minimap (F-015)', () => {
  test('hidden with 0-1 nodes, visible with 2+ nodes on canvas', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');

    await expect(page.locator('#minimap')).toBeHidden();

    await page.locator('.tch').filter({ hasText: 'customers' }).click();
    await expect(page.locator('#minimap')).toBeHidden();

    await page.locator('.tch').filter({ hasText: 'orders' }).click();
    await expect(page.locator('#minimap')).toBeVisible();
    await expect(page.locator('#minimap rect')).toHaveCount(3); // 2 node rects + 1 viewport rect
  });

  test('minimap updates when a node is removed back below the threshold', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await expect(page.locator('#minimap')).toBeVisible();

    await page.locator('#nd-customers .tnode-x').click();
    await page.locator('#nd-orders .tnode-x').click();
    await page.locator('#nd-products .tnode-x').click();
    // Now only 1 node left (order_items) — minimap should hide again.
    await expect(page.locator('#minimap')).toBeHidden();
  });
});
