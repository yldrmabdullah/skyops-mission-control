import { type AuthUser } from '../../types/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { CheckCircle2, AlertCircle, Save, User } from 'lucide-react';

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
    <Card className="glass border-primary/10 transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary mb-1">
          <User size={18} />
          <CardTitle className="text-xl">Profile</CardTitle>
        </div>
        <CardDescription>
          Your display name as it appears in the mission control console.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-6"
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
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              required
              minLength={2}
              defaultValue={user.fullName}
              placeholder="Enter your full name"
              className="glass focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-muted-foreground">Email Address</Label>
            <Input
              id="email"
              type="email"
              readOnly
              value={user.email}
              className="bg-muted/50 cursor-not-allowed border-dashed"
            />
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
              Contact your Manager to change the sign-in email.
            </p>
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
                Saving...
              </span>
            ) : (
              <>
                <Save size={16} />
                Save Profile
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
