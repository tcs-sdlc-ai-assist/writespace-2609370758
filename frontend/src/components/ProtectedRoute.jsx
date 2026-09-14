import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from '../utils/auth';

/**
 * Render children only when the current session satisfies a route policy.
 *
 * Args:
 *   mode: Required access level.
 *   post: Post evaluated for edit ownership.
 *   children: Protected route content.
 * Returns:
 *   Protected content or a safe redirect.
 */
export default function ProtectedRoute({ mode, post = null, children }) {
  const session = getSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (mode === 'admin' && session.role !== 'admin') {
    return <Navigate to="/blogs" replace />;
  }

  if (mode === 'edit' && (!post || (session.role !== 'admin' && post.authorId !== session.userId))) {
    return <Navigate to="/blogs" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  mode: PropTypes.oneOf(['auth', 'admin', 'edit']).isRequired,
  post: PropTypes.shape({ authorId: PropTypes.string }),
  children: PropTypes.node.isRequired,
};

