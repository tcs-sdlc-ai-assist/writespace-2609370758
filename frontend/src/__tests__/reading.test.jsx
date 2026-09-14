import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { setSession } from '../utils/auth';
import { savePosts } from '../utils/storage';
import { canManagePost, getLatestPreviews } from '../utils/posts';
import LandingPage from '../pages/LandingPage';
import ReadBlog from '../pages/ReadBlog';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const posts = [
  { id: 'old', title: 'Old post', content: 'Old', createdAt: '2024-01-01T00:00:00.000Z', authorId: 'owner' },
  { id: 'newest', title: 'Newest post', content: 'Newest', createdAt: '2024-03-01T00:00:00.000Z', authorId: 'owner' },
  { id: 'middle', title: 'Middle post', content: 'Middle', createdAt: '2024-02-01T00:00:00.000Z', authorId: 'owner' },
  { id: 'fourth', title: 'Fourth post', content: 'Fourth', createdAt: '2023-01-01T00:00:00.000Z', authorId: 'owner' },
  { id: 'invalid', title: 'Invalid post', content: 'No date', createdAt: 'not-a-date', authorId: 'owner' },
];

function renderReader(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/blog/:id" element={<ReadBlog />} />
        <Route path="/blogs" element={<p>Blogs destination</p>} />
        <Route path="/edit/:id" element={<p>Edit destination</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('reading discovery', () => {
  it('orders eligible previews newest first, limits them to three, and leaves source storage unchanged', () => {
    const source = [...posts];
    expect(getLatestPreviews(source).map((post) => post.id)).toEqual(['newest', 'middle', 'old']);
    expect(source.map((post) => post.id)).toEqual(posts.map((post) => post.id));
  });

  it('renders the exact empty landing message', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(screen.getByText('No posts yet — check back soon!')).toBeInTheDocument();
  });

  it('sends a guest who opens a landing card to login', async () => {
    const user = userEvent.setup();
    savePosts(posts);
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<p>Login destination</p>} />
        </Routes>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('link', { name: 'Newest post' }));
    expect(screen.getByText('Login destination')).toBeInTheDocument();
  });

  it('renders complete whitespace-preserved content and the missing-post state', () => {
    savePosts([{ id: 'full', title: 'Full post', content: 'First line\n\nSecond line', createdAt: '2024-01-01T00:00:00.000Z', authorId: 'owner' }]);
    setSession({ userId: 'reader', username: 'reader', displayName: 'Reader', role: 'user' });
    const { unmount } = renderReader('/blog/full');
    const content = document.querySelector('.whitespace-pre-wrap');
    expect(content.textContent).toBe('First line\n\nSecond line');
    expect(screen.getByRole('link', { name: 'Back' })).toBeInTheDocument();
    unmount();
    renderReader('/blog/missing');
    expect(screen.getByText('Post not found')).toBeInTheDocument();
  });

  it('shows actions only to the owner or an administrator', () => {
    const post = { id: 'post-1', authorId: 'owner' };
    expect(canManagePost({ userId: 'owner', role: 'user' }, post)).toBe(true);
    expect(canManagePost({ userId: 'admin', role: 'admin' }, post)).toBe(true);
    expect(canManagePost({ userId: 'reader', role: 'user' }, post)).toBe(false);
  });
});
