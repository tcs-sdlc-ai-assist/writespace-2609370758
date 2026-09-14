import { expect, test } from '@playwright/test';

/** Capture console and uncaught page errors for every identity journey. */
function captureBrowserErrors(page) {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test('registers a browser-local user and retains the created session', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.goto('/register');
  await page.getByLabel('Display Name').fill('Mina');
  await page.getByLabel('Username').fill('mina');
  await page.getByLabel('Password', { exact: true }).fill('secret');
  await page.getByLabel('Confirm Password').fill('secret');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/blogs$/);
  const session = await page.evaluate(() => JSON.parse(window.localStorage.getItem('writespace_session')));
  expect(session).toMatchObject({ username: 'mina', displayName: 'Mina', role: 'user' });
  expect(errors).toEqual([]);
});

test('rejects invalid credentials without creating a session or browser errors', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.goto('/login');
  await page.getByLabel('Username').fill('not-a-user');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('alert')).toHaveText('Invalid username or password.');
  await expect(page).toHaveURL(/\/login$/);
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('writespace_session'))).toBeNull();
  expect(errors).toEqual([]);
});

test('logs in with admin precedence, then logs out through visible navigation without browser errors', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.goto('/login');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const session = await page.evaluate(() => JSON.parse(window.localStorage.getItem('writespace_session')));
  expect(session).toMatchObject({ userId: 'admin', role: 'admin' });

  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('navigation', { name: 'Public navigation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Logout' })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('writespace_session'))).toBeNull();
  expect(errors).toEqual([]);
});
