import { FormNotice } from '../../components/FormNotice';
import { SurfaceCard } from '../../components/SurfaceCard';
import type { AuthUser } from '../../types/api';

interface Feedback {
  tone: 'success' | 'error';
  message: string;
}

interface SettingsProfileCardProps {
  user: AuthUser;
  feedback: Feedback | null;
  isPending: boolean;
  onSubmit: (fullName: string) => void;
  onClearFeedback: () => void;
}

export function SettingsProfileCard({
  user,
  feedback,
  isPending,
  onSubmit,
  onClearFeedback,
}: SettingsProfileCardProps) {
  return (
    <SurfaceCard
      title="Profile"
      description="Your display name as it appears in the console."
    >
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onClearFeedback();
          const form = event.currentTarget;
          const fullName = (
            form.elements.namedItem('fullName') as HTMLInputElement
          ).value.trim();
          onSubmit(fullName);
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
        {feedback ? (
          <FormNotice message={feedback.message} tone={feedback.tone} />
        ) : null}
        <div className="form-actions">
          <button
            className="button secondary"
            disabled={isPending}
            type="submit"
          >
            {isPending ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </SurfaceCard>
  );
}
