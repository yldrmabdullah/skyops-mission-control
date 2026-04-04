import { Link } from 'react-router-dom';

interface StatePanelProps {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  title: string;
  tone?: 'default' | 'error' | 'warning';
}

export function StatePanel({
  actionHref,
  actionLabel,
  description,
  title,
  tone = 'default',
}: StatePanelProps) {
  return (
    <section className={`state-panel ${tone}`}>
      <div className="badge">
        {tone === 'error' ? 'Attention needed' : 'Status'}
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionHref && actionLabel ? (
        <Link className="button secondary" to={actionHref}>
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
