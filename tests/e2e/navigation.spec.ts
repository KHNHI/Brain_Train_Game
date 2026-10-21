import { expect, test } from '@playwright/test';

test('home preview, catalog filters, guide tabs, and questions are interactive', async ({
  page,
}) => {
  await page.goto('/');
  const preview = page.getByRole('region', { name: 'Interactive cube preview' });
  const originalColors = await preview
    .locator('polygon')
    .evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute('fill')));
  await preview.getByRole('button', { name: 'Preview: turn green clockwise', exact: true }).click();
  await expect(preview.getByRole('status')).toHaveText('1 turn · Mixed');
  expect(
    await preview
      .locator('polygon')
      .evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute('fill'))),
  ).not.toEqual(originalColors);
  await preview.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(preview.getByRole('status')).toHaveText('0 turns · Solved');
  expect(
    await preview
      .locator('polygon')
      .evaluateAll((tiles) => tiles.map((tile) => tile.getAttribute('fill'))),
  ).toEqual(originalColors);
  const games = page.getByRole('region', { name: 'Games', exact: true });
  await games.getByRole('button', { name: 'Available now', exact: true }).click();
  await expect(games.getByRole('article')).toHaveCount(1);
  await games.getByRole('button', { name: 'In development', exact: true }).click();
  await expect(games.getByRole('article')).toHaveCount(2);
  await games.getByRole('button', { name: 'All games', exact: true }).click();
  await expect(games.getByRole('article')).toHaveCount(3);
  await page.getByRole('tab', { name: 'Get help', exact: false }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Hint: next turn');
  await page.getByRole('tab', { name: 'Get help', exact: false }).press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Make a move', exact: false })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.locator('summary').filter({ hasText: 'Do I need an account?' }).click();
  await expect(
    page.getByText('No. The cube is available without registration.', { exact: false }),
  ).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('homepage preview cannot overwrite a saved cube session', async ({ page }) => {
  await page.goto('/games/cube');
  await page.getByRole('button', { name: 'Turn green face clockwise', exact: true }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Home', exact: true })
    .click();
  const preview = page.getByRole('region', { name: 'Interactive cube preview' });
  await preview.getByRole('button', { name: 'Preview: turn green clockwise', exact: true }).click();
  await preview.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('link', { name: 'Play the cube', exact: false }).click();
  await expect(page.getByTestId('move-count')).toHaveText('01');
});

test('home introduces at most three games and opens the catalog and playable cube', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Interactive puzzles');
  const featured = page.getByRole('region', { name: 'Games', exact: true });
  expect(await featured.getByRole('article').count()).toBeLessThanOrEqual(3);
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await featured.getByRole('link', { name: 'See more', exact: false }).click();
  await expect(page).toHaveURL(/\/games$/);
  await expect(page.getByRole('heading', { name: 'All games', exact: true })).toBeVisible();
  await page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: '3×3 Cube', exact: true }) })
    .getByRole('link', { name: 'Play now', exact: false })
    .click();
  await expect(page).toHaveURL(/\/games\/cube$/);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Solve assistance' })).toBeVisible();
  await page.getByRole('button', { name: 'Turn green face clockwise', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Home', exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  await expect(page.getByTestId('move-count')).toHaveText('01');
  await page.reload();
  await expect(page.getByTestId('move-count')).toHaveText('01');
});

test('instructions deep link works and unfinished games are honest detail pages', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Instructions', exact: true }).click();
  await expect(page).toHaveURL(/\/games\/cube#instructions$/);
  await expect(page.getByText('Controls', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close instructions' }).click();
  await expect(page.getByText('Controls', { exact: true })).not.toBeVisible();
  await page.goto('/games/burr');
  await expect(page.getByRole('heading', { level: 1, name: 'Burr puzzle' })).toBeVisible();
  await expect(page.getByText('This game is not playable yet.', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Play now', exact: false })).toHaveCount(0);
  await page.goto('/games/unknown');
  await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toBeVisible();
});

test('home cards and navigation fit a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('link', { name: 'Play now', exact: false })).toBeVisible();
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'See more', exact: false }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
