import { getSession } from '../utils/auth';
import { getLatestPreviews } from '../utils/posts';
import BlogCard from '../components/BlogCard';

/** Render the public reading landing page from safe browser-local post data. */
export default function LandingPage() {
  const session = getSession();
  const previews = getLatestPreviews();
  const destinationFor = (post) => (session ? `/blog/${post.id}` : '/login');

  return (
    <main className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
      <section className="max-w-3xl">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-clay">WriteSpace reading room</p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-ink sm:text-6xl">Words worth making time for.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-600">Read the newest notes from this local writing community.</p>
      </section>
      <section aria-labelledby="latest-posts" className="mt-14">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="latest-posts" className="font-display text-3xl font-bold tracking-tight">Latest writing</h2>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Newest first</p>
        </div>
        {previews.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-8 text-stone-600">No posts yet — check back soon!</p>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {previews.map((post) => <BlogCard key={post.id} post={post} to={destinationFor(post)} />)}
          </div>
        )}
      </section>
    </main>
  );
}
