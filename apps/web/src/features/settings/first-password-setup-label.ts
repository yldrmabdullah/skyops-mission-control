import type { WorkspaceMember } from '../../types/api';

/** Invitees get mustChangePassword; workspace owner row omits it. */
export function firstPasswordSetupLabel(member: WorkspaceMember): {
  label: string;
  title: string;
} {
  if (member.mustChangePassword === true) {
    return {
      label: 'Pending password',
      title:
        'User signed in with a one-time password and must set a new password before using the console.',
    };
  }
  if (member.mustChangePassword === false) {
    return {
      label: 'Complete',
      title: 'User has finished first-time password setup.',
    };
  }
  return {
    label: 'Not required',
    title:
      'Workspace owner account (bootstrap). No invite or one-time password step.',
  };
}
