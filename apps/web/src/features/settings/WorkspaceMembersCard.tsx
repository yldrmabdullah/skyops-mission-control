import type { UseQueryResult } from '@tanstack/react-query';
import { FormNotice } from '../../components/FormNotice';
import { SurfaceCard } from '../../components/SurfaceCard';
import { formatEnumLabel } from '../../lib/format';
import { getErrorMessage } from '../../lib/api';
import type { WorkspaceMember } from '../../types/api';
import { firstPasswordSetupLabel } from './first-password-setup-label';

interface WorkspaceMembersCardProps {
  membersQuery: UseQueryResult<WorkspaceMember[]>;
  canManageTeam: boolean;
}

export function WorkspaceMembersCard({
  membersQuery,
  canManageTeam,
}: WorkspaceMembersCardProps) {
  return (
    <SurfaceCard
      title="Team members"
      description="Everyone in this workspace: email, name, and role."
    >
      {membersQuery.isPending ? (
        <p className="muted">Loading…</p>
      ) : membersQuery.isError ? (
        <FormNotice
          message={
            getErrorMessage(membersQuery.error) ||
            'Could not load team members.'
          }
          tone="error"
        />
      ) : !membersQuery.data?.length ? (
        <p className="muted">No members found.</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                {canManageTeam ? (
                  <th title="Invitees only: one-time password must be replaced once.">
                    First password
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {membersQuery.data.map((m) => {
                const firstPw = canManageTeam
                  ? firstPasswordSetupLabel(m)
                  : null;
                return (
                  <tr key={m.id}>
                    <td>{m.email}</td>
                    <td>{m.fullName}</td>
                    <td>{formatEnumLabel(m.role)}</td>
                    {firstPw ? (
                      <td className="muted" title={firstPw.title}>
                        {firstPw.label}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SurfaceCard>
  );
}
