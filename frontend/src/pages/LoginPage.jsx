import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ADMIN_SESSION, getSession, setSession } from '../utils/auth';
import { getUsers } from '../utils/storage';

/** Render the local browser-only sign-in form. */
export default function LoginPage() {
  const navigate = useNavigate();
  const session = getSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (session) return <Navigate to={session.role === 'admin' ? '/admin' : '/blogs'} replace />;

  /** Validate credentials with permanent admin precedence and establish a session. */
  function handleSubmit(event) {
    event.preventDefault();
    const normalizedUsername = username.trim();
    if (normalizedUsername === 'admin' && password === 'admin') {
      setSession(ADMIN_SESSION);
      navigate('/admin');
      return;
    }
    const user = getUsers().find((candidate) => candidate.username?.toLowerCase() === normalizedUsername.toLowerCase() && candidate.password === password);
    if (!user) {
      setError('Invalid username or password.');
      return;
    }
    setSession({ userId: user.id, username: user.username, displayName: user.displayName, role: 'user' });
    navigate('/blogs');
  }

  return (
    <main className="grid min-h-[calc(100vh-73px)] place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-editorial sm:p-10">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-clay">A local writing room</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Welcome back.</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">Sign in to continue with this browser’s private writing space.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="login-username">Username</label>
            <input id="login-username" className="text-field" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" aria-required="true" required />
          </div>
          <div>
            <label className="field-label" htmlFor="login-password">Password</label>
            <input id="login-password" type="password" className="text-field" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" aria-required="true" required />
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}
          <button type="submit" className="primary-button w-full">Login</button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-600">
          New here? <Link className="font-bold text-clay underline underline-offset-4" to="/register">Create a local account</Link>
        </p>
        <p className="mt-6 border-t border-stone-100 pt-4 text-xs leading-5 text-stone-500">Demo admin: <strong>admin / admin</strong>. Credentials stay in this browser and are not secure.</p>
      </section>
    </main>
  );
}
