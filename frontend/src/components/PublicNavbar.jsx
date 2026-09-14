import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';

/** Render navigation available before sign-in. */
export default function PublicNavbar({ session }) {
  const destination = session?.role === 'admin' ? '/admin' : '/blogs';
  return (
    <header className="border-b border-stone-200 bg-paper/95">
      <nav aria-label="Public navigation" className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight text-ink">
          WriteSpace<span className="text-clay">.</span>
        </Link>
        {session ? (
          <Link to={destination} className="flex items-center gap-2 rounded-full bg-mist px-3 py-1.5 text-sm font-bold text-ink">
            <Avatar role={session.role} />
            <span>Go to Dashboard</span>
          </Link>
        ) : (
          <div className="flex items-center gap-3 text-sm font-bold">
            <Link to="/login" className="rounded-lg px-3 py-2 hover:bg-mist">Login</Link>
            <Link to="/register" className="rounded-lg bg-clay px-4 py-2 text-white hover:bg-[#813a24]">Get Started</Link>
          </div>
        )}
      </nav>
    </header>
  );
}

PublicNavbar.propTypes = {
  session: PropTypes.shape({
    role: PropTypes.oneOf(['admin', 'user']),
  }),
};

PublicNavbar.defaultProps = {
  session: null,
};
