import { useState } from 'react';
import UserRow from '../components/UserRow';
import { ADMIN_SESSION, getSession } from '../utils/auth';
import { getUsers, saveUsers } from '../utils/storage';

/** Return display-safe account records from browser storage. */
function readUserSnapshot() {
  return getUsers().filter((user) => (
    user
    && typeof user.id === 'string'
    && typeof user.displayName === 'string'
    && typeof user.username === 'string'
    && (user.role === 'user' || user.role === 'admin')
  ));
}

/** Render the admin-only local account creation and deletion workspace. */
export default function UserManagement() {
  const [users, setUsers] = useState(readUserSnapshot);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const currentUserId = getSession()?.userId;
  const permanentAdmin = { ...ADMIN_SESSION, id: ADMIN_SESSION.userId };
  const allUsers = [permanentAdmin, ...users];

  /** Validate and persist a user-only account with fresh storage duplicate checks. */
  function handleSubmit(event) {
    event.preventDefault();
    const nextDisplayName = displayName.trim();
    const nextUsername = username.trim();
    const nextPassword = password.trim();
    const normalizedUsername = nextUsername.toLowerCase();
    setError('');
    setStatus('');

    if (!nextDisplayName || !nextUsername || !nextPassword) {
      setError('Display name, username, and password are required.');
      return;
    }
    if (normalizedUsername === 'admin') {
      setError('The username admin is reserved.');
      return;
    }

    const currentUsers = readUserSnapshot();
    if (currentUsers.some((user) => user.username.toLowerCase() === normalizedUsername)) {
      setError('That username is already in use.');
      return;
    }

    try {
      const newUser = {
        id: crypto.randomUUID(),
        displayName: nextDisplayName,
        username: nextUsername,
        password: nextPassword,
        role: 'user',
        createdAt: new Date().toISOString(),
      };
      const nextUsers = [...currentUsers, newUser];
      saveUsers(nextUsers);
      setUsers(nextUsers);
      setDisplayName('');
      setUsername('');
      setPassword('');
      setStatus(`${newUser.displayName} was added.`);
    } catch (storageError) {
      setError('The user could not be saved. Please check available browser storage and try again.');
    }
  }

  /** Confirm deletion in the click path and recheck permanent and session protections. */
  function handleDelete(user) {
    const sessionUserId = getSession()?.userId;
    const protectedUser = user.username.toLowerCase() === 'admin' || user.id === sessionUserId;
    if (protectedUser) return;
    if (!window.confirm(`Delete ${user.displayName} permanently?`)) return;

    const currentUsers = readUserSnapshot();
    const target = currentUsers.find((candidate) => candidate.id === user.id);
    const isNowProtected = !target
      || target.username.toLowerCase() === 'admin'
      || target.id === getSession()?.userId;
    if (isNowProtected) return;

    try {
      const nextUsers = currentUsers.filter((candidate) => candidate.id !== target.id);
      saveUsers(nextUsers);
      setUsers(nextUsers);
      setError('');
      setStatus(`${target.displayName} was deleted.`);
    } catch (storageError) {
      setError('The user could not be deleted. Please check available browser storage and try again.');
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-clay">Administration</p>
      <h1 className="mt-3 font-display text-5xl font-bold tracking-tight text-ink">User management</h1>
      <p className="mt-3 max-w-2xl text-stone-600">Create local writer accounts and remove accounts that are no longer needed.</p>

      <section className="mt-10 max-w-2xl rounded-xl border border-stone-200 bg-white p-5 sm:p-6" aria-labelledby="create-user-heading">
        <h2 id="create-user-heading" className="font-display text-2xl font-bold text-ink">Add a user</h2>
        <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
          {error && <p role="alert" className="sm:col-span-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</p>}
          {status && <p role="status" className="sm:col-span-2 rounded-lg border border-moss/30 bg-moss/10 px-4 py-3 text-sm font-semibold text-moss">{status}</p>}
          <div>
            <label className="field-label" htmlFor="user-display-name">Display Name</label>
            <input id="user-display-name" className="text-field" value={displayName} onChange={(event) => setDisplayName(event.target.value)} aria-required="true" aria-invalid={Boolean(error)} />
          </div>
          <div>
            <label className="field-label" htmlFor="user-username">Username</label>
            <input id="user-username" className="text-field" value={username} onChange={(event) => setUsername(event.target.value)} aria-required="true" aria-invalid={Boolean(error)} />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="user-password">Password</label>
            <input id="user-password" type="password" className="text-field" value={password} onChange={(event) => setPassword(event.target.value)} aria-required="true" aria-invalid={Boolean(error)} />
          </div>
          <div className="sm:col-span-2"><button type="submit" className="primary-button">Add user</button></div>
        </form>
      </section>

      <section className="mt-12" aria-labelledby="user-list-heading">
        <div className="border-b border-stone-200 pb-4">
          <h2 id="user-list-heading" className="font-display text-3xl font-bold text-ink">Accounts</h2>
          <p className="mt-2 text-sm text-stone-600">The permanent admin and active session cannot be deleted.</p>
        </div>
        <div className="mt-5 grid gap-3 md:hidden">
          {allUsers.map((user) => <UserRow key={user.id} user={user} currentUserId={currentUserId} onDelete={handleDelete} />)}
        </div>
        <div className="mt-5 hidden overflow-x-auto rounded-xl border border-stone-200 bg-white md:block">
          <table className="min-w-full text-left">
            <thead className="border-b border-stone-200 bg-mist text-xs font-bold uppercase tracking-[0.12em] text-stone-600">
              <tr>
                <th scope="col" className="px-4 py-3">Name</th>
                <th scope="col" className="px-4 py-3">Username</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <UserRow key={user.id} user={user} currentUserId={currentUserId} onDelete={handleDelete} variant="table" />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
