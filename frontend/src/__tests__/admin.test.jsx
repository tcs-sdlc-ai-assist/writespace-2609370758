import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';
import UserManagement from '../pages/UserManagement';
import UserRow from '../components/UserRow';
import ProtectedRoute from '../components/ProtectedRoute';
import { setSession } from '../utils/auth';
import { getUsers, savePosts, saveUsers } from '../utils/storage';

const adminSession = { userId: 'admin', username: 'admin', displayName: 'Admin', role: 'admin' };

function renderPage(element, path = '/') {
  return render(<MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>);
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('administration', () => {
  it('denies a user-level session from an admin route', () => {
    setSession({ userId: 'writer', username: 'writer', displayName: 'Writer', role: 'user' });
    renderPage(<Routes><Route path="/blogs" element={<p>Blogs destination</p>} /><Route path="/admin" element={<ProtectedRoute mode="admin"><AdminDashboard /></ProtectedRoute>} /></Routes>, '/admin');

    expect(screen.getByText('Blogs destination')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Overview' })).not.toBeInTheDocument();
  });

  it('derives dashboard counts and shows the five newest posts in descending order', () => {
    saveUsers([{ id: 'writer', displayName: 'Writer', username: 'writer', password: 'secret', role: 'user' }]);
    savePosts([
      { id: 'old', title: 'Oldest', createdAt: '2024-01-01T00:00:00.000Z' },
      { id: 'two', title: 'Second', createdAt: '2024-01-02T00:00:00.000Z' },
      { id: 'three', title: 'Third', createdAt: '2024-01-03T00:00:00.000Z' },
      { id: 'four', title: 'Fourth', createdAt: '2024-01-04T00:00:00.000Z' },
      { id: 'five', title: 'Fifth', createdAt: '2024-01-05T00:00:00.000Z' },
      { id: 'new', title: 'Newest', createdAt: '2024-01-06T00:00:00.000Z' },
    ]);
    renderPage(<AdminDashboard />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.queryByText('Oldest')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link').filter((link) => link.textContent !== 'Manage users' && link.textContent !== 'View all posts').map((link) => link.textContent)).toEqual(['Newest', 'Fifth', 'Fourth', 'Third', 'Second']);
  });

  it('rejects reserved and duplicate usernames then creates a user-only record', async () => {
    const user = userEvent.setup();
    setSession(adminSession);
    saveUsers([{ id: 'writer', displayName: 'Writer', username: 'Writer', password: 'secret', role: 'user' }]);
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'created-user') });
    renderPage(<UserManagement />);

    await user.click(screen.getByRole('button', { name: 'Add user' }));
    expect(screen.getByRole('alert')).toHaveTextContent('required');
    await user.type(screen.getByLabelText('Display Name'), 'New User');
    await user.type(screen.getByLabelText('Username'), 'ADMIN');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Add user' }));
    expect(screen.getByRole('alert')).toHaveTextContent('reserved');
    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), 'writer');
    await user.click(screen.getByRole('button', { name: 'Add user' }));
    expect(screen.getByRole('alert')).toHaveTextContent('already in use');
    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), 'new-user');
    await user.click(screen.getByRole('button', { name: 'Add user' }));

    expect(getUsers()[1]).toEqual({ id: 'created-user', displayName: 'New User', username: 'new-user', password: 'secret', role: 'user', createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/) });
    expect(screen.getByRole('status')).toHaveTextContent('New User was added.');
  });

  it('disables deletion for the permanent admin and active-session user', () => {
    const onDelete = vi.fn();
    const { rerender } = render(<UserRow user={{ id: 'admin', displayName: 'Admin', username: 'admin', role: 'admin' }} currentUserId="active" onDelete={onDelete} />);
    expect(screen.getByRole('button', { name: 'Delete Admin is unavailable' })).toBeDisabled();
    rerender(<UserRow user={{ id: 'active', displayName: 'Active User', username: 'active', role: 'user' }} currentUserId="active" onDelete={onDelete} />);
    expect(screen.getByRole('button', { name: 'Delete Active User is unavailable' })).toBeDisabled();
  });

  it('leaves users and rendering unchanged when deletion is cancelled', async () => {
    const user = userEvent.setup();
    setSession(adminSession);
    saveUsers([{ id: 'remove', displayName: 'Remove Me', username: 'remove', password: 'secret', role: 'user' }]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderPage(<UserManagement />);

    await user.click(screen.getAllByRole('button', { name: 'Delete Remove Me' })[0]);
    expect(getUsers()).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Remove Me' })).toBeInTheDocument();
  });

  it('removes only the confirmed eligible user from the refreshed snapshot', async () => {
    const user = userEvent.setup();
    setSession(adminSession);
    saveUsers([
      { id: 'remove', displayName: 'Remove Me', username: 'remove', password: 'secret', role: 'user' },
      { id: 'keep', displayName: 'Keep Me', username: 'keep', password: 'secret', role: 'user' },
    ]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage(<UserManagement />);

    await user.click(screen.getAllByRole('button', { name: 'Delete Remove Me' })[0]);
    expect(getUsers().map((account) => account.id)).toEqual(['keep']);
    expect(screen.queryByRole('heading', { name: 'Remove Me' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Keep Me' })).toBeInTheDocument();
  });
});
