import { expect, test } from '@playwright/test';

test('next-turn hints and full instructions solve a scramble without revealing or moving early', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('/games/cube');
  await page.getByRole('button', { name: 'Scramble', exact: true }).click();
  await page.getByRole('button', { name: 'Hint: next turn', exact: true }).click();
  await expect(page.getByTestId('next-turn')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByTestId('move-count')).toHaveText('00');
  await expect(page.getByRole('list', { name: 'Solution steps' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Select hinted face', exact: true }).click();
  await page.getByRole('button', { name: 'Show solution', exact: true }).click();
  const steps = page.getByRole('list', { name: 'Solution steps' }).locator('li');
  await expect(steps.first()).toBeVisible();
  const count = await steps.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(64);
  await page.screenshot({ path: 'test-results/cube-solution.png', fullPage: true });
  for (let i = 0; i < count; i++) {
    await page.getByRole('button', { name: 'Apply next turn', exact: true }).click();
    await expect(page.getByTestId('move-count')).toHaveText(String(i + 1).padStart(2, '0'));
  }
  await expect(page.locator('.state-label')).toHaveText('Solved');
  await expect(page.getByRole('button', { name: 'Hint: next turn', exact: true })).toBeDisabled();
});

test('solver calculation can be cancelled while puzzle controls remain usable', async ({
  page,
}) => {
  await page.goto('/games/cube');
  await page.getByRole('button', { name: 'Scramble', exact: true }).click();
  await page.getByRole('button', { name: 'Show solution', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hint: next turn', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Turn green face clockwise', exact: true }).click();
  await expect(page.getByTestId('move-count')).toHaveText('01');
});

test('changing the puzzle cancels a search and undo does not resurrect it', async ({ page }) => {
  await page.goto('/games/cube');
  await page.getByRole('button', { name: 'Scramble', exact: true }).click();
  await page.getByRole('button', { name: 'Show solution', exact: true }).click();
  await page.getByRole('button', { name: 'Turn green face clockwise', exact: true }).click();
  await expect(page.getByTestId('move-count')).toHaveText('01');
  await page.getByRole('button', { name: 'Undo', exact: false }).click();
  await expect(page.getByTestId('move-count')).toHaveText('00');
  await expect(page.getByRole('button', { name: 'Hint: next turn', exact: true })).toBeEnabled();
  await expect(page.getByText('Calculating locally…', { exact: false })).not.toBeVisible();
});

test('free rotation can flip the view and reset without changing the puzzle', async ({ page }) => {
  await page.goto('/games/cube');
  const canvas = page.locator('canvas');
  await expect.poll(async () => (await canvas.boundingBox())?.height ?? 0).toBeGreaterThan(400);
  const before = await canvas.screenshot();
  const bounds = (await canvas.boundingBox())!;
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + 12;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + (bounds.width * Math.PI) / 5, { steps: 40 });
  await page.mouse.up();
  await expect(page.getByTestId('move-count')).toHaveText('00');
  await expect(page.getByText('Green face selected', { exact: true })).toBeVisible();
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBe(false);
  await page.screenshot({ path: 'test-results/cube-upside-down.png', fullPage: true });
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await expect.poll(async () => (await canvas.screenshot()).equals(before)).toBe(true);
  await expect(page.getByTestId('move-count')).toHaveText('00');
});

test('color selection stays attached to the same face when the view rotates', async ({ page }) => {
  await page.goto('/games/cube');
  for (const color of ['white', 'red', 'green', 'yellow', 'orange', 'blue']) {
    await expect(
      page.getByRole('button', { name: `Select ${color} face`, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole('button', { name: 'Select white face', exact: true }).click();
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const bounds = (await canvas.boundingBox())!;
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 3;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 80, y + 170, { steps: 20 });
  await page.mouse.up();
  await expect(page.getByText('White face selected', { exact: true })).toBeVisible();
  await expect(page.getByTestId('move-count')).toHaveText('00');
  await page.getByRole('button', { name: 'Turn white face clockwise', exact: true }).click();
  await expect(page.getByTestId('move-count')).toHaveText('01');
  await expect(
    page
      .getByRole('region', { name: 'Cube practice' })
      .getByRole('button', { name: 'Select white face', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Recent moves').locator('code')).toHaveText('U');
  await page.screenshot({ path: 'test-results/cube-color-orbit.png', fullPage: true });
});

test('production headers restrict scripts, framing and device permissions', async ({ page }) => {
  test.skip(test.info().project.name !== 'production', 'Production asset policy only');
  const response = await page.goto('/games/cube');
  const headers = response!.headers();
  expect(headers['content-security-policy']).toContain("script-src 'self'");
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['content-security-policy']).not.toContain("'unsafe-eval'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['permissions-policy']).toContain('camera=()');
  await expect(page.locator('canvas')).toBeVisible();
  const blocked = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        document.addEventListener(
          'securitypolicyviolation',
          (event) => {
            if (event.violatedDirective === 'script-src-elem') resolve(true);
          },
          { once: true },
        );
        const script = document.createElement('script');
        script.textContent = "document.body.setAttribute('data-untrusted-script', 'ran')";
        document.head.appendChild(script);
        setTimeout(() => resolve(false), 1000);
      }),
  );
  expect(blocked).toBe(true);
  await expect(page.locator('body')).not.toHaveAttribute('data-untrusted-script', 'ran');
});

test('turn, undo, redo, restore and reset a real session', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/games/cube');
  const turn = page.getByRole('button', { name: 'Turn green face clockwise', exact: true });
  await expect(turn).toBeEnabled();
  await expect(page.locator('canvas')).toBeVisible();
  await page.screenshot({ path: 'test-results/workshop-desktop.png', fullPage: true });
  const canvas = (await page.locator('canvas').boundingBox())!;
  const counterclockwise = (await page
    .getByRole('button', { name: 'Turn green face counterclockwise', exact: true })
    .boundingBox())!;
  const clockwise = (await turn.boundingBox())!;
  expect(counterclockwise.x + counterclockwise.width / 2).toBeLessThan(canvas.x + canvas.width / 2);
  expect(clockwise.x + clockwise.width / 2).toBeGreaterThan(canvas.x + canvas.width / 2);
  expect(counterclockwise.y).toBeGreaterThanOrEqual(canvas.y);
  expect(clockwise.y + clockwise.height).toBeLessThanOrEqual(canvas.y + canvas.height);
  await turn.click();
  await expect(page.getByTestId('move-count')).toHaveText('01');
  await page.getByRole('button', { name: 'Undo', exact: false }).click();
  await expect(page.getByTestId('move-count')).toHaveText('00');
  await page.getByRole('button', { name: 'Redo', exact: false }).click();
  await expect(page.getByTestId('move-count')).toHaveText('01');
  await expect(page.getByText('Saved on this device')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('move-count')).toHaveText('01');
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, reset' }).click();
  await expect(page.getByTestId('move-count')).toHaveText('00');
  expect(errors).toEqual([]);
});

test('mobile controls fit and face selection changes turn commands', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/games/cube');
  await page.getByRole('button', { name: 'Select red face', exact: true }).click();
  const arrow = page.getByRole('button', { name: 'Turn red face counterclockwise', exact: true });
  await expect
    .poll(async () => (await page.locator('canvas').boundingBox())?.height ?? 0)
    .toBeGreaterThan(300);
  const cube = (await page.locator('canvas').boundingBox())!;
  const arrowBox = (await arrow.boundingBox())!;
  expect(arrowBox.y).toBeGreaterThanOrEqual(cube.y);
  expect(arrowBox.y + arrowBox.height).toBeLessThanOrEqual(cube.y + cube.height);
  await arrow.press('Enter');
  await expect(page.getByTestId('move-count')).toHaveText('01');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByLabel('Sticker markings').check();
  await expect(page.getByLabel('Sticker markings')).toBeChecked();
  await page.screenshot({ path: 'test-results/workshop-mobile.png', fullPage: true });
});

test('unsupported saved data is preserved instead of overwritten', async ({ page }) => {
  await page.goto('/games/cube');
  await expect(page.getByText('Local saves ready')).toBeVisible();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('brain-trainer-guest', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      tx.objectStore('sessions').put({ version: 99, important: 'preserve-me' }, 'cube');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await expect(page.getByText('Local save unavailable')).toBeVisible();
  await page.getByRole('button', { name: 'Turn green face clockwise', exact: true }).click();
  await expect(page.getByTestId('move-count')).toHaveText('01');
  const stored = await page.evaluate(async () => {
    const request = indexedDB.open('brain-trainer-guest', 1);
    const db = await new Promise<IDBDatabase>((resolve) => {
      request.onsuccess = () => resolve(request.result);
    });
    const value = await new Promise<unknown>((resolve) => {
      const get = db.transaction('sessions').objectStore('sessions').get('cube');
      get.onsuccess = () => resolve(get.result);
    });
    db.close();
    return value;
  });
  expect(stored).toEqual({ version: 99, important: 'preserve-me' });
});
