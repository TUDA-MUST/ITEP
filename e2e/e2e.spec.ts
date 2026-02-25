import { test, expect, Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:4200/');
});

test.describe('Sidebar', () => {
  test('Can open environment', async ({ page }) => {
    await page.locator('mat-expansion-panel-header[role="button"]:has-text("Environment")').click();
    await expect(page.locator('text=Air, c = 343 m/s')).toBeVisible();
  });

  test('Can open array config', async ({ page }) => {
    await page
      .locator('mat-expansion-panel-header[role="button"]:has-text("Array config")')
      .click();
    await expect(await page.inputValue('data-test-id=elementsX')).toBe('2');
    await expect(await page.inputValue('data-test-id=elementsY')).toBe('2');
    await expect(await page.inputValue('data-test-id=pitchX')).toBe('0.0043');
    await expect(await page.inputValue('data-test-id=pitchY')).toBe('0.0043');
  });

  test('Updates number of array elements', async ({ page }) => {
    await page
      .locator('mat-expansion-panel-header[role="button"]:has-text("Array config")')
      .click();
    await expect(await page.locator('data-test-id=numTransducers')).toContainText('4');
    await page.locator('data-test-id=elementsX').fill('3');
    await expect(await page.locator('data-test-id=numTransducers')).toContainText('6');
  });
});
