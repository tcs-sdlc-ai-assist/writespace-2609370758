import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { setSession } from '../utils/auth';
import { getPosts, savePosts } from '../utils/storage';
import WriteBlog from '../pages/WriteBlog';

const owner = { userId: 'owner', username: 'owner', displayName: 'Owner Name', role: 'user' };

function renderWriter(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/write" element={<WriteBlog />} />
        <Route path="/edit/:id" element={<WriteBlog />} />
        <Route path="/blog/:id" element={<p>Post destination</p>} />
        <Route path="/blogs" element={<p>Blogs destination</p>} />
        <Route path="/login" element={<p>Login destination</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('writing and editing', () => {
  it('shows accessible errors for blank values and does not write posts', async () => {
    const user = userEvent.setup();
    setSession(owner);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    renderWriter('/write');

    await user.click(screen.getByRole('button', { name: 'Publish blog' }));

    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Content is required.')).toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalledWith('writespace_posts', expect.any(String));
  });

  it('creates a trimmed post using UUID and session identity then navigates to it', async () => {
    const user = userEvent.setup();
    setSession(owner);
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'new-post-id') });
    renderWriter('/write');

    await user.type(screen.getByLabelText('Title'), '  A title  ');
    await user.type(screen.getByLabelText('Content'), '  A body  ');
    await user.click(screen.getByRole('button', { name: 'Publish blog' }));

    expect(screen.getByText('Post destination')).toBeInTheDocument();
    expect(getPosts()).toEqual([{
      id: 'new-post-id',
      title: 'A title',
      content: 'A body',
      authorId: 'owner',
      authorName: 'Owner Name',
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
    }]);
  });

  it('preserves immutable edit fields while changing only trimmed title and content', async () => {
    const user = userEvent.setup();
    setSession(owner);
    savePosts([{ id: 'post-1', title: 'Original', content: 'Original body', createdAt: '2024-01-01T00:00:00.000Z', authorId: 'owner', authorName: 'Original Owner' }]);
    renderWriter('/edit/post-1');

    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), '  Updated  ');
    await user.clear(screen.getByLabelText('Content'));
    await user.type(screen.getByLabelText('Content'), '  Revised body  ');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText('Post destination')).toBeInTheDocument();
    expect(getPosts()[0]).toEqual({ id: 'post-1', title: 'Updated', content: 'Revised body', createdAt: '2024-01-01T00:00:00.000Z', authorId: 'owner', authorName: 'Original Owner' });
  });

  it('cancels without saving and returns to blogs', async () => {
    const user = userEvent.setup();
    setSession(owner);
    renderWriter('/write');
    await user.type(screen.getByLabelText('Title'), 'Unpublished');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('Blogs destination')).toBeInTheDocument();
    expect(getPosts()).toEqual([]);
  });

  it('does not write or navigate when delete confirmation is declined, then deletes only the target when confirmed', async () => {
    const user = userEvent.setup();
    setSession(owner);
    savePosts([
      { id: 'post-1', title: 'Owned', content: 'Body', createdAt: '2024-01-01T00:00:00.000Z', authorId: 'owner', authorName: 'Owner Name' },
      { id: 'post-2', title: 'Keep', content: 'Other', createdAt: '2024-01-02T00:00:00.000Z', authorId: 'other', authorName: 'Other' },
    ]);
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderWriter('/edit/post-1');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('heading', { name: 'Edit blog' })).toBeInTheDocument();
    expect(getPosts()).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Blogs destination')).toBeInTheDocument();
    expect(getPosts().map((post) => post.id)).toEqual(['post-2']);
  });

  it('redirects an unauthorized editor without rendering the form', () => {
    setSession({ userId: 'reader', username: 'reader', displayName: 'Reader', role: 'user' });
    savePosts([{ id: 'post-1', title: 'Private', content: 'Body', createdAt: '2024-01-01T00:00:00.000Z', authorId: 'owner', authorName: 'Owner Name' }]);
    renderWriter('/edit/post-1');

    expect(screen.getByText('Blogs destination')).toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });
});
