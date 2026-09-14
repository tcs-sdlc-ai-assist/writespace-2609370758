import PropTypes from 'prop-types';

/**
 * Render a small role-distinguishing avatar.
 *
 * Args:
 *   role: Current visitor role.
 * Returns:
 *   A decorative role avatar.
 */
export function getAvatar(role) {
  const isAdmin = role === 'admin';
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-base ${
        isAdmin ? 'bg-ochre text-white' : 'bg-moss text-white'
      }`}
    >
      {isAdmin ? 'A' : 'W'}
    </span>
  );
}

/** Render a role avatar as a component. */
export default function Avatar({ role }) {
  return getAvatar(role);
}

Avatar.propTypes = {
  role: PropTypes.oneOf(['admin', 'user']).isRequired,
};
