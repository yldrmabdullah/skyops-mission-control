import { type FormEvent } from 'react';
import { FormNotice } from '../../components/FormNotice';
import { SurfaceCard } from '../../components/SurfaceCard';
import type { OperatorRole } from '../../types/api';

interface Feedback {
  tone: 'success' | 'error';
  message: string;
}

interface TeamInviteCardProps {
  feedback: Feedback | null;
  invitePassword: string | null;
  isPending: boolean;
  onSubmit: (payload: {
    email: string;
    fullName: string;
    role: Extract<OperatorRole, 'PILOT' | 'TECHNICIAN'>;
  }) => void;
  onClearState: () => void;
}

export function TeamInviteCard({
  feedback,
  invitePassword,
  isPending,
  onSubmit,
  onClearState,
}: TeamInviteCardProps) {
  return (
    <SurfaceCard
      title="Invite team members"
      description="Create Pilot or Technician accounts with their work email. They sign in with a one-time password, then set their own password."
    >
      {feedback ? (
        <FormNotice message={feedback.message} tone={feedback.tone} />
      ) : null}
      {invitePassword ? (
        <div className="invite-otp-panel field">
          <span className="field-label">One-time password (copy now)</span>
          <code>{invitePassword}</code>
        </div>
      ) : null}
      <form
        className="form-grid"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onClearState();
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
          onSubmit({ email, fullName, role });
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
            disabled={isPending}
            type="submit"
          >
            {isPending ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>
    </SurfaceCard>
  );
}
