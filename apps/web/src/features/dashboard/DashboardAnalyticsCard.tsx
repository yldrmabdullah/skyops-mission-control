import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatEnumLabel } from '../../lib/format';
import type { OperationalAnalytics } from '../../types/api';
import { missionAnalyticsBarScale } from './dashboard-selectors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';

interface DashboardAnalyticsCardProps {
  analytics: OperationalAnalytics | undefined;
  isError: boolean;
  isLoading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: '#3b82f6', // Blue
  PRE_FLIGHT_CHECK: '#f59e0b', // Amber
  IN_PROGRESS: '#8b5cf6', // Violet
  COMPLETED: '#10b981', // Emerald
  ABORTED: '#ef4444', // Rose
};

type StatusBarDatum = { name?: string; value?: number };

function MissionStatusTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: StatusBarDatum }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  const data = payload[0]?.payload;
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground font-bold">
            {data?.name}
          </span>
          <span className="font-bold text-muted-foreground">
            {data?.value} missions
          </span>
        </div>
      </div>
    </div>
  );
}

export function DashboardAnalyticsCard({
  analytics,
  isError,
  isLoading,
}: DashboardAnalyticsCardProps) {
  const { entries: missionAnalyticsEntries } = missionAnalyticsBarScale(
    analytics?.missionStatusBreakdown ?? {},
  );

  const chartData = missionAnalyticsEntries.map(([status, count]) => ({
    name: formatEnumLabel(status),
    value: count,
    status,
  }));

  return (
    <Card className="glass">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Mission Analytics</CardTitle>
        <CardDescription>Mission volume breakdown by lifecycle state.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full mt-4">
          {isError ? (
             <div className="h-full flex items-center justify-center text-rose-500 text-sm font-medium">
               Analytics could not be loaded.
             </div>
          ) : isLoading ? (
             <div className="space-y-4 py-4 h-full flex flex-col justify-center">
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-[90%]" />
               <Skeleton className="h-10 w-[95%]" />
               <Skeleton className="h-10 w-[85%]" />
               <Skeleton className="h-10 w-[92%]" />
             </div>
          ) : chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  type="number"
                />
                <YAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  type="category"
                  width={100}
                />
                <Tooltip
                  content={<MissionStatusTooltip />}
                  cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || 'hsl(var(--primary))'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
              No missions recorded yet.
            </div>
          )}
        </div>

        {analytics && Object.keys(analytics.droneModelBreakdown).length ? (
          <div className="mt-6 pt-4 border-t flex flex-wrap gap-x-4 gap-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-full mb-1">Fleet Models</span>
            {Object.entries(analytics.droneModelBreakdown).map(([model, count]) => (
              <div key={model} className="flex items-center gap-1.5 bg-accent/30 px-2 py-1 rounded-md text-xs">
                <span className="font-semibold">{formatEnumLabel(model)}</span>
                <span className="text-muted-foreground">({count})</span>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
