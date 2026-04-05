import { type FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { AuthShell } from '../components/AuthShell';
import { changePassword, getErrorMessage } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  Lock,
  ChevronRight,
  LogOut
} from 'lucide-react';

const PASSWORD_HINT = 'At least 8 characters, including one letter and one number.';

export function ChangePasswordPage() {
  const { user, refreshProfile, signOut, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const rawFrom = (location.state as { from?: { pathname?: string } })?.from?.pathname;
  const from =
    rawFrom &&
    rawFrom !== '/sign-in' &&
    rawFrom !== '/sign-up' &&
    rawFrom !== '/workspace/bootstrap' &&
    rawFrom !== '/account/change-password'
      ? rawFrom
      : '/';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && user && !user.mustChangePassword) {
      void navigate(from === '/account/change-password' ? '/' : from, {
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
      void navigate(from, { replace: true });
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
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing Security Protocol…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      subtitle="Complete your security profile by establishing a permanent password."
      title="Security Update"
      footer={
        <div className="flex flex-col gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-destructive gap-2 self-center"
            onClick={() => signOut()}
          >
            <LogOut size={14} />
            Sign Out
          </Button>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">
            Internal Operations Shell v4.0.1
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {user.mustChangePassword && (
          <Alert className="glass bg-amber-500/10 border-amber-500/20 text-amber-600">
            <Lock className="h-4 w-4" />
            <AlertTitle className="text-xs font-bold uppercase tracking-widest">Action Required</AlertTitle>
            <AlertDescription className="text-xs">
              For security, you must change your temporary password before accessing the mission control dashboard.
            </AlertDescription>
          </Alert>
        )}

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
            <Label htmlFor="currentPassword">Current Security Code</Label>
            <div className="relative group">
              <Input
                id="currentPassword"
                required
                placeholder="Temporary or existing password"
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Identity Password</Label>
            <Input
              id="newPassword"
              required
              minLength={8}
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="glass"
            />
            <p className="text-[9px] text-muted-foreground uppercase tracking-tighter px-1 font-medium">
              {PASSWORD_HINT}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              required
              placeholder="Repeat new password"
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
                  Updating Security...
                </span>
              ) : (
                <>
                  <KeyRound size={18} />
                  Update Credentials
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
