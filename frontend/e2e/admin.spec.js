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
      userId: 'active-admin', username: 'active-admin', displayName: 'Active Admin', role: 'admin',
    }));
    window.localStorage.setItem('writespace_users', JSON.stringify([
      { id: 'active-admin', displayName: 'Active Admin', username: 'active-admin', password: 'secret', role: 'admin' },
    ]));
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
  await expect(page.getByRole('button', { name: 'Delete Admin is unavailable' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Delete Active Admin is unavailable' })).toBeDisabled();
  await page.getByLabel('Display Name').fill('Browser User');
  await page.getByLabel('Username').fill('browser-user');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Add user' }).click();
  await expect(page.getByRole('status')).toContainText('Browser User was added.');
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem('writespace_users')))).toEqual(expect.arrayContaining([
    expect.objectContaining({ displayName: 'Browser User', username: 'browser-user', role: 'user' }),
  ]));
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete Browser User' }).first().click();
  await expect(page.getByText('Browser User')).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem('writespace_users')))).toEqual([
    expect.objectContaining({ id: 'active-admin', username: 'active-admin', role: 'admin' }),
  ]);
  expect(errors).toEqual([]);
});
