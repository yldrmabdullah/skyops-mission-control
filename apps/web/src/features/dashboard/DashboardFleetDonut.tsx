import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { FleetHealthReport } from '../../types/api';

interface DashboardFleetDonutProps {
  fleetHealth: FleetHealthReport | undefined;
}

const COLORS: Record<string, string> = {
  AVAILABLE: 'var(--success)',
  IN_MISSION: 'var(--accent)',
  MAINTENANCE: 'var(--warning)',
  RETIRED: 'var(--danger)',
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
    <div style={{ height: '140px', width: '140px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={60}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.status] || '#8884d8'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-strong)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
