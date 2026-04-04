import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { AuthShell } from '../components/AuthShell';
import { FormNotice } from '../components/FormNotice';
import { ManagerSignupExplainer } from '../components/ManagerSignupExplainer';
import { RoleAccessGuide } from '../components/RoleAccessGuide';
import { fetchAuthStatus, getErrorMessage } from '../lib/api';

const PASSWORD_HINT =
  'At least 8 characters, including one letter and one number.';

function describeSignupFailure(error: unknown): string {
  const detail = getErrorMessage(error);

  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return (
      detail ||
      'This workspace is already set up. Ask your Manager for an account, or sign in.'
    );
  }

  if (axios.isAxiosError(error) && error.response?.status === 409) {
    return `${detail} Try signing in, or use a different email address.`;
  }

  if (axios.isAxiosError(error) && error.response?.status === 400) {
    return detail || 'Please check the form and try again.';
  }

  return detail || 'Something went wrong. Please try again.';
}

/** Shown when GET /auth/status reports bootstrapAvailable: false (≥1 user in DB). */
function SignupClosedView() {
  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');

  return (
    <AuthShell
      brandContent={
        <div className="auth-shell-brand-stack">
          <div className="signup-explainer">
            <div className="badge auth-shell-badge">
              Manager sign-up unavailable
            </div>
            <h2 className="auth-shell-headline">
              This workspace already has users
            </h2>
            <p className="auth-shell-lede">
              The first <strong>Workspace Manager</strong> (or any seeded account)
              is already in the database. New <strong>Pilots</strong> and{' '}
              <strong>Technicians</strong> are created by that Manager from{' '}
              <strong>Settings → Team</strong> — not from this sign-up page.
            </p>
          </div>
          <RoleAccessGuide lead="Use Sign in with the email your Manager invited. You will get a one-time password, then choose your own password." />
        </div>
      }
      footer={
        <p className="muted auth-switch">
          <Link className="auth-inline-link" to="/sign-in">
            Go to sign in
          </Link>
        </p>
      }
      subtitle="This is expected whenever the user table is not empty — not a broken sign-up screen."
      title="Sign up"
    >
      <FormNotice
        message="Ask your workspace Manager to send an invitation to your work email."
        tone="warning"
      />
      <p className="signup-closed-context muted">
        The full Manager registration form only appears while the API reports{' '}
        <strong>zero</strong> user accounts. Your environment already has at
        least one (often from seed data or a previous sign-up).
      </p>
      {isLocalHost ? (
        <details className="signup-local-reset" open>
          <summary className="signup-local-reset-summary">
            Local Docker — reset the database to open Manager sign-up again
          </summary>
          <div className="signup-local-reset-body">
            <p>
              Postgres is probably keeping old rows in a Docker volume (for
              example after <code>pnpm --filter @skyops/api seed</code>).
            </p>
            <p>
              <strong>1.</strong> From the repository root, wipe the volume and
              restart (destructive — deletes all local SkyOps data):
            </p>
            <pre className="signup-local-reset-code">
              pnpm docker:db:reset
            </pre>
            <p className="muted signup-local-reset-alt">
              Same thing manually: <code>docker compose down -v</code> then{' '}
              <code>docker compose up -d --build</code>
            </p>
            <p>
              <strong>2.</strong> When the API is up, open <strong>/sign-up</strong>{' '}
              again — you should see the Manager form.
            </p>
            <p>
              <strong>3.</strong> Skip <code>pnpm seed</code> until after you
              finish Manager sign-up, if you want to exercise that flow.
            </p>
            <p className="muted signup-local-reset-foot">
              Prefer to keep data? Sign in with your existing Manager (seeded
              demo is often <code>ops@skyops.demo</code>) and invite users from
              Settings.
            </p>
          </div>
        </details>
      ) : null}
    </AuthShell>
  );
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
      navigate('/dashboard', { replace: true });
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
      navigate('/dashboard', { replace: true });
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
        subtitle="We could not reach the server to check whether sign-up is open."
        title="Connection issue"
      >
        <FormNotice
          message="Try again in a moment or contact support if the problem continues."
          tone="error"
        />
      </AuthShell>
    );
  }

  if (!statusQuery.data?.bootstrapAvailable) {
    return <SignupClosedView />;
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
            {submitting ? 'Creating Manager account…' : 'Create Manager account'}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
