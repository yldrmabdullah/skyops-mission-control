import { type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { CheckCircle2, AlertCircle, Key, Lock } from 'lucide-react';
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
    <Card className="glass border-primary/10 transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary mb-1">
          <Key size={18} />
          <CardTitle className="text-xl">Security</CardTitle>
        </div>
        <CardDescription>
          Change your password to keep your account secure. Non-manager accounts might have mandatory first-time password resets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
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
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="glass"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="••••••••"
              className="glass"
            />
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground bg-primary/5 p-2 rounded-md border border-primary/10">
              {PASSWORD_POLICY_HINT}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
              className="glass"
            />
          </div>

          {feedback && (
            <Alert variant={feedback.tone === 'success' ? 'default' : 'destructive'} 
              className={feedback.tone === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-destructive/10 border-destructive/20'}>
              {feedback.tone === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription className="font-medium">
                {feedback.message}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full sm:w-auto min-w-[140px] gap-2 shadow-md hover:shadow-lg transition-all"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Updating...
              </span>
            ) : (
              <>
                <Lock size={16} />
                Update Password
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
