import { expect, test } from '@playwright/test';

test('shows a Voronoi overlay and histogram that follow the aperture geometry', async ({
  page,
}) => {
  await page.goto('/setup');
  const elementsX = page.locator('[data-test-id="elementsX"]');
  const elementsY = page.locator('[data-test-id="elementsY"]');
  await elementsX.fill('2');
  await elementsY.fill('2');

  const aperture = page.getByRole('button', { name: 'Aperture', exact: true });
  await aperture.click();
  const toggle = page.getByRole('checkbox', { name: 'Show Voronoi partition' });
  const cells = page.locator('app-aperture-view polygon');
  const histogram = page.locator('app-aperture-area-chart');
  await expect(cells).toHaveCount(0);
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(cells).toHaveCount(4);
  await expect(histogram.locator('canvas')).toBeVisible();
  await expect(histogram.getByText('Show histogram data')).toHaveCount(0);

  await elementsX.fill('3');
  await expect(cells).toHaveCount(6);

  const bars = histogram.locator('canvas');
  const bounds = await bars.boundingBox();
  if (!bounds) throw new Error('Expected a visible histogram');
  const highlighted = page.locator('app-aperture-view polygon.highlighted');
  // The 3×2 array has two discrete bars with 4 and 2 cells respectively.
  await expect(histogram.locator('figure')).toHaveAccessibleDescription(
    /4 cells at [\d.]+ square millimetres\. 2 cells at [\d.]+ square millimetres\./,
  );
  const binWidth = (bounds.width - 36 - 12) / 2;
  await bars.hover({ position: { x: 36 + binWidth / 2, y: 140 } });
  await expect(highlighted).toHaveCount(4);
  await bars.hover({ position: { x: 36 + binWidth * 1.5, y: 140 } });
  await expect(highlighted).toHaveCount(2);
  await expect(cells.nth(1)).toHaveClass('highlighted');
  await expect(cells.nth(4)).toHaveClass('highlighted');
  await toggle.hover();
  await expect(highlighted).toHaveCount(0);

  await elementsY.fill('1');
  await expect(
    page.getByText('The element centres do not enclose an area.', { exact: false }),
  ).toBeVisible();
  await expect(cells).toHaveCount(0);
  await expect(histogram).toHaveCount(0);
});
