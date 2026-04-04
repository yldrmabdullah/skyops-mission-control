import { type FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { AuthBrandStory } from '../components/AuthBrandStory';
import { AuthShell } from '../components/AuthShell';
import { FormNotice } from '../components/FormNotice';
import { changePassword, getErrorMessage } from '../lib/api';

const PASSWORD_HINT =
  'At least 8 characters, including one letter and one number.';

export function ChangePasswordPage() {
  const { user, refreshProfile, signOut, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ??
    '/dashboard';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && user && !user.mustChangePassword) {
      navigate(from === '/account/change-password' ? '/dashboard' : from, {
        replace: true,
      });
    }
  }, [status, user, navigate, from]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (newPassword !== confirmPassword) {
      setFormError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setFormError('New password must be at least 8 characters.');
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(newPassword)) {
      setFormError(PASSWORD_HINT);
      return;
    }

    setSubmitting(true);

    try {
      await changePassword({ currentPassword, newPassword });
      await refreshProfile();
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(
        getErrorMessage(error) ||
          'Could not update password. Check your current password.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading' || !user) {
    return (
      <div className="auth-boot">
        <div className="auth-boot-inner">
          <div className="auth-boot-mark">SkyOps</div>
          <p className="muted">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      brandContent={
        <div className="auth-shell-brand-stack">
          <AuthBrandStory />
        </div>
      }
      footer={
        <p className="muted auth-switch">
          <button
            className="button ghost"
            type="button"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </p>
      }
      subtitle="Use the one-time password you were given, then choose a new password you will keep."
      title="Set your password"
    >
      {user.mustChangePassword ? (
        <FormNotice
          message="For security, you must change your password before using the console."
          tone="warning"
        />
      ) : null}

      {formError ? <FormNotice message={formError} tone="error" /> : null}

      <form className="auth-form" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">Current password</span>
          <div className="password-field">
            <input
              required
              autoComplete="current-password"
              className="input password-field-input"
              data-testid="change-password-current"
              placeholder="One-time or existing password"
              type={showPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <button
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="button ghost password-toggle"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <label className="field">
          <span className="field-label">New password</span>
          <input
            required
            autoComplete="new-password"
            className="input"
            data-testid="change-password-new"
            minLength={8}
            placeholder="••••••••"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <span className="field-hint">{PASSWORD_HINT}</span>
        </label>

        <label className="field">
          <span className="field-label">Confirm new password</span>
          <input
            required
            autoComplete="new-password"
            className="input"
            data-testid="change-password-confirm"
            placeholder="Repeat new password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>

        <div className="form-actions auth-form-actions">
          <button
            className="button auth-submit"
            data-testid="change-password-submit"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
