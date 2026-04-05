import { OPERATOR_ROLE_ACCESS, roleTitle } from '../lib/role-descriptions';

interface RoleAccessGuideProps {
  lead: string;
}

export function RoleAccessGuide({ lead }: RoleAccessGuideProps) {
  return (
    <div className="form-notice info role-access-guide">
      <p className="role-access-guide-lead">{lead}</p>
      <ul className="role-access-guide-list">
        {OPERATOR_ROLE_ACCESS.map(({ role, summary }) => (
          <li key={role}>
            <strong>{roleTitle(role)}</strong>
            {' — '}
            {summary}
          </li>
        ))}
      </ul>
    </div>
  );
}
