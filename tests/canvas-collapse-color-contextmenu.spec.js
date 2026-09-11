// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Collapse table nodes (F-012)', () => {
  test('clicking the collapse toggle hides columns and toggling back shows them', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');

    const node = page.locator('#nd-customers');
    const colsWrap = node.locator('> div').nth(1);
    await expect(colsWrap).toBeVisible();

    await node.locator('.tnode-collapse').click();
    await expect(colsWrap).toBeHidden();
    await expect(node.locator('.tnode-collapse')).toHaveText('▸');

    await node.locator('.tnode-collapse').click();
    await expect(colsWrap).toBeVisible();
    await expect(node.locator('.tnode-collapse')).toHaveText('▾');
  });
});

test.describe('Right-click context menu on canvas (F-016)', () => {
  test('right-clicking empty canvas shows layout actions', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');

    await page.locator('#canvasArea').click({ button: 'right', position: { x: 10, y: 240 } });
    const menu = page.locator('#ctxMenu');
    await expect(menu).toBeVisible();
    await expect(menu).toContainText('Auto Layout');
    await expect(menu).toContainText('Reset View');

    await page.locator('body').click({ position: { x: 5, y: 5 } });
    await expect(menu).toBeHidden();
  });

  test('right-clicking a node header shows node actions and a color picker (F-013)', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');

    const node = page.locator('#nd-customers');
    await node.locator('.tnode-hdr').click({ button: 'right' });
    const menu = page.locator('#ctxMenu');
    await expect(menu).toBeVisible();
    await expect(menu).toContainText('Collapse');
    await expect(menu).toContainText('Remove from canvas');

    await menu.locator('.ctx-color').first().click();
    await expect(node.locator('.tnode-hdr')).toHaveCSS('border-left-width', '3px');
  });
});
