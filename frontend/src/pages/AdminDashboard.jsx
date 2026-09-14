import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { getPosts, getUsers } from '../utils/storage';

/** Return an orderable timestamp while treating malformed dates as oldest. */
function postTimestamp(post) {
  const timestamp = Date.parse(post?.createdAt);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/** Render local-storage administration totals and the latest published posts. */
export default function AdminDashboard() {
  const totalUsers = getUsers().length + 1;
  const recentPosts = getPosts()
    .filter((post) => post && typeof post.id === 'string' && post.id.trim())
    .sort((first, second) => postTimestamp(second) - postTimestamp(first))
    .slice(0, 5);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-clay">
        Administration
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-bold tracking-tight text-ink">Overview</h1>
          <p className="mt-3 max-w-2xl text-stone-600">A concise view of the local writing room.</p>
        </div>
        <Link className="primary-button" to="/users">Manage users</Link>
      </div>

      <section className="mt-10 grid gap-4 sm:grid-cols-2" aria-label="Administration totals">
        <StatCard label="Total users" value={totalUsers} detail="Local accounts and the permanent admin" />
        <StatCard label="Total posts" value={getPosts().length} detail="Published in local browser storage" />
      </section>

      <section className="mt-12 max-w-3xl" aria-labelledby="recent-posts-heading">
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <h2 id="recent-posts-heading" className="font-display text-3xl font-bold text-ink">Newest posts</h2>
          <Link className="text-sm font-bold text-clay underline-offset-4 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-clay/30" to="/blogs">View all posts</Link>
        </div>
        {recentPosts.length === 0 ? (
          <p className="py-8 text-stone-600">No posts have been published yet.</p>
        ) : (
          <ol className="divide-y divide-stone-200">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <Link className="block py-4 font-semibold text-ink transition hover:text-clay focus:outline-none focus-visible:ring-4 focus-visible:ring-clay/30" to={`/blog/${encodeURIComponent(post.id)}`}>
                  {typeof post.title === 'string' && post.title.trim() ? post.title.trim() : 'Untitled post'}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
