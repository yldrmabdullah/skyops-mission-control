import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../auth/use-auth';
import { AuthShell } from '../components/AuthShell';
import { fetchAuthStatus, getErrorMessage } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { 
  UserPlus, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  Info,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

const PASSWORD_HINT = 'At least 8 characters, including one letter and one number.';

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
      void navigate('/', { replace: true });
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
      void navigate('/', { replace: true });
    } catch (error) {
      setFormError(describeSignupFailure(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading' || statusQuery.isPending) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing Workspace Bootstrap…</p>
        </div>
      </div>
    );
  }

  if (statusQuery.isError) {
    return (
      <AuthShell
        subtitle="Network timeout or server connectivity issue."
        title="Bootstrap Offline"
        footer={
          <Link className="flex items-center justify-center gap-2 text-sm text-primary font-bold hover:underline" to="/sign-in">
            <ArrowLeft size={14} />
            Return to Sign In
          </Link>
        }
      >
        <Alert variant="destructive" className="glass bg-destructive/10 border-destructive/20">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Connection Failed</AlertTitle>
          <AlertDescription className="text-xs">
            We could not reach the SkyOps server. Please verify your connection and try again.
          </AlertDescription>
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      subtitle="Establish a new workspace as the primary Manager. Your crew members are invited later from Settings."
      title="Create Workspace"
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link className="text-primary font-bold hover:underline" to="/sign-in">
            Sign In
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <Alert className="glass bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-xs font-bold uppercase tracking-widest text-primary">Manager Registration</AlertTitle>
          <AlertDescription className="text-[11px] text-muted-foreground leading-relaxed">
            You are registering as the <strong>Workspace Manager</strong>. You will have full authority over drones, mission control, and team access.
          </AlertDescription>
        </Alert>

        {formError && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription className="font-medium text-xs">
              {formError}
            </AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Manager Full Name</Label>
            <Input
              id="fullName"
              required
              placeholder="Alex Rivera"
              minLength={2}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="glass"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input
              id="email"
              required
              type="email"
              placeholder="alex@operations.sky"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="glass"
            />
            <p className="text-[10px] text-muted-foreground italic px-1">
              Used for workspace administration and secure logins.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Security Password</Label>
            <div className="relative group">
              <Input
                id="password"
                required
                minLength={8}
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="glass pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-tighter px-1 font-medium">
              {PASSWORD_HINT}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              required
              placeholder="Repeat entry"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="glass"
            />
          </div>

          <div className="pt-4">
            <Button 
              className="w-full h-11 text-base font-bold shadow-lg hover:shadow-primary/20 transition-all gap-2" 
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating Workspace...
                </span>
              ) : (
                <>
                  <UserPlus size={18} />
                  Bootstrap Workspace
                  <ChevronRight size={18} />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
