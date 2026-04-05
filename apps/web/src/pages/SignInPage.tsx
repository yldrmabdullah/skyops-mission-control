import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { AuthShell } from '../components/AuthShell';
import { getErrorMessage } from '../lib/api';
import {
  demoManagerEmail,
  demoManagerPassword,
  demoWorkspaceHintEnabled,
} from '../lib/demo-workspace';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  HelpCircle,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export function SignInPage() {
  const { signIn, status, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rawFrom =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ??
    '/';
  const from =
    rawFrom &&
    rawFrom !== '/sign-in' &&
    rawFrom !== '/sign-up' &&
    rawFrom !== '/workspace/bootstrap' &&
    rawFrom !== '/account/change-password'
      ? rawFrom
      : '/';
  const sessionExpired = Boolean(
    (location.state as { sessionExpired?: boolean })?.sessionExpired,
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !user) {
      return;
    }
    if (user.mustChangePassword) {
      void navigate('/account/change-password', {
        replace: true,
        state: { from: { pathname: from } },
      });
    } else {
      void navigate(from, { replace: true });
    }
  }, [status, user, from, navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const signedIn = await signIn(email.trim(), password);
      if (signedIn.mustChangePassword) {
        void navigate('/account/change-password', {
          replace: true,
          state: { from: { pathname: from } },
        });
      } else {
        void navigate(from, { replace: true });
      }
    } catch (error) {
      const detail = getErrorMessage(error);
      setFormError(
        detail ||
          'Invalid email or password. Check your credentials and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing SkyOps Terminal…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      subtitle="Authorized personnel access for drone fleet operations and mission command."
      title="Terminal Access"
      footer={
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            New operator?{' '}
            <Link className="text-primary font-bold hover:underline" to="/sign-up">
              Register Workspace
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            <ShieldCheck size={10} />
            Secure Authentication Protocol
          </div>
        </div>
      }
    >
      {sessionExpired && (
        <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-600 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium text-xs">
            Your session expired. Please re-authenticate.
          </AlertDescription>
        </Alert>
      )}

      {formError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium text-xs">
            {formError}
          </AlertDescription>
        </Alert>
      )}

      {demoWorkspaceHintEnabled && (
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-primary/60">
            <span>Demo Mode</span>
            <HelpCircle size={12} />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground font-medium">Use seeded manager credentials:</p>
            <code className="block text-[10px] bg-background/50 p-2 rounded border border-primary/5 font-mono truncate">
              {demoManagerEmail} / {demoManagerPassword}
            </code>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-[10px] h-8 glass"
            onClick={() => {
              setEmail(demoManagerEmail);
              setPassword(demoManagerPassword);
            }}
          >
            Fill Demo Credentials
          </Button>
        </div>
      )}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Operator Email</Label>
          <Input
            id="email"
            data-testid="signin-email-input"
            required
            autoComplete="email"
            placeholder="pilot@skyops.io"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="glass"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Security Code / Password</Label>
          </div>
          <div className="relative group">
            <Input
              id="password"
              data-testid="signin-password-input"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="glass pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
        </div>

        <div className="pt-2">
          <Button
            data-testid="signin-submit"
            className="w-full h-11 text-base font-bold shadow-lg hover:shadow-primary/20 transition-all gap-2"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Authenticating...
              </span>
            ) : (
              <>
                <LogIn size={18} />
                Sign In to Command Center
                <ChevronRight size={18} />
              </>
            )}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
