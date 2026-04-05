import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { AuthShell } from '../components/AuthShell';
import { FormNotice } from '../components/FormNotice';
import { ManagerSignupExplainer } from '../components/ManagerSignupExplainer';
import { fetchAuthStatus, getErrorMessage } from '../lib/api';

const PASSWORD_HINT =
  'At least 8 characters, including one letter and one number.';

function describeSignupFailure(error: unknown): string {
  const detail = getErrorMessage(error);

  if (axios.isAxiosError(error) && error.response?.status === 409) {
    return `${detail} Try signing in, or use a different email address.`;
  }

  if (axios.isAxiosError(error) && error.response?.status === 400) {
    return detail || 'Please check the form and try again.';
  }

  return detail || 'Something went wrong. Please try again.';
}

export function SignUpPage() {
  const { bootstrapWorkspace, status } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ['auth-status'],
    queryFn: fetchAuthStatus,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/', { replace: true });
    }
  }, [status, navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
      setFormError(PASSWORD_HINT);
      return;
    }

    setSubmitting(true);

    try {
      await bootstrapWorkspace(email.trim(), password, fullName.trim());
      navigate('/', { replace: true });
    } catch (error) {
      setFormError(describeSignupFailure(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading' || statusQuery.isPending) {
    return (
      <div className="auth-boot">
        <div className="auth-boot-inner">
          <div className="auth-boot-mark">SkyOps</div>
          <p className="muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (statusQuery.isError) {
    return (
      <AuthShell
        brandContent={
          <div className="auth-shell-brand-stack">
            <ManagerSignupExplainer />
          </div>
        }
        footer={
          <p className="muted auth-switch">
            <Link className="auth-inline-link" to="/sign-in">
              Back to sign in
            </Link>
          </p>
        }
        subtitle="We could not reach the server to verify sign-up availability."
        title="Connection issue"
      >
        <FormNotice
          message="Try again in a moment or contact support if the problem continues."
          tone="error"
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      brandContent={
        <div className="auth-shell-brand-stack">
          <ManagerSignupExplainer />
        </div>
      }
      footer={
        <p className="muted auth-switch">
          Already have an account?{' '}
          <Link className="auth-inline-link" to="/sign-in">
            Sign in
          </Link>
        </p>
      }
      subtitle="You will be the Workspace Manager with full fleet access. Pilot and Technician accounts are added later from Settings."
      title="Sign up"
    >
      <div className="signup-form-preamble">
        <span className="signup-form-ribbon">Workspace Manager</span>
        <p className="signup-form-hint muted">
          Registration for fleet owners and operations managers. Manage drones,
          schedule missions, and invite your crew from Settings.
        </p>
      </div>

      {formError ? <FormNotice message={formError} tone="error" /> : null}

      <form className="auth-form" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">Your full name</span>
          <input
            required
            autoComplete="name"
            className="input"
            data-testid="signup-name-input"
            minLength={2}
            placeholder="Alex Rivera"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Work email</span>
          <input
            required
            autoComplete="email"
            className="input"
            data-testid="signup-email-input"
            inputMode="email"
            placeholder="you@operations.example"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <span className="muted field-hint">
            This email will be your Manager login for this workspace.
          </span>
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <div className="password-field">
            <input
              required
              autoComplete="new-password"
              className="input password-field-input"
              data-testid="signup-password-input"
              minLength={8}
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
          <span className="field-hint">{PASSWORD_HINT}</span>
        </label>

        <label className="field">
          <span className="field-label">Confirm password</span>
          <input
            required
            autoComplete="new-password"
            className="input"
            data-testid="signup-confirm-input"
            placeholder="Repeat password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>

        <div className="form-actions auth-form-actions">
          <button
            className="button auth-submit"
            data-testid="signup-submit"
            disabled={submitting}
            type="submit"
          >
            {submitting
              ? 'Creating Manager account…'
              : 'Create Manager account'}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
