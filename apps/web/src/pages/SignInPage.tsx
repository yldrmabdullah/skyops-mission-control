import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { AuthShell } from '../components/AuthShell';
import { FormNotice } from '../components/FormNotice';

export function SignInPage() {
  const { signIn, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rawFrom =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ??
    '/dashboard';
  const from =
    rawFrom && rawFrom !== '/sign-in' && rawFrom !== '/sign-up'
      ? rawFrom
      : '/dashboard';
  const sessionExpired = Boolean(
    (location.state as { sessionExpired?: boolean })?.sessionExpired,
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      navigate(from, { replace: true });
    }
  }, [status, from, navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch {
      setFormError(
        'Invalid email or password. Check your credentials and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
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
      footer={
        <p className="muted auth-switch">
          New to the console?{' '}
          <Link className="auth-inline-link" to="/sign-up">
            Create an operator account
          </Link>
        </p>
      }
      subtitle="Sign in with the email and password issued to your operations team."
      title="Welcome back"
    >
      {sessionExpired ? (
        <FormNotice
          message="Your session expired. Please sign in again to continue."
          tone="warning"
        />
      ) : null}

      {formError ? <FormNotice message={formError} tone="error" /> : null}

      <form className="auth-form" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">Work email</span>
          <input
            required
            autoComplete="email"
            className="input"
            data-testid="signin-email-input"
            inputMode="email"
            placeholder="you@skyops.io"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <div className="password-field">
            <input
              required
              autoComplete="current-password"
              className="input password-field-input"
              data-testid="signin-password-input"
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="button ghost password-toggle"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <p className="field-hint">
          Forgot access? Contact your SkyOps administrator — self-service
          recovery is not enabled for this environment.
        </p>

        <div className="form-actions auth-form-actions">
          <button
            className="button auth-submit"
            data-testid="signin-submit"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
