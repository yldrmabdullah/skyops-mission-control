import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { PriorityPill } from '../../components/PriorityPill';
import { StatusPill } from '../../components/StatusPill';
import { formatEnumLabel } from '../../lib/format';
import type { Drone, Mission } from '../../types/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { AlertTriangle, Calendar, ExternalLink } from 'lucide-react';

interface DashboardMaintenanceAndUpcomingProps {
  maintenanceAlerts: Drone[];
  dronesError: boolean;
  referenceNow: number;
  upcomingMissions: Mission[];
  missionsError: boolean;
}

export function DashboardMaintenanceAndUpcoming({
  maintenanceAlerts,
  dronesError,
  referenceNow,
  upcomingMissions,
  missionsError,
}: DashboardMaintenanceAndUpcomingProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card className="glass border-primary/10 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-primary/5 bg-primary/5">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500 animate-pulse-subtle" />
              Maintenance Watchlist
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
              Urgent fleet service requirements
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-primary">
            <Link to="/drones">
              Review Fleet
              <ExternalLink size={10} />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden bg-card/30">
          <div className="divide-y divide-border/30">
            {dronesError ? (
               <div className="p-8 text-center text-rose-500 text-sm font-semibold italic">
                 Maintenance data synchronization failed.
               </div>
            ) : maintenanceAlerts.length ? (
              maintenanceAlerts.map((drone) => {
                const overdue =
                  new Date(drone.nextMaintenanceDueDate).getTime() <=
                  referenceNow;

                return (
                  <div className="flex items-center justify-between p-4 bg-transparent hover:bg-accent/30 transition-all group" key={drone.id}>
                    <div className="space-y-1">
                      <div className="text-sm font-bold group-hover:text-primary transition-colors">
                        <Link to={`/drones/${drone.id}`}>
                          {drone.serialNumber}
                        </Link>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                        <span>{formatEnumLabel(drone.model)}</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>Due {format(new Date(drone.nextMaintenanceDueDate), 'dd MMM yyyy')}</span>
                      </div>
                    </div>
                    <PriorityPill
                      label={overdue ? 'Overdue' : 'Due soon'}
                      tone={overdue ? 'danger' : 'warning'}
                    />
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-muted-foreground italic text-sm">
                No maintenance risk in the next 7 days.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-primary/10 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-primary/5 bg-primary/5">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar size={18} className="text-indigo-500" />
              Upcoming Missions
            </CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
              Next flights on schedule
            </CardDescription>
          </div>
          <Badge variant="outline" className="h-6 font-mono text-[10px] bg-background/50 border-transparent text-muted-foreground/70">
            {upcomingMissions.length}
          </Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden bg-card/30">
          <div className="divide-y divide-border/30">
            {missionsError ? (
               <div className="p-8 text-center text-rose-500 text-sm font-semibold italic">
                 Mission schedule synchronization failed.
               </div>
            ) : upcomingMissions.length ? (
              upcomingMissions.map((mission) => (
                <div className="flex items-center justify-between p-4 bg-transparent hover:bg-accent/30 transition-all group" key={mission.id}>
                  <div className="space-y-1">
                    <div className="text-sm font-bold group-hover:text-primary transition-colors">
                      <Link to={`/missions/${mission.id}`}>
                        {mission.name}
                      </Link>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                      <span>{mission.siteLocation}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{format(new Date(mission.plannedStart), 'dd MMM · HH:mm')}</span>
                    </div>
                  </div>
                  <StatusPill value={mission.status} className="h-5 text-[9px] font-bold" />
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground italic text-sm">
                No upcoming missions found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
