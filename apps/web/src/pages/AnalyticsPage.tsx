import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  Activity, 
  BarChart3, 
  PieChart as PieChartIcon, 
  AlertTriangle, 
  Clock, 
  ShieldCheck,
  TrendingUp,
  Wrench
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { fetchFleetHealthReport, fetchOperationalAnalytics } from '../lib/api/reports-requests';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

export function AnalyticsPage() {
  const healthQuery = useQuery({
    queryKey: ['fleet-health'],
    queryFn: fetchFleetHealthReport,
  });

  const opsQuery = useQuery({
    queryKey: ['operational-analytics'],
    queryFn: fetchOperationalAnalytics,
  });

  const isLoading = healthQuery.isLoading || opsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const health = healthQuery.data;
  const ops = opsQuery.data;

  const fleetStatusData = health ? Object.entries(health.statusBreakdown).map(([name, value]) => ({ name, value })) : [];
  const missionStatusData = ops ? Object.entries(ops.missionStatusBreakdown).map(([name, value]) => ({ name, value })) : [];
  const droneModelData = ops ? Object.entries(ops.droneModelBreakdown).map(([name, value]) => ({ name, value })) : [];
  const technicianData = ops ? ops.maintenanceByTechnician.map(t => ({ name: t.technicianName, value: t.count })) : [];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          <TrendingUp size={16} className="text-primary" />
          Operational Intelligence
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Fleet Analytics</h1>
        <p className="text-muted-foreground max-w-3xl text-lg">
          Comprehensive performance metrics, fleet health status, and operational throughput for your drone workspace.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass border-primary/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={48} className="text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Fleet Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{health?.totalDroneCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Active registered assets</p>
          </CardContent>
        </Card>

        <Card className="glass border-primary/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={48} className="text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Avg. Flight Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{health?.averageFlightHoursPerDrone}h</div>
            <p className="text-[10px] text-muted-foreground mt-1">Cumulative airtime per unit</p>
          </CardContent>
        </Card>

        <Card className="glass border-primary/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck size={48} className="text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next 24h Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{health?.missionsInNext24Hours}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Scheduled mission windows</p>
          </CardContent>
        </Card>

        <Card className="glass border-rose-500/20 bg-rose-500/5 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle size={48} className="text-rose-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-rose-500/70">Critical Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600">{health?.overdueMaintenance.length}</div>
            <p className="text-[10px] text-rose-500/60 mt-1">Units requiring immediate service</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Charts Section */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="glass border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Mission Performance</CardTitle>
                <CardDescription>Aggregate status of all logged operations</CardDescription>
              </div>
              <BarChart3 className="text-primary/40" size={24} />
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={missionStatusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted)/0.2)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background)/0.8)', 
                      backdropFilter: 'blur(8px)',
                      border: '1px solid hsl(var(--primary)/0.1)',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Maintenance Throughput</CardTitle>
                <CardDescription>Service logs categorized by lead technician</CardDescription>
              </div>
              <Wrench className="text-primary/40" size={24} />
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={technicianData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted)/0.2)" />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    width={100}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background)/0.8)', 
                      backdropFilter: 'blur(8px)',
                      border: '1px solid hsl(var(--primary)/0.1)',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary)/0.6)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown Section */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="glass border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Fleet Distribution</CardTitle>
                <CardDescription>Drone availability & health</CardDescription>
              </div>
              <PieChartIcon className="text-primary/40" size={24} />
            </CardHeader>
            <CardContent className="h-[300px] flex flex-col justify-center">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={fleetStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {fleetStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg">Model Catalog</CardTitle>
              <CardDescription>Composition of aircraft models</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-4">
                  {droneModelData.map((model, i) => (
                    <div key={model.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm font-medium">{model.name}</span>
                      </div>
                      <Badge variant="secondary" className="glass bg-background/50">{model.value}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
