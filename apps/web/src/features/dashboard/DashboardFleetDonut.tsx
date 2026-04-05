import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { FleetHealthReport } from '../../types/api';

interface DashboardFleetDonutProps {
  fleetHealth: FleetHealthReport | undefined;
}

const COLORS: Record<string, string> = {
  AVAILABLE: '#10b981', // Emerald 500
  IN_MISSION: '#3b82f6', // Blue 500
  MAINTENANCE: '#f59e0b', // Amber 500
  RETIRED: '#ef4444', // Rose 500
};

export function DashboardFleetDonut({ fleetHealth }: DashboardFleetDonutProps) {
  if (!fleetHealth) return null;

  const data = Object.entries(fleetHealth.statusBreakdown)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
      status: name,
    }));

  return (
    <div className="h-full w-full aspect-square relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="95%"
            paddingAngle={4}
            dataKey="value"
            stroke="none"
            isAnimationActive={true}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.status] || '#8884d8'}
                className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
              />
            ))}
          </Pie>
          <Tooltip
            cursor={false}
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              fontSize: '12px',
              padding: '8px 12px',
              boxShadow: '0 4px 12px -2px rgba(0,0,0,0.1)',
            }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
