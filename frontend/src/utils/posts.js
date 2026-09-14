import { getPosts } from './storage';

/** Return a usable timestamp for posts carrying a valid-ish creation date. */
function getPostTimestamp(post) {
  if (!post || typeof post !== 'object') return Number.NaN;
  const value = post.createdAt ?? post.date ?? post.publishedAt;
  if (typeof value !== 'string' && typeof value !== 'number') return Number.NaN;
  return new Date(value).getTime();
}

/** Determine whether a post has enough data to appear in a public preview. */
export function isEligiblePreview(post) {
  return Boolean(
    post
      && typeof post.id === 'string'
      && post.id.trim()
      && typeof post.title === 'string'
      && post.title.trim()
      && Number.isFinite(getPostTimestamp(post)),
  );
}

/**
 * Return up to three valid post previews, newest first, without mutating persisted data.
 *
 * @param {Array<object>} posts Candidate posts, defaulting to safe browser-local storage.
 * @returns {Array<object>} Eligible posts ordered by descending creation date.
 */
export function getLatestPreviews(posts = getPosts()) {
  if (!Array.isArray(posts)) return [];
  return posts
    .filter(isEligiblePreview)
    .slice()
    .sort((first, second) => getPostTimestamp(second) - getPostTimestamp(first))
    .slice(0, 3);
}

/**
 * Find a local post by its route identifier.
 *
 * @param {string} id Post identifier from a route.
 * @param {Array<object>} posts Candidate post collection.
 * @returns {object|undefined} Matching post when available.
 */
export function findPostById(id, posts = getPosts()) {
  if (typeof id !== 'string' || !Array.isArray(posts)) return undefined;
  return posts.find((post) => post?.id === id);
}

/**
 * Decide whether a session may manage a post.
 *
 * @param {object|null} session Current validated session.
 * @param {object|null} post Post whose actions are being evaluated.
 * @returns {boolean} True for an administrator or the post author.
 */
export function canManagePost(session, post) {
  if (!session || !post) return false;
  return session.role === 'admin' || (session.role === 'user' && post.authorId === session.userId);
}
