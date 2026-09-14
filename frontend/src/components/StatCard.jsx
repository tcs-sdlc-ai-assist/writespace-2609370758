import PropTypes from 'prop-types';

/** Render a concise administration metric with an optional explanatory label. */
export default function StatCard({ label, value, detail }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-clay">
        {label}
      </p>
      <p className="mt-3 font-display text-4xl font-bold tabular-nums text-ink">
        {value}
      </p>
      {detail && (
        <p className="mt-2 text-sm text-stone-600">
          {detail}
        </p>
      )}
    </section>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  detail: PropTypes.string,
};
