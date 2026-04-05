import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../auth/use-auth';
import { StatePanel } from '../components/StatePanel';
import { SettingsPasswordCard } from '../features/settings/SettingsPasswordCard';
import { SettingsProfileCard } from '../features/settings/SettingsProfileCard';
import { TeamInviteCard } from '../features/settings/TeamInviteCard';
import { WorkspaceMembersCard } from '../features/settings/WorkspaceMembersCard';
import { WORKSPACE_MEMBERS_QUERY_KEY } from '../features/settings/workspace-members-query-key';
import {
  changePassword,
  createTeamMember,
  getErrorMessage,
  listWorkspaceMembers,
  updateProfile,
} from '../lib/api';
import { isWorkspaceRootManager } from '../lib/roles';

export function SettingsPage() {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [profileFeedback, setProfileFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [teamFeedback, setTeamFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  const [invitePassword, setInvitePassword] = useState<string | null>(null);

  const canManageTeam = isWorkspaceRootManager(user);

  const membersQuery = useQuery({
    queryKey: WORKSPACE_MEMBERS_QUERY_KEY,
    queryFn: listWorkspaceMembers,
    enabled: Boolean(user),
  });

  const profileMutation = useMutation({
    mutationFn: (fullName: string) => updateProfile({ fullName }),
    onSuccess: async () => {
      await refreshProfile();
      setProfileFeedback({
        tone: 'success',
        message: 'Profile updated.',
      });
    },
    onError: (error) => {
      setProfileFeedback({
        tone: 'error',
        message: getErrorMessage(error) || 'Could not update profile.',
      });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      changePassword(payload),
    onSuccess: async () => {
      await refreshProfile();
      setPasswordFeedback({
        tone: 'success',
        message: 'Password updated.',
      });
    },
    onError: (error) => {
      setPasswordFeedback({
        tone: 'error',
        message:
          getErrorMessage(error) ||
          'Could not change password. Check your current password.',
      });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: createTeamMember,
    onSuccess: (data) => {
      setInvitePassword(data.temporaryPassword);
      setTeamFeedback({
        tone: 'success',
        message: `Account created for ${data.member.email}. Copy the one-time password below and share it securely — it is not shown again.`,
      });
      void queryClient.invalidateQueries({
        queryKey: WORKSPACE_MEMBERS_QUERY_KEY,
      });
    },
    onError: (error) => {
      setInvitePassword(null);
      setTeamFeedback({
        tone: 'error',
        message: getErrorMessage(error) || 'Could not create team member.',
      });
    },
  });

  if (!user) {
    return (
      <StatePanel
        description="Sign in to manage your account and workspace."
        title="Settings unavailable"
      />
    );
  }

  return (
    <>
      <header className="page-header">
        <div>
          <div className="badge">Workspace</div>
          <h2>Settings</h2>
          <p>
            Profile and password; see everyone in your workspace below. Managers
            can invite pilots and technicians.
          </p>
        </div>
        <div className="badge">Role: {user.role}</div>
      </header>

      <section className="panel-grid split">
        <SettingsProfileCard
          feedback={profileFeedback}
          isPending={profileMutation.isPending}
          user={user}
          onClearFeedback={() => setProfileFeedback(null)}
          onSubmit={(fullName) => profileMutation.mutate(fullName)}
        />

        <SettingsPasswordCard
          feedback={passwordFeedback}
          isPending={passwordMutation.isPending}
          onClearFeedback={() => setPasswordFeedback(null)}
          onClientValidationError={(message) =>
            setPasswordFeedback({ tone: 'error', message })
          }
          onSubmit={(payload) => passwordMutation.mutate(payload)}
        />
      </section>

      <section className="panel-grid split section-spaced">
        <WorkspaceMembersCard
          canManageTeam={canManageTeam}
          membersQuery={membersQuery}
        />
      </section>

      {canManageTeam ? (
        <section className="panel-grid split section-spaced">
          <TeamInviteCard
            feedback={teamFeedback}
            invitePassword={invitePassword}
            isPending={inviteMutation.isPending}
            onClearState={() => {
              setTeamFeedback(null);
              setInvitePassword(null);
            }}
            onSubmit={(payload) => inviteMutation.mutate(payload)}
          />
        </section>
      ) : null}
    </>
  );
}
