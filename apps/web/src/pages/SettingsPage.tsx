import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { useAuth } from '../auth/use-auth';
import { FormNotice } from '../components/FormNotice';
import { StatePanel } from '../components/StatePanel';
import { SurfaceCard } from '../components/SurfaceCard';
import {
  changePassword,
  createTeamMember,
  getErrorMessage,
  listWorkspaceMembers,
  updateProfile,
} from '../lib/api';
import { formatEnumLabel } from '../lib/format';
import { isWorkspaceRootManager } from '../lib/roles';
import type { OperatorRole, WorkspaceMember } from '../types/api';

/** Manager-only column: invitees get mustChangePassword; workspace owner row omits it. */
function firstPasswordSetupLabel(member: WorkspaceMember): {
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

const PASSWORD_HINT =
  'At least 8 characters, including one letter and one number.';

const WORKSPACE_MEMBERS_QUERY_KEY = ['workspace-members'] as const;

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
            Profile and password; see everyone in your workspace below.
            Managers can invite pilots and technicians.
          </p>
        </div>
        <div className="badge">Role: {user.role}</div>
      </header>

      <section className="panel-grid split">
        <SurfaceCard
          title="Profile"
          description="Your display name as it appears in the console."
        >
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              setProfileFeedback(null);
              const form = event.currentTarget;
              const fullName = (
                form.elements.namedItem('fullName') as HTMLInputElement
              ).value.trim();
              profileMutation.mutate(fullName);
            }}
          >
            <label className="field">
              <span className="field-label">Full name</span>
              <input
                required
                className="input"
                defaultValue={user.fullName}
                minLength={2}
                name="fullName"
                type="text"
              />
            </label>
            <label className="field">
              <span className="field-label">Email</span>
              <input
                readOnly
                className="input"
                value={user.email}
                title="Email is managed by your workspace Manager."
              />
              <span className="muted field-hint">
                Contact your Manager to change the sign-in email.
              </span>
            </label>
            {profileFeedback ? (
              <FormNotice
                message={profileFeedback.message}
                tone={profileFeedback.tone}
              />
            ) : null}
            <div className="form-actions">
              <button
                className="button secondary"
                disabled={profileMutation.isPending}
                type="submit"
              >
                {profileMutation.isPending ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        </SurfaceCard>

        <SurfaceCard
          title="Password"
          description="Change your password anytime. New team members must set theirs on first sign-in."
        >
          <form
            className="form-grid"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              setPasswordFeedback(null);
              const form = event.currentTarget;
              const currentPassword = (
                form.elements.namedItem('currentPassword') as HTMLInputElement
              ).value;
              const newPassword = (
                form.elements.namedItem('newPassword') as HTMLInputElement
              ).value;
              const confirm = (
                form.elements.namedItem('confirmPassword') as HTMLInputElement
              ).value;
              if (newPassword !== confirm) {
                setPasswordFeedback({
                  tone: 'error',
                  message: 'New passwords do not match.',
                });
                return;
              }
              if (newPassword.length < 8) {
                setPasswordFeedback({
                  tone: 'error',
                  message: 'New password must be at least 8 characters.',
                });
                return;
              }
              if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(newPassword)) {
                setPasswordFeedback({
                  tone: 'error',
                  message: PASSWORD_HINT,
                });
                return;
              }
              passwordMutation.mutate({ currentPassword, newPassword });
              form.reset();
            }}
          >
            <label className="field">
              <span className="field-label">Current password</span>
              <input
                required
                autoComplete="current-password"
                className="input"
                name="currentPassword"
                type="password"
              />
            </label>
            <label className="field">
              <span className="field-label">New password</span>
              <input
                required
                autoComplete="new-password"
                className="input"
                minLength={8}
                name="newPassword"
                type="password"
              />
              <span className="field-hint">{PASSWORD_HINT}</span>
            </label>
            <label className="field">
              <span className="field-label">Confirm new password</span>
              <input
                required
                autoComplete="new-password"
                className="input"
                name="confirmPassword"
                type="password"
              />
            </label>
            {passwordFeedback ? (
              <FormNotice
                message={passwordFeedback.message}
                tone={passwordFeedback.tone}
              />
            ) : null}
            <div className="form-actions">
              <button
                className="button secondary"
                disabled={passwordMutation.isPending}
                type="submit"
              >
                {passwordMutation.isPending ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </SurfaceCard>
      </section>

      <section className="panel-grid split" style={{ marginTop: '1.5rem' }}>
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
      </section>

      {canManageTeam ? (
        <section className="panel-grid split" style={{ marginTop: '1.5rem' }}>
          <SurfaceCard
            title="Invite team members"
            description="Create Pilot or Technician accounts with their work email. They sign in with a one-time password, then set their own password."
          >
            {teamFeedback ? (
              <FormNotice
                message={teamFeedback.message}
                tone={teamFeedback.tone}
              />
            ) : null}
            {invitePassword ? (
              <div
                className="field"
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'var(--surface-elevated, rgba(255,255,255,0.04))',
                }}
              >
                <span className="field-label">One-time password (copy now)</span>
                <code
                  style={{
                    display: 'block',
                    marginTop: '0.35rem',
                    fontSize: '1rem',
                    wordBreak: 'break-all',
                  }}
                >
                  {invitePassword}
                </code>
              </div>
            ) : null}
            <form
              className="form-grid"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                setTeamFeedback(null);
                setInvitePassword(null);
                const form = event.currentTarget;
                const email = (
                  form.elements.namedItem('inviteEmail') as HTMLInputElement
                ).value.trim();
                const fullName = (
                  form.elements.namedItem('inviteName') as HTMLInputElement
                ).value.trim();
                const role = (
                  form.elements.namedItem('inviteRole') as HTMLSelectElement
                ).value as Extract<OperatorRole, 'PILOT' | 'TECHNICIAN'>;
                inviteMutation.mutate({ email, fullName, role });
                form.reset();
              }}
            >
              <label className="field">
                <span className="field-label">Full name</span>
                <input
                  required
                  className="input"
                  minLength={2}
                  name="inviteName"
                  placeholder="Jamie Pilot"
                  type="text"
                />
              </label>
              <label className="field">
                <span className="field-label">Work email</span>
                <input
                  required
                  className="input"
                  inputMode="email"
                  name="inviteEmail"
                  type="email"
                />
              </label>
              <label className="field">
                <span className="field-label">Role</span>
                <select className="select" name="inviteRole" required>
                  <option value="PILOT">Pilot</option>
                  <option value="TECHNICIAN">Technician</option>
                </select>
              </label>
              <div className="form-actions">
                <button
                  className="button secondary"
                  disabled={inviteMutation.isPending}
                  type="submit"
                >
                  {inviteMutation.isPending ? 'Creating…' : 'Create account'}
                </button>
              </div>
            </form>
          </SurfaceCard>
        </section>
      ) : null}
    </>
  );
}
