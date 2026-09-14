import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { setSession } from '../utils/auth';
import { getPosts, savePosts } from '../utils/storage';
import WriteBlog from '../pages/WriteBlog';
import ReadBlog from '../pages/ReadBlog';

const owner = { userId: 'owner', username: 'owner', displayName: 'Owner Name', role: 'user' };

function renderWriter(path, { renderReadBlog = false } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/write" element={<WriteBlog />} />
        <Route path="/edit/:id" element={<WriteBlog />} />
        <Route path="/blog/:id" element={renderReadBlog ? <ReadBlog /> : <p>Post destination</p>} />
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

  it('renders hostile and very large published text literally rather than as markup', async () => {
    const user = userEvent.setup();
    const hostileText = '<img src=x onerror=alert(1)> <script>alert("xss")</script>';
    const veryLargeText = `${hostileText}\n${'Long literal text. '.repeat(10000)}`;
    const publishedContent = veryLargeText.trim();
    setSession(owner);
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'literal-post-id') });
    renderWriter('/write', { renderReadBlog: true });

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: hostileText } });
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: veryLargeText } });
    await user.click(screen.getByRole('button', { name: 'Publish blog' }));

    expect(screen.getByRole('heading', { name: hostileText })).toBeInTheDocument();
    expect(document.querySelector('article div').textContent).toBe(publishedContent);
    expect(document.querySelector('img, script')).not.toBeInTheDocument();
    expect(getPosts()[0]).toMatchObject({ title: hostileText, content: publishedContent });
  });

  it('shows an inline save error and preserves posts when creating cannot write storage', async () => {
    const user = userEvent.setup();
    const persistedPosts = [{ id: 'existing', title: 'Existing', content: 'Existing body', authorId: 'owner', authorName: 'Owner Name', createdAt: '2024-01-01T00:00:00.000Z' }];
    setSession(owner);
    savePosts(persistedPosts);
    const persistedValue = window.localStorage.getItem('writespace_posts');
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'failed-create') });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      if (key === 'writespace_posts') throw new Error('quota exceeded');
      return Storage.prototype.setItem.call(window.localStorage, key, value);
    });
    renderWriter('/write');

    await user.type(screen.getByLabelText('Title'), 'Cannot save');
    await user.type(screen.getByLabelText('Content'), 'The persisted collection must remain unchanged.');
    await user.click(screen.getByRole('button', { name: 'Publish blog' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Your post could not be saved. Please check available browser storage and try again.');
    expect(screen.getByRole('heading', { name: 'Write a blog' })).toBeInTheDocument();
    expect(window.localStorage.getItem('writespace_posts')).toBe(persistedValue);
  });

  it('shows an inline save error and preserves posts when updating cannot write storage', async () => {
    const user = userEvent.setup();
    const persistedPosts = [{ id: 'post-1', title: 'Original', content: 'Original body', authorId: 'owner', authorName: 'Owner Name', createdAt: '2024-01-01T00:00:00.000Z' }];
    setSession(owner);
    savePosts(persistedPosts);
    const persistedValue = window.localStorage.getItem('writespace_posts');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      if (key === 'writespace_posts') throw new Error('quota exceeded');
      return Storage.prototype.setItem.call(window.localStorage, key, value);
    });
    renderWriter('/edit/post-1');

    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Updated');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Your post could not be saved. Please check available browser storage and try again.');
    expect(screen.getByRole('heading', { name: 'Edit blog' })).toBeInTheDocument();
    expect(window.localStorage.getItem('writespace_posts')).toBe(persistedValue);
  });

  it('shows an inline delete error and preserves posts when deletion cannot write storage', async () => {
    const user = userEvent.setup();
    const persistedPosts = [{ id: 'post-1', title: 'Original', content: 'Original body', authorId: 'owner', authorName: 'Owner Name', createdAt: '2024-01-01T00:00:00.000Z' }];
    setSession(owner);
    savePosts(persistedPosts);
    const persistedValue = window.localStorage.getItem('writespace_posts');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      if (key === 'writespace_posts') throw new Error('quota exceeded');
      return Storage.prototype.setItem.call(window.localStorage, key, value);
    });
    renderWriter('/edit/post-1');

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Your post could not be deleted. Please check available browser storage and try again.');
    expect(screen.getByRole('heading', { name: 'Edit blog' })).toBeInTheDocument();
    expect(window.localStorage.getItem('writespace_posts')).toBe(persistedValue);
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
