const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();

  // Open new page
  const page = await context.newPage();

  // Go to http://localhost:4200/
  await page.goto('http://localhost:4200/');

  // Click mat-expansion-panel-header[role="button"]:has-text("Environment")
  await page.locator('mat-expansion-panel-header[role="button"]:has-text("Environment")').click();

  // Click text=Air, c = 343 m/s
  await page.locator('text=Air, c = 343 m/s').click();

  // Click mat-expansion-panel-header[role="button"]:has-text("Array config")
  await page.locator('mat-expansion-panel-header[role="button"]:has-text("Array config")').click();

  // Click #mat-input-0
  await page.locator('#mat-input-0').click();

  // Click #mat-input-0
  await page.locator('#mat-input-0').click();

  // Click #mat-input-1
  await page.locator('#mat-input-1').click();

  // Click #mat-input-2
  await page.locator('#mat-input-2').click();

  // Click #mat-input-3
  await page.locator('#mat-input-3').click();

  // Click mat-expansion-panel-header[role="button"]:has-text("Beamforming")
  await page.locator('mat-expansion-panel-header[role="button"]:has-text("Beamforming")').click();

  // Click text=Algorithm: Fourier | Pick on plane
  await page.locator('text=Algorithm: Fourier | Pick on plane').click();

  // ---------------------
  await context.close();
  await browser.close();
})();
