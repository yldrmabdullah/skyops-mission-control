import { format } from 'date-fns';
import { StatusPill } from '../../components/StatusPill';
import { formatEnumLabel } from '../../lib/format';
import type { FleetHealthReport, Mission } from '../../types/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LayoutGrid, Activity, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';

interface DashboardFleetStatusAndActivityProps {
  fleetHealth: FleetHealthReport | undefined;
  fleetHealthError: boolean;
  recentMissions: Mission[];
  missionsError: boolean;
}

export function DashboardFleetStatusAndActivity({
  fleetHealth,
  fleetHealthError,
  recentMissions,
  missionsError,
}: DashboardFleetStatusAndActivityProps) {
  const statusEntries = Object.entries(fleetHealth?.statusBreakdown ?? {});

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card className="glass border-primary/10 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-primary/5 bg-primary/5">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <LayoutGrid size={18} className="text-blue-500" />
              Status Distribution
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
              Current fleet posture overview
            </CardDescription>
          </div>
          <Badge variant="outline" className="h-6 font-mono text-[10px] bg-background/50 border-transparent text-muted-foreground/70">
            {statusEntries.length} sectors
          </Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden bg-card/30">
          <div className="divide-y divide-border/30">
            {fleetHealthError ? (
               <div className="p-8 text-center text-rose-500 text-sm font-semibold italic">
                 Fleet health assessment failed.
               </div>
            ) : statusEntries.length ? (
              statusEntries.map(([status, count]) => (
                <div className="flex items-center justify-between p-4 bg-transparent hover:bg-accent/30 transition-all group" key={status}>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse-subtle" />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {formatEnumLabel(status)}
                    </span>
                  </div>
                  <strong className="text-sm font-bold tabular-nums">
                    {count} Assets
                  </strong>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground italic text-sm">
                No fleet status data available.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-primary/10 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-primary/5 bg-primary/5">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity size={18} className="text-emerald-500" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
              Latest mission completions & schedules
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-primary">
            <Link to="/missions">
              Full Log
              <ExternalLink size={10} />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden bg-card/30">
          <div className="divide-y divide-border/30">
            {missionsError ? (
               <div className="p-8 text-center text-rose-500 text-sm font-semibold italic">
                 Activity log synchronization failed.
               </div>
            ) : recentMissions.length ? (
              recentMissions.map((mission) => (
                <div className="flex items-center justify-between p-4 bg-transparent hover:bg-accent/30 transition-all group" key={mission.id}>
                  <div className="space-y-1">
                    <div className="text-sm font-bold group-hover:text-primary transition-colors">
                      <Link to={`/missions/${mission.id}`}>
                         {mission.name}
                      </Link>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                      <span>{formatEnumLabel(mission.type)}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{format(new Date(mission.actualEnd ?? mission.plannedStart), 'dd MMM · HH:mm')}</span>
                    </div>
                  </div>
                  <StatusPill value={mission.status} className="h-5 text-[9px] font-bold" />
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground italic text-sm">
                Activity log is currently empty.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
