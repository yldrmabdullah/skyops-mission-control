import { type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { UserPlus, Mail, ShieldAlert, Copy, CheckCircle2 } from 'lucide-react';
import type { OperatorRole } from '../../types/api';

interface Feedback {
  tone: 'success' | 'error';
  message: string;
}

interface TeamInviteCardProps {
  feedback: Feedback | null;
  invitePassword: string | null;
  isPending: boolean;
  onSubmit: (payload: {
    email: string;
    fullName: string;
    role: Extract<OperatorRole, 'PILOT' | 'TECHNICIAN'>;
  }) => void;
  onClearState: () => void;
}

export function TeamInviteCard({
  feedback,
  invitePassword,
  isPending,
  onSubmit,
  onClearState,
}: TeamInviteCardProps) {
  return (
    <Card className="glass border-primary/10 transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary mb-1">
          <UserPlus size={18} />
          <CardTitle className="text-xl">Invite Team Members</CardTitle>
        </div>
        <CardDescription>
          Provision access for Pilots or Technicians. They will receive a one-time password for their first sign-in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {feedback && (
          <Alert variant={feedback.tone === 'success' ? 'default' : 'destructive'} 
            className={feedback.tone === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-destructive/10 border-destructive/20'}>
            {feedback.tone === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            <AlertDescription className="font-medium">
              {feedback.message}
            </AlertDescription>
          </Alert>
        )}

        {invitePassword && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">One-Time Password</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 gap-1 text-[10px]"
                onClick={() => navigator.clipboard.writeText(invitePassword)}
              >
                <Copy size={12} />
                Copy
              </Button>
            </div>
            <code className="block bg-background/50 p-3 rounded-lg border border-primary/10 text-center font-mono text-xl tracking-[0.2em] font-bold text-foreground">
              {invitePassword}
            </code>
            <p className="text-[10px] text-muted-foreground text-center italic">
              Share this securely with the user. It will not be shown again.
            </p>
          </div>
        )}

        <form
          className="space-y-4"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            onClearState();
            const form = event.currentTarget;
            const email = (
              form.elements.namedItem('inviteEmail') as HTMLInputElement
            ).value.trim();
            const fullName = (
              form.elements.namedItem('inviteName') as HTMLInputElement
            ).value.trim();
            const role = (
              form.elements.namedItem('inviteRole') as HTMLInputElement
            ).value as Extract<OperatorRole, 'PILOT' | 'TECHNICIAN'>;
            onSubmit({ email, fullName, role });
            form.reset();
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inviteName">Full Name</Label>
              <Input
                id="inviteName"
                name="inviteName"
                placeholder="Jamie Pilot"
                required
                minLength={2}
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Work Email</Label>
              <Input
                id="inviteEmail"
                name="inviteEmail"
                type="email"
                placeholder="jamie@skyops.ai"
                required
                className="glass"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inviteRole">Assigned Role</Label>
            <Select name="inviteRole" required defaultValue="PILOT">
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="glass">
                <SelectItem value="PILOT">Pilot</SelectItem>
                <SelectItem value="TECHNICIAN">Technician</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full gap-2 shadow-md hover:shadow-lg transition-all mt-2"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </span>
            ) : (
              <>
                <Mail size={16} />
                Send Invitation / Create Account
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
