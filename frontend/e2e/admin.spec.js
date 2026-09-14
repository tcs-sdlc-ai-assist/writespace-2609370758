import { expect, test } from '@playwright/test';

/** Capture console and uncaught page errors for administration journeys. */
function captureBrowserErrors(page) {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem('writespace_session', JSON.stringify({
      userId: 'admin', username: 'admin', displayName: 'Admin', role: 'admin',
    }));
  });
});

test('admin views ordered dashboard data, creates a user, and deletes only that user', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('writespace_posts', JSON.stringify([
      { id: 'older', title: 'Older post', createdAt: '2024-01-01T00:00:00.000Z' },
      { id: 'newer', title: 'Newer post', createdAt: '2024-02-01T00:00:00.000Z' },
    ]));
  });
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Newer post' })).toBeVisible();
  await page.getByRole('link', { name: 'Manage users' }).click();
  await page.getByLabel('Display Name').fill('Browser User');
  await page.getByLabel('Username').fill('browser-user');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Add user' }).click();
  await expect(page.getByRole('status')).toContainText('Browser User was added.');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete Browser User' }).first().click();
  await expect(page.getByText('Browser User')).not.toBeVisible();
  expect(errors).toEqual([]);
});
