import type { ReactNode } from 'react';

interface SurfaceCardProps {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  title?: ReactNode;
}

export function SurfaceCard({
  actions,
  children,
  className,
  description,
  title,
}: SurfaceCardProps) {
  const classes = ['card', className].filter(Boolean).join(' ');

  return (
    <article className={classes}>
      {title ? (
        <div className="card-header">
          <div>
            <h3>{title}</h3>
            {description ? (
              <p className="card-subtitle">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}

      <div className="card-content">{children}</div>
    </article>
  );
}

interface EmptyStateProps {
  children: ReactNode;
}

export function EmptyState({ children }: EmptyStateProps) {
  return <div className="empty-state">{children}</div>;
}
