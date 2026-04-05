import { type FormEvent } from 'react';
import { FormNotice } from '../../components/FormNotice';
import { SurfaceCard } from '../../components/SurfaceCard';
import {
  PASSWORD_POLICY_HINT,
  validatePasswordChange,
} from './password-policy';

interface Feedback {
  tone: 'success' | 'error';
  message: string;
}

interface SettingsPasswordCardProps {
  feedback: Feedback | null;
  isPending: boolean;
  onSubmit: (payload: {
    currentPassword: string;
    newPassword: string;
  }) => void;
  onClientValidationError: (message: string) => void;
  onClearFeedback: () => void;
}

export function SettingsPasswordCard({
  feedback,
  isPending,
  onSubmit,
  onClientValidationError,
  onClearFeedback,
}: SettingsPasswordCardProps) {
  return (
    <SurfaceCard
      title="Password"
      description="Change your password anytime. New team members must set theirs on first sign-in."
    >
      <form
        className="form-grid"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onClearFeedback();
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
          const validationError = validatePasswordChange(newPassword, confirm);
          if (validationError) {
            onClientValidationError(validationError);
            return;
          }
          onSubmit({ currentPassword, newPassword });
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
          <span className="field-hint">{PASSWORD_POLICY_HINT}</span>
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
        {feedback ? (
          <FormNotice message={feedback.message} tone={feedback.tone} />
        ) : null}
        <div className="form-actions">
          <button
            className="button secondary"
            disabled={isPending}
            type="submit"
          >
            {isPending ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </SurfaceCard>
  );
}
