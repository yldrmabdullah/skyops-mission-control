import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import type { InAppNotificationRow } from '../../types/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Bell, ChevronDown, ChevronUp, BellOff, Check } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';

interface DashboardNotificationsCardProps {
  isError: boolean;
  isLoading: boolean;
  isMarkReadPending: boolean;
  onMarkRead: (id: string) => void;
  rows: InAppNotificationRow[];
}

export function DashboardNotificationsCard({
  isError,
  isLoading,
  isMarkReadPending,
  onMarkRead,
  rows,
}: DashboardNotificationsCardProps) {
  const [newestFirst, setNewestFirst] = useState(true);
  const unreadCount = rows.filter((row) => !row.readAt).length;

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const diff =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return newestFirst ? diff : -diff;
    });
    return copy;
  }, [rows, newestFirst]);

  return (
    <Card className="glass flex flex-col h-[500px] border-primary/10">
      <CardHeader className="pb-4 border-b border-primary/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Bell size={20} className="text-primary" />
              Notifications
            </CardTitle>
            <CardDescription className="text-[11px]">
              Recent schedule conflicts and fleet signals.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
             <Button 
               variant="ghost" 
               size="sm" 
               className="h-8 px-2 text-[10px] uppercase font-bold tracking-wider gap-1"
               onClick={() => setNewestFirst(!newestFirst)}
             >
               {newestFirst ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
               {newestFirst ? 'Newest' : 'Oldest'}
             </Button>
             <Badge variant={unreadCount > 0 ? "error" : "secondary"} className="h-6 font-mono text-[10px]">
               {unreadCount}
             </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="divide-y divide-border/50">
            {isError ? (
               <div className="p-8 text-center text-rose-500 text-sm font-medium">
                 Notifications could not be loaded.
               </div>
            ) : isLoading ? (
               Array.from({ length: 6 }).map((_, i) => (
                 <div key={i} className="p-4 space-y-3">
                   <div className="flex justify-between">
                     <Skeleton className="h-3 w-24" />
                     <Skeleton className="h-3 w-12" />
                   </div>
                   <Skeleton className="h-4 w-3/4" />
                   <Skeleton className="h-3 w-full" />
                 </div>
               ))
            ) : sortedRows.length ? (
              sortedRows.map((row) => {
                const isUnread = !row.readAt;
                return (
                  <div 
                    key={row.id} 
                    className={`p-4 transition-colors group relative ${isUnread ? 'bg-primary/5' : 'hover:bg-accent/50'}`}
                  >
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}
                    <div className="space-y-1 text-left">
                      <div className="flex items-center justify-between mb-1">
                         <time className="text-[10px] font-medium text-muted-foreground">
                           {format(new Date(row.createdAt), 'dd MMM · HH:mm')}
                         </time>
                         {!isUnread ? (
                            <Badge variant="outline" className="text-[9px] h-4 bg-background/50 border-transparent text-muted-foreground/50">Read</Badge>
                         ) : (
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-6 px-2 text-[10px] font-bold uppercase tracking-wider text-primary gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                             disabled={isMarkReadPending}
                             onClick={() => onMarkRead(row.id)}
                           >
                             <Check size={10} /> Mark read
                           </Button>
                         )}
                      </div>
                      <h4 className={`text-sm font-bold leading-tight ${isUnread ? 'text-foreground' : 'text-muted-foreground/70'}`}>
                        {row.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {row.body}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <BellOff size={32} className="opacity-20" />
                <p className="text-sm italic">No notifications yet.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
