import { getPosts } from '../utils/storage';
import { getLatestPreviews } from '../utils/posts';
import BlogCard from '../components/BlogCard';

/** Render the authenticated post browse view. */
export default function Home() {
  const previews = getLatestPreviews(getPosts());

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-clay">Reading room</p>
      <h1 className="mt-3 font-display text-5xl font-bold tracking-tight">All blogs</h1>
      {previews.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-8 text-stone-600">No posts yet — check back soon!</p>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {previews.map((post) => <BlogCard key={post.id} post={post} to={`/blog/${post.id}`} />)}
        </div>
      )}
    </main>
  );
}
