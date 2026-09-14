import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/** Render one navigable blog preview using the established editorial card language. */
export default function BlogCard({ post, to }) {
  const excerpt = typeof post.content === 'string' ? post.content.slice(0, 120) : '';
  const publishedAt = post.createdAt ?? post.date ?? post.publishedAt;
  const date = new Date(publishedAt);
  const dateLabel = Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
    : '';

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-clay/40 hover:bg-[#fffdfa]">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-clay">{dateLabel}</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
        <Link to={to} className="rounded-sm outline-none hover:text-clay focus-visible:ring-4 focus-visible:ring-clay/30">
          {post.title}
        </Link>
      </h2>
      {excerpt && <p className="mt-3 leading-7 text-stone-600">{excerpt}</p>}
      <Link to={to} className="mt-5 inline-flex rounded-lg font-bold text-clay underline decoration-clay/40 underline-offset-4 outline-none hover:text-[#813a24] focus-visible:ring-4 focus-visible:ring-clay/30">
        Read post
      </Link>
    </article>
  );
}

BlogCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    publishedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  to: PropTypes.string.isRequired,
};
