import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Settings as SettingsIcon, Shield, Users, Info } from 'lucide-react';
import { useAuth } from '../auth/use-auth';
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
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';

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
        message: 'Profile updated successfully.',
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
        message: 'Password updated successfully.',
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
        message: `Account created for ${data.member.email}. Copy the temporary password below.`,
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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Shield size={48} className="text-muted-foreground opacity-20" />
        <h2 className="text-2xl font-bold">Settings Unavailable</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          Please sign in to manage your account and workspace settings.
        </p>
        <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            <SettingsIcon size={16} className="text-primary" />
            Workspace
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Manage your personal profile, account security, and workspace team members.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className="h-8 px-4 text-sm font-medium glass border-primary/20 bg-primary/5 text-primary">
            Signed in as {user.role}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
            ID: {user.id}
          </span>
        </div>
      </header>

      <Alert className="glass bg-primary/5 border-primary/20 max-w-4xl">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-semibold">Workspace Management</AlertTitle>
        <AlertDescription className="text-muted-foreground text-sm">
          Managers can invite new pilots and technicians. All participants can update their own profile and security credentials.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
      </div>

      <div className="space-y-8 pt-4">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight px-1">
          <Users size={20} className="text-primary" />
          Team & Members
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className={canManageTeam ? "lg:col-span-12 xl:col-span-7" : "lg:col-span-12"}>
            <WorkspaceMembersCard
              canManageTeam={canManageTeam}
              membersQuery={membersQuery}
            />
          </div>
          
          {canManageTeam && (
            <div className="lg:col-span-12 xl:col-span-5">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
