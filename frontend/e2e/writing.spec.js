import { expect, test } from '@playwright/test';

/** Capture console and uncaught page errors for writing journeys. */
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
      userId: 'writer', username: 'writer', displayName: 'Writing User', role: 'user',
    }));
  });
});

test('authenticated writer publishes a post and reads the saved content', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.goto('/write');
  await page.getByLabel('Title').fill('A browser journey');
  await page.getByLabel('Content').fill('This content was published from the writing form.');
  await page.getByRole('button', { name: 'Publish blog' }).click();

  await expect(page).toHaveURL(/\/blog\//);
  await expect(page.getByRole('heading', { name: 'A browser journey' })).toBeVisible();
  await expect(page.getByText('This content was published from the writing form.')).toBeVisible();
  const posts = await page.evaluate(() => JSON.parse(window.localStorage.getItem('writespace_posts')));
  expect(posts).toHaveLength(1);
  expect(posts[0]).toMatchObject({ title: 'A browser journey', authorId: 'writer', authorName: 'Writing User' });
  expect(errors).toEqual([]);
});
