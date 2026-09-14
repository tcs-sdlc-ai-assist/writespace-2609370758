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

test('guest preview links to login', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Latest note' })).toBeVisible();
  await page.getByRole('link', { name: 'Latest note' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(errors).toEqual([]);
});

test('authenticated readers open the latest post from the landing page and view its full content', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('writespace_session', JSON.stringify({ userId: 'reader', username: 'reader', displayName: 'Reader', role: 'user' }));
  });
  await page.goto('/');

  await page.getByRole('link', { name: 'Read post' }).first().click();
  await expect(page).toHaveURL(/\/blog\/latest$/);
  await expect(page.getByRole('heading', { name: 'Latest note' })).toBeVisible();
  await expect(page.getByText('First paragraph.')).toBeVisible();
  await expect(page.getByText('Second paragraph with the complete post text.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('owners can see management links after opening a post from the landing page', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('writespace_session', JSON.stringify({ userId: 'owner', username: 'owner', displayName: 'Owner', role: 'user' }));
  });
  await page.goto('/');

  await page.getByRole('link', { name: 'Latest note' }).click();
  await expect(page.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/edit/latest');
  await expect(page.getByRole('link', { name: 'Delete' })).toHaveAttribute('href', '/edit/latest');
  expect(errors).toEqual([]);
});

test('landing page shows the exact empty state without article cards or links', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem('writespace_posts', JSON.stringify([]));
  });
  await page.goto('/');

  await expect(page.getByText('No posts yet — check back soon!', { exact: true })).toBeVisible();
  await expect(page.locator('article')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Read post' })).toHaveCount(0);
  expect(errors).toEqual([]);
});
