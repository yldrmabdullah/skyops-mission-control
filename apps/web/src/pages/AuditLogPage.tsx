import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState } from 'react';
import { FormNotice } from '../components/FormNotice';
import { StatePanel } from '../components/StatePanel';
import { EmptyState, SurfaceCard } from '../components/SurfaceCard';
import { fetchAuditEvents, getErrorMessage } from '../lib/api';
import { formatEnumLabel } from '../lib/format';

const PAGE_SIZE = 25;

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const auditQuery = useQuery({
    queryKey: ['audit-events', page],
    queryFn: () => fetchAuditEvents(page, PAGE_SIZE),
  });

  if (auditQuery.isLoading) {
    return (
      <StatePanel
        description="Your recent actions on drones, missions, and maintenance are loading."
        title="Audit log"
      />
    );
  }

  if (auditQuery.isError) {
    return (
      <StatePanel
        actionHref="/dashboard"
        actionLabel="Back to dashboard"
        description={getErrorMessage(auditQuery.error)}
        title="Unable to load audit log"
        tone="error"
      />
    );
  }

  const payload = auditQuery.data;
  const rows = payload?.data ?? [];
  const meta = payload?.meta;

  return (
    <>
      <header className="page-header">
        <div>
          <div className="badge">Compliance</div>
          <h2>Audit log</h2>
          <p>
            Immutable-style trail of changes you performed in this workspace
            (per your user id). Useful for demos and operational reviews.
          </p>
        </div>
        <div className="badge">{meta?.total ?? 0} events</div>
      </header>

      <FormNotice
        message="Pilots and technicians see events they authored. Managers also see audit entries for drones, missions, and maintenance logs in their fleet."
        tone="info"
      />

      <SurfaceCard title="Recent events">
        {rows.length ? (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Id</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {format(new Date(row.createdAt), 'dd MMM yyyy HH:mm:ss')}
                    </td>
                    <td>{formatEnumLabel(row.action)}</td>
                    <td>{formatEnumLabel(row.entityType)}</td>
                    <td className="muted">{row.entityId}</td>
                    <td className="muted">
                      {row.metadata && Object.keys(row.metadata).length
                        ? JSON.stringify(row.metadata)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState>
            No audit events yet. Create or update drones, missions, or
            maintenance to populate this log.
          </EmptyState>
        )}

        {meta && meta.totalPages > 1 ? (
          <div className="stack-inline section-spaced">
            <button
              className="button secondary"
              disabled={page <= 1}
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="muted">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              className="button secondary"
              disabled={page >= meta.totalPages}
              type="button"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        ) : null}
      </SurfaceCard>
    </>
  );
}
