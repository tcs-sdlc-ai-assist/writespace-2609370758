export const POSTS_KEY = 'writespace_posts';
export const USERS_KEY = 'writespace_users';

/**
 * Read an array from browser storage without allowing storage failures to escape.
 *
 * Args:
 *   key: Browser storage key to read.
 * Returns:
 *   The parsed array, or an empty array when it is unavailable or invalid.
 */
function readArray(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

/**
 * Write a validated array to browser storage.
 *
 * Args:
 *   key: Browser storage key to write.
 *   records: Array of records to persist.
 * Returns:
 *   Nothing.
 * Raises:
 *   TypeError: When records is not an array.
 *   Error: When browser storage cannot be written.
 */
function writeArray(key, records) {
  if (!Array.isArray(records)) {
    throw new TypeError('Storage records must be an array.');
  }
  window.localStorage.setItem(key, JSON.stringify(records));
}

/** Return the safely parsed local post collection. */
export function getPosts() {
  return readArray(POSTS_KEY);
}

/** Persist a complete local post collection. */
export function savePosts(posts) {
  writeArray(POSTS_KEY, posts);
}

/** Return the safely parsed local user collection. */
export function getUsers() {
  return readArray(USERS_KEY);
}

/** Persist a complete local user collection. */
export function saveUsers(users) {
  writeArray(USERS_KEY, users);
}
