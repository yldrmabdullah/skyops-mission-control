import { type UseQueryResult } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Users, AlertCircle, ShieldCheck } from 'lucide-react';
import { formatEnumLabel } from '../../lib/format';
import { getErrorMessage } from '../../lib/api';
import type { WorkspaceMember } from '../../types/api';
import { firstPasswordSetupLabel } from './first-password-setup-label';
import { ScrollArea } from '../../components/ui/scroll-area';

interface WorkspaceMembersCardProps {
  membersQuery: UseQueryResult<WorkspaceMember[]>;
  canManageTeam: boolean;
}

export function WorkspaceMembersCard({
  membersQuery,
  canManageTeam,
}: WorkspaceMembersCardProps) {
  const isError = membersQuery.isError;
  const isLoading = membersQuery.isPending;
  const members = membersQuery.data ?? [];

  return (
    <Card className="glass border-primary/10 overflow-hidden col-span-full">
      <CardHeader className="bg-muted/30 border-b">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Users size={18} />
          <CardTitle className="text-xl">Team Members</CardTitle>
        </div>
        <CardDescription>
          A directory of everyone in this workspace, including their roles and synchronization status.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isError && (
          <div className="p-6">
            <Alert variant="destructive" className="glass bg-destructive/10 border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {getErrorMessage(membersQuery.error) || 'Could not load team members.'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <ScrollArea className="w-full">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                {canManageTeam && (
                  <TableHead className="text-right">Access Status</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-[100px]" /></TableCell>
                    {canManageTeam && <TableCell className="text-right"><Skeleton className="h-10 w-[150px] ml-auto" /></TableCell>}
                  </TableRow>
                ))
              ) : members.length === 0 && !isError ? (
                <TableRow>
                  <TableCell colSpan={canManageTeam ? 3 : 2} className="h-32 text-center text-muted-foreground">
                    No members found in this workspace.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((m) => {
                  const firstPw = canManageTeam ? firstPasswordSetupLabel(m) : null;
                  return (
                    <TableRow key={m.id} className="hover:bg-primary/5 transition-colors group">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">{m.fullName}</span>
                          <span className="text-xs text-muted-foreground">{m.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize font-medium border-primary/20 bg-primary/5 text-primary">
                          {formatEnumLabel(m.role)}
                        </Badge>
                      </TableCell>
                      {canManageTeam && (
                        <TableCell className="text-right">
                          {firstPw ? (
                            <div className="flex flex-col items-end gap-1" title={firstPw.title}>
                              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold glass">
                                {firstPw.label}
                              </Badge>
                              <span className="text-[9px] text-muted-foreground">{firstPw.title}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
                              <ShieldCheck size={12} />
                              Verified
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
