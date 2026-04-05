import { Link } from 'react-router-dom';
import {
  Plane,
  Activity,
  Clock,
  Calendar,
  Settings as SettingsIcon,
  ArrowUpRight,
} from 'lucide-react';
import type { FleetHealthReport } from '../../types/api';
import { DashboardFleetDonut } from './DashboardFleetDonut';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

interface DashboardPageHeaderProps {
  availableDroneCount: number;
  fleetHealth: FleetHealthReport | undefined;
  showMissionBoardLink?: boolean;
}

export function DashboardPageHeader({
  availableDroneCount,
  fleetHealth,
  showMissionBoardLink = true,
}: DashboardPageHeaderProps) {
  return (
    <div className="space-y-8 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <Badge variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5 text-primary">
            Mission Control
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
            Operational awareness for fleet readiness.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            The dashboard surfaces what matters first, from drones approaching maintenance 
            thresholds to missions in the next operational window.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success" className="h-9 px-4 flex items-center gap-2">
            <Plane size={14} className="animate-pulse-subtle" />
            <span>{availableDroneCount} drones ready</span>
          </Badge>
          
          {showMissionBoardLink && (
            <Button asChild variant="outline" size="sm" className="h-9 glass hover:bg-primary/5">
              <Link to="/missions" className="flex items-center gap-2">
                <Calendar size={14} />
                Open mission board
              </Link>
            </Button>
          )}
          
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 glass">
            <Link to="/settings">
              <SettingsIcon size={18} />
            </Link>
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-1 md:col-span-1 lg:col-span-1 overflow-hidden group">
          <CardContent className="p-0 flex items-center h-full">
             <div className="p-4 w-32 shrink-0">
               <DashboardFleetDonut fleetHealth={fleetHealth} />
             </div>
             <div className="p-4 flex flex-col justify-center gap-1 border-l h-full w-full bg-accent/10">
               <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Fleet Health</span>
               <div className="text-2xl font-bold">{fleetHealth?.totalDroneCount ?? 0} Assets</div>
               <div className="text-xs text-muted-foreground">
                 <span className="text-emerald-500 font-medium">{availableDroneCount}</span> Active / Ready
               </div>
             </div>
          </CardContent>
        </Card>

        <StatCard 
          icon={<Plane size={24} className="text-blue-500" />} 
          label="Ready for dispatch" 
          value={availableDroneCount || '-'} 
          subValue="Fleet readiness"
        />
        <StatCard 
          icon={<Activity size={24} className="text-indigo-500" />} 
          label="Missions next 24h" 
          value={fleetHealth?.missionsInNext24Hours ?? '-'} 
          subValue="Active work pipeline"
        />
        <StatCard 
          icon={<Clock size={24} className="text-violet-500" />} 
          label="Avg flight hours" 
          value={fleetHealth?.averageFlightHoursPerDrone ?? '-'} 
          subValue="Fleet mileage"
        />
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string | number, subValue: string }) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-xl bg-accent/50 group-hover:bg-accent transition-colors">
            {icon}
          </div>
          <ArrowUpRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </div>
        <div className="mt-4 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tabular-nums">{value}</h3>
          </div>
          <p className="text-[10px] text-muted-foreground">{subValue}</p>
        </div>
      </CardContent>
    </Card>
  )
}
