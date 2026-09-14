import { expect, test } from '@playwright/test';

/** Capture browser console and uncaught page errors for reading journeys. */
function captureBrowserErrors(page) {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

const fixturePosts = [
  { id: 'older', title: 'Older note', content: 'Older body', createdAt: '2024-01-01T00:00:00.000Z', authorId: 'owner' },
  { id: 'latest', title: 'Latest note', content: 'First paragraph.\n\nSecond paragraph with the complete post text.', createdAt: '2024-03-01T00:00:00.000Z', authorId: 'owner' },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript((posts) => {
    window.localStorage.clear();
    window.localStorage.setItem('writespace_posts', JSON.stringify(posts));
  }, fixturePosts);
});

test('guest preview links to login while authenticated readers can view full local content', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Latest note' })).toBeVisible();
  await page.getByRole('link', { name: 'Latest note' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.addInitScript(() => {
    window.localStorage.setItem('writespace_session', JSON.stringify({ userId: 'reader', username: 'reader', displayName: 'Reader', role: 'user' }));
  });
  await page.goto('/blog/latest');
  await expect(page.getByText('Second paragraph with the complete post text.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('owners can see management links without deleting from local storage', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('writespace_session', JSON.stringify({ userId: 'owner', username: 'owner', displayName: 'Owner', role: 'user' }));
  });
  await page.goto('/blog/latest');
  await expect(page.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/edit/latest');
  await expect(page.getByRole('link', { name: 'Delete' })).toHaveAttribute('href', '/edit/latest');
  expect(errors).toEqual([]);
});
