import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { getSession } from '../utils/auth';
import { canManagePost, findPostById } from '../utils/posts';
import { getPosts, savePosts } from '../utils/storage';

/**
 * Render a protected form that creates a new post or updates an owned post.
 *
 * @returns {JSX.Element} The writing form or an authorization redirect.
 */
export default function WriteBlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const existingPost = isEditing ? findPostById(id) : null;
  const session = getSession();
  const [title, setTitle] = useState(existingPost?.title ?? '');
  const [content, setContent] = useState(existingPost?.content ?? '');
  const [errors, setErrors] = useState({});
  const [storageError, setStorageError] = useState('');

  if (isEditing && (!existingPost || !canManagePost(session, existingPost))) {
    return <Navigate to="/blogs" replace />;
  }

  /** Validate and persist the current form values before navigating to the saved post. */
  function handleSubmit(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const nextErrors = {};

    if (!trimmedTitle) nextErrors.title = 'Title is required.';
    if (!trimmedContent) nextErrors.content = 'Content is required.';
    setErrors(nextErrors);
    setStorageError('');
    if (Object.keys(nextErrors).length > 0) return;

    try {
      if (isEditing) {
        const currentPost = findPostById(id);
        const currentSession = getSession();
        if (!currentPost || !canManagePost(currentSession, currentPost)) {
          navigate('/blogs', { replace: true });
          return;
        }

        const updatedPost = {
          ...currentPost,
          title: trimmedTitle,
          content: trimmedContent,
        };
        savePosts(getPosts().map((post) => (post.id === id ? updatedPost : post)));
        navigate(`/blog/${id}`);
        return;
      }

      const currentSession = getSession();
      if (!currentSession) {
        navigate('/login', { replace: true });
        return;
      }

      const post = {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        content: trimmedContent,
        authorId: currentSession.userId,
        authorName: currentSession.displayName,
        createdAt: new Date().toISOString(),
      };
      savePosts([...getPosts(), post]);
      navigate(`/blog/${post.id}`);
    } catch (error) {
      setStorageError('Your post could not be saved. Please check available browser storage and try again.');
    }
  }

  /** Return to the blog list without changing local storage. */
  function handleCancel() {
    navigate('/blogs');
  }

  /** Confirm and delete only the current post after rechecking management permission. */
  function handleDelete() {
    const currentPost = findPostById(id);
    const currentSession = getSession();
    if (!currentPost || !canManagePost(currentSession, currentPost)) {
      navigate('/blogs', { replace: true });
      return;
    }
    if (!window.confirm('Delete this post permanently?')) return;

    try {
      savePosts(getPosts().filter((post) => post.id !== id));
      navigate('/blogs');
    } catch (error) {
      setStorageError('Your post could not be deleted. Please check available browser storage and try again.');
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-clay">
        {isEditing ? 'Revise your work' : 'Writing room'}
      </p>
      <h1 className="mt-3 font-display text-5xl font-bold tracking-tight text-ink">
        {isEditing ? 'Edit blog' : 'Write a blog'}
      </h1>
      <form className="mt-10 space-y-6" onSubmit={handleSubmit} noValidate>
        {storageError && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-800">{storageError}</p>}
        <div>
          <label className="field-label" htmlFor="blog-title">Title</label>
          <input
            id="blog-title"
            className="text-field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && <p id="title-error" role="alert" className="mt-2 text-sm font-semibold text-red-700">{errors.title}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="blog-content">Content</label>
          <textarea
            id="blog-content"
            className="text-field min-h-64 resize-y"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            aria-invalid={Boolean(errors.content)}
            aria-describedby={errors.content ? 'content-error' : undefined}
          />
          {errors.content && <p id="content-error" role="alert" className="mt-2 text-sm font-semibold text-red-700">{errors.content}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="primary-button">{isEditing ? 'Save changes' : 'Publish blog'}</button>
          <button type="button" onClick={handleCancel} className="inline-flex items-center justify-center rounded-xl border border-stone-300 px-5 py-3 font-bold text-ink transition hover:bg-mist focus:outline-none focus-visible:ring-4 focus-visible:ring-clay/30">Cancel</button>
          {isEditing && <button type="button" onClick={handleDelete} className="inline-flex items-center justify-center rounded-xl border border-red-300 px-5 py-3 font-bold text-red-800 transition hover:bg-red-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-200">Delete</button>}
        </div>
      </form>
    </main>
  );
}
