export const SESSION_KEY = 'writespace_session';
export const ADMIN_SESSION = {
  userId: 'admin',
  username: 'admin',
  displayName: 'Admin',
  role: 'admin',
};

/**
 * Check whether a value satisfies the browser-local session contract.
 *
 * Args:
 *   value: Unknown parsed value to inspect.
 * Returns:
 *   True when all required session fields are valid.
 */
export function isValidSession(value) {
  return Boolean(
    value
      && typeof value === 'object'
      && typeof value.userId === 'string'
      && value.userId.trim()
      && typeof value.username === 'string'
      && value.username.trim()
      && typeof value.displayName === 'string'
      && value.displayName.trim()
      && (value.role === 'user' || value.role === 'admin'),
  );
}

/**
 * Read a validated session without exposing browser storage failures.
 *
 * Returns:
 *   A valid session object, or null when it is missing or malformed.
 */
export function getSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    return isValidSession(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

/**
 * Persist a validated local session.
 *
 * Args:
 *   session: Session identity to persist.
 * Returns:
 *   Nothing.
 * Raises:
 *   TypeError: When session does not meet the session contract.
 */
export function setSession(session) {
  if (!isValidSession(session)) {
    throw new TypeError('Session is invalid.');
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Clear only the local identity session. */
export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    // A failed remove leaves the app fail-closed on its next guarded read.
  }
}
