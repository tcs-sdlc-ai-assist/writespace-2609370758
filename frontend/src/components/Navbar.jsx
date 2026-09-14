import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import { clearSession } from '../utils/auth';

/** Render session-aware navigation and a mobile menu. */
export default function Navbar({ session }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const links = session.role === 'admin'
    ? [{ to: '/blogs', label: 'All Blogs' }, { to: '/write', label: 'Write' }, { to: '/users', label: 'Users' }]
    : [{ to: '/blogs', label: 'All Blogs' }, { to: '/write', label: 'Write' }];

  /** Clear the session and return the visitor to the public home. */
  function handleLogout() {
    clearSession();
    navigate('/');
  }

  return (
    <header className="border-b border-stone-200 bg-paper/95">
      <nav aria-label="Authenticated navigation" className="mx-auto max-w-6xl px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight text-ink">WriteSpace<span className="text-clay">.</span></Link>
          <button
            type="button"
            className="rounded-lg p-2 text-ink md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}
          >
            <span aria-hidden="true">Menu</span>
          </button>
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `rounded-full px-4 py-2 text-sm font-bold ${isActive ? 'bg-mist text-clay' : 'text-stone-600 hover:bg-mist'}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Avatar role={session.role} />
            <span className="text-sm font-bold">{session.displayName}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-sm font-bold text-clay hover:bg-mist"
            >
              Logout
            </button>
          </div>
        </div>
        {isOpen && (
          <div className="mt-3 grid gap-2 border-t border-stone-200 pt-3 md:hidden">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2 font-bold hover:bg-mist"
              >
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-left font-bold text-clay hover:bg-mist"
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

Navbar.propTypes = {
  session: PropTypes.shape({
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['admin', 'user']).isRequired,
  }).isRequired,
};
