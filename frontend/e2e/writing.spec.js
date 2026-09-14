import { expect, test } from '@playwright/test';

/** Capture console and uncaught page errors for writing journeys. */
function captureBrowserErrors(page) {
  const errors = [];
  const isKnownDefaultPropsWarning = (message) => message.includes('Support for defaultProps will be removed');
  page.on('console', (message) => {
    if (message.type() === 'error' && !isKnownDefaultPropsWarning(message.text())) errors.push(message.text());
  });
  page.on('pageerror', (error) => {
    if (!isKnownDefaultPropsWarning(error.message)) errors.push(error.message);
  });
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

test('authenticated writer cannot publish a blank post', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.goto('/write');
  await page.getByRole('button', { name: 'Publish blog' }).click();

  await expect(page.getByRole('alert').filter({ hasText: 'Title is required.' })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Content is required.' })).toBeVisible();
  const posts = await page.evaluate(() => window.localStorage.getItem('writespace_posts'));
  expect(posts).toBeNull();
  expect(errors).toEqual([]);
});

test('authenticated writer can cancel without creating a post', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.goto('/write');
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page).toHaveURL(/\/blogs$/);
  const posts = await page.evaluate(() => window.localStorage.getItem('writespace_posts'));
  expect(posts).toBeNull();
  expect(errors).toEqual([]);
});

test('authenticated writer can dismiss then confirm deletion of an owned post', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('writespace_posts', JSON.stringify([{
      id: 'post-1',
      title: 'A post to revise',
      content: 'This owned post can be deleted.',
      authorId: 'writer',
      authorName: 'Writing User',
      createdAt: '2026-01-01T00:00:00.000Z',
    }]));
  });
  let deleteAttempts = 0;
  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toBe('Delete this post permanently?');
    if (deleteAttempts === 0) {
      await dialog.dismiss();
    } else {
      await dialog.accept();
    }
    deleteAttempts += 1;
  });
  await page.goto('/edit/post-1');

  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/edit\/post-1$/);
  const postsAfterDismissal = await page.evaluate(() => JSON.parse(window.localStorage.getItem('writespace_posts')));
  expect(postsAfterDismissal).toHaveLength(1);
  expect(postsAfterDismissal[0]).toMatchObject({ id: 'post-1', authorId: 'writer' });

  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/blogs$/);
  const postsAfterDeletion = await page.evaluate(() => JSON.parse(window.localStorage.getItem('writespace_posts')));
  expect(postsAfterDeletion).toEqual([]);
  expect(deleteAttempts).toBe(2);
  expect(errors).toEqual([]);
});
