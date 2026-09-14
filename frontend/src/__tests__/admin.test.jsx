import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';
import UserManagement from '../pages/UserManagement';
import UserRow from '../components/UserRow';
import ProtectedRoute from '../components/ProtectedRoute';
import { setSession } from '../utils/auth';
import { getUsers, savePosts, saveUsers } from '../utils/storage';
import * as storage from '../utils/storage';

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

  it('stores and renders large hostile admin-created input as literal text without markup', async () => {
    const user = userEvent.setup();
    const hostileDisplayName = `<img src=x onerror="window.__adminXss=1">${'x'.repeat(10_000)}`;
    const hostileUsername = `<svg onload="window.__adminXss=1">${'u'.repeat(10_000)}`;
    setSession(adminSession);
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'hostile-user') });
    renderPage(<UserManagement />);

    fireEvent.change(screen.getByLabelText('Display Name'), { target: { value: hostileDisplayName } });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: hostileUsername } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    await user.click(screen.getByRole('button', { name: 'Add user' }));

    expect(getUsers()).toEqual([expect.objectContaining({ id: 'hostile-user', displayName: hostileDisplayName, username: hostileUsername })]);
    expect(screen.getByRole('heading', { name: hostileDisplayName })).toBeInTheDocument();
    expect(screen.getAllByText(hostileUsername)).toHaveLength(2);
    expect(document.querySelector('img[src="x"], svg[onload]')).toBeNull();
    expect(window.__adminXss).toBeUndefined();
  });

  it('shows an error and keeps users and form state unchanged when saving a new user fails', async () => {
    const user = userEvent.setup();
    const existingUser = { id: 'keep', displayName: 'Keep Me', username: 'keep', password: 'secret', role: 'user' };
    setSession(adminSession);
    saveUsers([existingUser]);
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'failed-user') });
    vi.spyOn(storage, 'saveUsers').mockImplementation(() => { throw new Error('quota exceeded'); });
    renderPage(<UserManagement />);

    await user.type(screen.getByLabelText('Display Name'), 'Cannot Save');
    await user.type(screen.getByLabelText('Username'), 'cannot-save');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Add user' }));

    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved');
    expect(getUsers()).toEqual([existingUser]);
    expect(screen.getByRole('heading', { name: 'Keep Me' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cannot Save' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Display Name')).toHaveValue('Cannot Save');
    expect(screen.getByLabelText('Username')).toHaveValue('cannot-save');
    expect(screen.getByLabelText('Password')).toHaveValue('secret');
  });

  it('shows an error and keeps users and rendering unchanged when deleting a user fails', async () => {
    const user = userEvent.setup();
    const removableUser = { id: 'remove', displayName: 'Remove Me', username: 'remove', password: 'secret', role: 'user' };
    const retainedUser = { id: 'keep', displayName: 'Keep Me', username: 'keep', password: 'secret', role: 'user' };
    setSession(adminSession);
    saveUsers([removableUser, retainedUser]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(storage, 'saveUsers').mockImplementation(() => { throw new Error('quota exceeded'); });
    renderPage(<UserManagement />);

    await user.click(screen.getAllByRole('button', { name: 'Delete Remove Me' })[0]);

    expect(screen.getByRole('alert')).toHaveTextContent('could not be deleted');
    expect(getUsers()).toEqual([removableUser, retainedUser]);
    expect(screen.getByRole('heading', { name: 'Remove Me' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Keep Me' })).toBeInTheDocument();
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
