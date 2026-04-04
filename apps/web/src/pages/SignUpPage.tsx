import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { AuthShell } from '../components/AuthShell';
import { FormNotice } from '../components/FormNotice';

const PASSWORD_HINT =
  'At least 8 characters, including one letter and one number.';

export function SignUpPage() {
  const { signUp, status } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      await signUp(email.trim(), password, fullName.trim());
      navigate('/dashboard', { replace: true });
    } catch {
      setFormError(
        'Could not create your account. The email may already be registered.',
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
          Already registered?{' '}
          <Link className="auth-inline-link" to="/sign-in">
            Sign in instead
          </Link>
        </p>
      }
      subtitle="Create a secure operator profile. You will be signed in immediately after registration."
      title="Join the operations console"
    >
      {formError ? <FormNotice message={formError} tone="error" /> : null}

      <form className="auth-form" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">Full name</span>
          <input
            required
            autoComplete="name"
            className="input"
            data-testid="signup-name-input"
            minLength={2}
            placeholder="Jane Pilot"
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
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
