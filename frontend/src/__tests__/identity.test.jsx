import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { getUsers, saveUsers } from '../utils/storage';
import { ADMIN_SESSION, getSession, setSession } from '../utils/auth';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

function renderAt(path, element) {
  return render(<MemoryRouter initialEntries={['/entry']}><Routes><Route path="/login" element={<p>Login destination</p>} /><Route path="/blogs" element={<p>Blogs destination</p>} /><Route path="/admin" element={<p>Admin destination</p>} /><Route path="*" element={element} /></Routes></MemoryRouter>);
}

describe('browser adapters', () => {
  it('falls back to empty collections and null session for malformed storage', () => {
    window.localStorage.setItem('writespace_users', '{bad json');
    window.localStorage.setItem('writespace_session', JSON.stringify({ role: 'admin' }));
    expect(getUsers()).toEqual([]);
    expect(getSession()).toBeNull();
  });
});

describe('registration', () => {
  it('reports required, mismatched, duplicate, and reserved registration errors', async () => {
    const user = userEvent.setup();
    saveUsers([{ id: 'existing', displayName: 'Existing', username: 'writer', password: 'x', role: 'user' }]);
    renderAt('/register', <RegisterPage />);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Display name, username, and password are required.');
    await user.type(screen.getByLabelText('Display Name'), 'Sam');
    await user.type(screen.getByLabelText('Username'), 'ADMIN');
    await user.type(screen.getByLabelText('Password'), 'one');
    await user.type(screen.getByLabelText('Confirm Password'), 'two');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match.');
    await user.clear(screen.getByLabelText('Confirm Password'));
    await user.type(screen.getByLabelText('Confirm Password'), 'one');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('alert')).toHaveTextContent('reserved');
    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), 'WRITER');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('alert')).toHaveTextContent('already in use');
  });

  it('persists a user-only account and session after successful registration', async () => {
    const user = userEvent.setup();
    renderAt('/register', <RegisterPage />);
    await user.type(screen.getByLabelText('Display Name'), 'Mina');
    await user.type(screen.getByLabelText('Username'), 'mina');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.type(screen.getByLabelText('Confirm Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText('Blogs destination')).toBeInTheDocument();
    expect(getUsers()[0]).toMatchObject({ displayName: 'Mina', username: 'mina', role: 'user' });
    expect(getSession()).toMatchObject({ username: 'mina', displayName: 'Mina', role: 'user' });
  });
});

describe('login and guards', () => {
  it('gives permanent admin credentials precedence over local admin-like data', async () => {
    const user = userEvent.setup();
    saveUsers([{ id: 'fake', displayName: 'Fake', username: 'admin', password: 'admin', role: 'user' }]);
    renderAt('/login', <LoginPage />);
    await user.type(screen.getByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 'admin');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByText('Admin destination')).toBeInTheDocument();
    expect(getSession()).toEqual(ADMIN_SESSION);
  });

  it('redirects guests to login and nonowners or nonadmins to blogs', () => {
    const post = { authorId: 'owner' };
    renderAt('/write', <ProtectedRoute mode="auth"><p>Private</p></ProtectedRoute>);
    expect(screen.getByText('Login destination')).toBeInTheDocument();
    cleanup();
    setSession({ userId: 'reader', username: 'reader', displayName: 'Reader', role: 'user' });
    renderAt('/edit/post-1', <ProtectedRoute mode="edit" post={post}><p>Edit</p></ProtectedRoute>);
    expect(screen.getByText('Blogs destination')).toBeInTheDocument();
    cleanup();
    renderAt('/admin', <ProtectedRoute mode="admin"><p>Admin only</p></ProtectedRoute>);
    expect(screen.getByText('Blogs destination')).toBeInTheDocument();
  });
});
