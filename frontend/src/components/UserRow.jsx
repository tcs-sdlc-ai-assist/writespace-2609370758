import PropTypes from 'prop-types';
import Avatar from './Avatar';

/** Render a user record in either a responsive card list or table body. */
export default function UserRow({ user, currentUserId, onDelete, variant = 'card' }) {
  const isProtected = user.username.toLowerCase() === 'admin' || user.id === currentUserId;
  const deleteLabel = isProtected
    ? `Delete ${user.displayName} is unavailable`
    : `Delete ${user.displayName}`;

  const deleteButton = (
    <button
      type="button"
      onClick={() => onDelete(user)}
      disabled={isProtected}
      aria-label={deleteLabel}
      className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400 disabled:hover:bg-transparent"
    >
      Delete
    </button>
  );

  if (variant === 'table') {
    return (
      <tr className="border-b border-stone-200 last:border-b-0">
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar role={user.role} />
            <span className="font-semibold text-ink">{user.displayName}</span>
          </div>
        </td>
        <td className="px-4 py-4 font-mono text-sm text-stone-700">{user.username}</td>
        <td className="px-4 py-4 capitalize text-stone-700">{user.role}</td>
        <td className="px-4 py-4 text-right">{deleteButton}</td>
      </tr>
    );
  }

  return (
    <article className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar role={user.role} />
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-ink">{user.displayName}</h2>
            <p className="truncate font-mono text-sm text-stone-600">{user.username}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-clay">{user.role}</p>
          </div>
        </div>
        {deleteButton}
      </div>
    </article>
  );
}

UserRow.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['admin', 'user']).isRequired,
  }).isRequired,
  currentUserId: PropTypes.string,
  onDelete: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['card', 'table']),
};
