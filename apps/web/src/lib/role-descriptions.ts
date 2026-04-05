import type { OperatorRole } from '../types/api';
import { formatEnumLabel } from './format';

const ROLE_LABEL: Record<OperatorRole, string> = {
  PILOT: 'Pilot',
  TECHNICIAN: 'Technician',
  MANAGER: 'Manager',
};

export function roleTitle(role: OperatorRole | undefined): string {
  if (role === undefined) return '';
  return ROLE_LABEL[role] ?? formatEnumLabel(role);
}

/** RBAC copy aligned with API guards and mission/maintenance rules. */
export const OPERATOR_ROLE_ACCESS: {
  role: OperatorRole;
  summary: string;
}[] = [
  {
    role: 'PILOT',
    summary:
      'Missions: schedule, edit planned work, and run status transitions. Drone registry is view-oriented. Detailed maintenance history and attachments are hidden from this role.',
  },
  {
    role: 'TECHNICIAN',
    summary:
      'Maintenance: record service events and file attachments on drones. Mission scheduling and lifecycle transitions are reserved for Pilots and Managers. Fleet registration stays with Managers.',
  },
  {
    role: 'MANAGER',
    summary:
      'Workspace owner: register drones, edit profiles, and remove assets when allowed. Full maintenance logging, the mission board, and Settings → Team to invite Pilots and Technicians with a one-time password.',
  },
];

/** One-time banner after a successful sign-in (or right after workspace bootstrap). */
export function postAuthWelcomeMessage(role: OperatorRole): string {
  const title = roleTitle(role);
  const caps =
    role === 'MANAGER'
      ? 'You can register drones, edit fleet data, record maintenance, run the full mission board, and invite pilots and technicians from Settings.'
      : role === 'TECHNICIAN'
        ? 'You can log maintenance and uploads; use the mission board read-only for awareness. Scheduling and transitions are for Pilots and Managers.'
        : 'You can plan and fly missions. Fleet edits are for Managers; maintenance detail and uploads are for Technicians and Managers.';

  return `Signed in as ${title}. ${caps}`;
}
