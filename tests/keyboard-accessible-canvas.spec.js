// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Keyboard-accessible canvas interactions (F-037)', () => {
  test('a canvas node is focusable and carries an ARIA label', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');

    const node = page.locator('#nd-customers');
    await expect(node).toHaveAttribute('tabindex', '0');
    await expect(node).toHaveAttribute('aria-label', /Table customers/);
  });

  test('arrow keys nudge the focused/selected node and Shift moves it further', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');

    await page.locator('#nd-customers').focus();
    const before = await page.evaluate(() => ({ ...S.nodes.customers }));

    await page.keyboard.press('ArrowRight');
    const afterOne = await page.evaluate(() => ({ ...S.nodes.customers }));
    expect(afterOne.x).toBe(before.x + 10);
    expect(afterOne.y).toBe(before.y);

    await page.keyboard.press('Shift+ArrowDown');
    const afterTwo = await page.evaluate(() => ({ ...S.nodes.customers }));
    expect(afterTwo.y).toBe(afterOne.y + 40);
  });

  test('join port dots and column rows carry ARIA labels for screen readers', async ({ page }) => {
    await page.goto('/index.html');
    await page.click('#btnSample');
    await page.click('#btnParse');
    await page.click('#btnAddAll');

    const port = page.locator('#nd-customers .port').first();
    await expect(port).toHaveAttribute('aria-label', /Join handle/);
    const colRow = page.locator('#nd-customers .tnode-col').first();
    await expect(colRow).toHaveAttribute('role', 'checkbox');
    await expect(colRow).toHaveAttribute('aria-checked', 'false');
  });
});
