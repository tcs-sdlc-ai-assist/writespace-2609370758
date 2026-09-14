import { Link, useParams } from 'react-router-dom';
import { getSession } from '../utils/auth';
import { findPostById, canManagePost } from '../utils/posts';

/** Render an authenticated full post, including author-only management affordances. */
export default function ReadBlog() {
  const { id } = useParams();
  const post = findPostById(id);
  const session = getSession();

  if (!post) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-lg font-bold text-ink">Post not found</p>
      </main>
    );
  }

  const canManage = canManagePost(session, post);
  const publishedAt = post.createdAt ?? post.date ?? post.publishedAt;
  const date = new Date(publishedAt);
  const dateLabel = Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date)
    : '';

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <article>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-clay">{dateLabel}</p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-ink sm:text-6xl">{post.title}</h1>
        {post.authorName && <p className="mt-5 text-sm font-bold text-stone-600">By {post.authorName}</p>}
        <div className="mt-10 whitespace-pre-wrap text-lg leading-8 text-ink">{typeof post.content === 'string' ? post.content : ''}</div>
      </article>
      <nav aria-label="Post actions" className="mt-12 flex flex-wrap gap-3 border-t border-stone-200 pt-6">
        {canManage ? (
          <>
            <Link to={`/edit/${post.id}`} className="primary-button">Edit</Link>
            <Link to={`/edit/${post.id}`} className="inline-flex items-center justify-center rounded-xl border border-stone-300 px-5 py-3 font-bold text-clay transition hover:bg-mist focus:outline-none focus-visible:ring-4 focus-visible:ring-clay/30">Delete</Link>
          </>
        ) : (
          <Link to="/blogs" className="inline-flex items-center justify-center rounded-xl border border-stone-300 px-5 py-3 font-bold text-ink transition hover:bg-mist focus:outline-none focus-visible:ring-4 focus-visible:ring-clay/30">Back</Link>
        )}
      </nav>
    </main>
  );
}
