// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Save/restore canvas layout (F-014)', () => {
  test('a manually dragged node position is restored after removing and re-adding it', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');

    const hdr = page.locator('#nd-customers .tnode-hdr');
    const box = await hdr.boundingBox();
    await page.mouse.move(box.x + 20, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 220, box.y + 160, { steps: 5 });
    await page.mouse.up();

    const draggedPos = await page.evaluate(() => ({ x: S.nodes.customers.x, y: S.nodes.customers.y }));

    await page.locator('#nd-customers .tnode-x').click();
    await expect(page.locator('#nd-customers')).toHaveCount(0);

    await page.locator('.tch').filter({ hasText: 'customers' }).click();
    const restoredPos = await page.evaluate(() => ({ x: S.nodes.customers.x, y: S.nodes.customers.y }));
    expect(restoredPos.x).toBeCloseTo(draggedPos.x, 0);
    expect(restoredPos.y).toBeCloseTo(draggedPos.y, 0);
  });
});

test.describe('Named saved schemas (F-034)', () => {
  test('saving, clearing, and loading a named schema restores it', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.fill('#saveSchemaName', 'my-test-schema');
    await page.click('#btnSaveSchema');

    await page.click('#btnClearSchema');
    await expect(page.locator('#tblBadge')).toHaveText('0');

    await page.selectOption('#savedSchemaSel', 'my-test-schema');
    await page.click('#btnLoadSchema');
    await expect(page.locator('#tblBadge')).toHaveText('4');
    await expect(page.locator('#parseMsg')).toContainText('my-test-schema');
  });
});

test.describe('Save query state across refresh (F-029)', () => {
  test('re-parsing the same schema after a reload restores the WHERE/FROM state', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'customers');
    await page.click('#btnAddWhere');
    const row = page.locator('.where-row').first();
    await row.locator('select').nth(0).selectOption('customers.city');
    await row.locator('input.ti').fill('Boston');

    await page.reload();
    await page.click('#btnSample');
    await page.click('#btnParse');

    await expect(page.locator('#fromSel')).toHaveValue('customers');
    await expect(page.locator('.where-row')).toHaveCount(1);
    await expect(page.locator('#sqlOut')).toContainText('Boston');
  });
});

test.describe('Share query via URL (F-030)', () => {
  test('a share link reproduces the query state on another load of the same schema', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard-read permission is only granted on Chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');
    await page.selectOption('#fromSel', 'products');
    await page.click('#btnShareUrl');
    const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(shareUrl).toContain('#q=');

    await page.goto(shareUrl);
    await page.click('#btnSample');
    await page.click('#btnParse');
    await expect(page.locator('#fromSel')).toHaveValue('products');
  });
});
