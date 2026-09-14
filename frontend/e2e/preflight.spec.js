import { expect, test } from '@playwright/test';

const fixturePosts = [
  {
    id: 'quiet-morning',
    title: 'Quiet morning notes',
    content: 'A fixture-backed entry for the release preflight.',
    createdAt: '2024-05-02T09:30:00.000Z',
    authorId: 'writer',
    authorName: 'Release Writer',
  },
];

/** Capture browser console and uncaught errors so a visible page cannot hide failures. */
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

/** Seed the browser-local demo records before navigation. */
async function seedLocalFixtures(page) {
  await page.addInitScript((posts) => {
    window.localStorage.clear();
    window.localStorage.setItem('writespace_posts', JSON.stringify(posts));
    window.localStorage.setItem('writespace_session', JSON.stringify({
      userId: 'writer',
      username: 'writer',
      displayName: 'Release Writer',
      role: 'user',
    }));
  }, fixturePosts);
}

test('desktop landing renders the local preview with its editorial hierarchy', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await seedLocalFixtures(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  const heading = page.getByRole('heading', { level: 1, name: 'Words worth making time for.' });
  await expect(heading).toBeVisible();
  await expect(page.getByRole('region', { name: 'latest-posts' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Quiet morning notes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Quiet morning notes' })).toHaveAttribute('href', '/blog/quiet-morning');

  const fontFamily = await heading.evaluate((element) => getComputedStyle(element).fontFamily);
  expect(fontFamily).toContain('Fraunces');
  await page.screenshot({ path: 'test-results/preflight-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('mobile landing retains the semantic reading structure and fixture content', async ({ page }) => {
  const errors = captureBrowserErrors(page);
  await seedLocalFixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Words worth making time for.' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'latest-posts' })).toContainText('Quiet morning notes');
  await expect(page.getByText('Newest first')).toBeVisible();

  const mainWidth = await page.locator('main').evaluate((element) => element.getBoundingClientRect().width);
  expect(mainWidth).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/preflight-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});
