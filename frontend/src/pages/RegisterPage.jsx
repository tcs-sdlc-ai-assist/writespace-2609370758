import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getSession, setSession } from '../utils/auth';
import { getUsers, saveUsers } from '../utils/storage';

/** Render the local account registration form. */
export default function RegisterPage() {
  const navigate = useNavigate();
  const session = getSession();
  const [form, setForm] = useState({ displayName: '', username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  if (session) return <Navigate to={session.role === 'admin' ? '/admin' : '/blogs'} replace />;

  /** Update a registration field while preserving the other draft values. */
  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  /** Validate, persist, and sign in a new local user. */
  function handleSubmit(event) {
    event.preventDefault();
    const displayName = form.displayName.trim();
    const username = form.username.trim();
    if (!displayName || !username || !form.password) { setError('Display name, username, and password are required.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    const users = getUsers();
    if (username.toLowerCase() === 'admin') { setError('The username admin is reserved.'); return; }
    if (users.some((user) => user.username?.toLowerCase() === username.toLowerCase())) { setError('That username is already in use.'); return; }
    const id = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `user-${Date.now()}`;
    const user = { id, displayName, username, password: form.password, role: 'user', createdAt: new Date().toISOString() };
    try {
      saveUsers([...users, user]);
      setSession({ userId: id, username, displayName, role: 'user' });
      navigate('/blogs');
    } catch (storageError) {
      setError('Your browser could not save this local account.');
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-73px)] place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-editorial sm:p-10">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-clay">Start close to the page</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Make your space.</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">Your account is saved only in this browser.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
          <div><label className="field-label" htmlFor="display-name">Display Name</label><input id="display-name" name="displayName" className="text-field" value={form.displayName} onChange={updateField} aria-required="true" aria-invalid={Boolean(error && !form.displayName.trim())} /></div>
          <div><label className="field-label" htmlFor="register-username">Username</label><input id="register-username" name="username" className="text-field" value={form.username} onChange={updateField} autoComplete="username" aria-required="true" aria-invalid={Boolean(error && !form.username.trim())} /></div>
          <div><label className="field-label" htmlFor="register-password">Password</label><input id="register-password" name="password" type="password" className="text-field" value={form.password} onChange={updateField} autoComplete="new-password" aria-required="true" aria-invalid={Boolean(error && !form.password)} /></div>
          <div><label className="field-label" htmlFor="confirm-password">Confirm Password</label><input id="confirm-password" name="confirmPassword" type="password" className="text-field" value={form.confirmPassword} onChange={updateField} autoComplete="new-password" aria-required="true" aria-invalid={Boolean(error && !form.confirmPassword)} /></div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p>}
          <button type="submit" className="primary-button w-full">Create account</button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-600">Already have a local account? <Link className="font-bold text-clay underline underline-offset-4" to="/login">Log in</Link></p>
      </section>
    </main>
  );
}
