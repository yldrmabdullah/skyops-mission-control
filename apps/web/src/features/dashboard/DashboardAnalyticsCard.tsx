import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { EmptyState, SurfaceCard } from '../../components/SurfaceCard';
import { formatEnumLabel } from '../../lib/format';
import type { OperationalAnalytics } from '../../types/api';
import { missionAnalyticsBarScale } from './dashboard-selectors';

interface DashboardAnalyticsCardProps {
  analytics: OperationalAnalytics | undefined;
  isError: boolean;
  isLoading: boolean;
}

/** Hex values so SVG <rect fill> always resolves (matches :root tokens). */
const STATUS_COLORS: Record<string, string> = {
  PLANNED: '#8ec8ff',
  PRE_FLIGHT_CHECK: '#ffcf5c',
  IN_PROGRESS: '#d2ff72',
  COMPLETED: '#8ff2b4',
  ABORTED: '#ff7561',
};

type MissionTooltipPayload = {
  name: string;
  value: number;
  status: string;
};

function MissionStatusTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: MissionTooltipPayload }[];
}) {
  if (!active || !payload?.length) {
    return null;
  }
  const row = payload[0].payload;
  return (
    <div className="mission-analytics-tooltip">
      <div className="mission-analytics-tooltip-title">{row.name}</div>
      <div className="mission-analytics-tooltip-value">
        {row.value} mission{row.value === 1 ? '' : 's'}
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
    <SurfaceCard
      actions={
        <span className="badge">
          {isLoading
            ? 'Loading…'
            : `${missionAnalyticsEntries.length} statuses`}
        </span>
      }
      description="Mission volume breakdown by lifecycle state."
      title="Mission Analytics"
    >
      <div className="mission-analytics-chart-wrap">
        {isError ? (
          <EmptyState>Analytics could not be loaded.</EmptyState>
        ) : isLoading ? (
          <EmptyState>Pulling aggregate mission metrics…</EmptyState>
        ) : chartData.length ? (
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 28, left: 8, bottom: 8 }}
            >
              <XAxis
                axisLine={false}
                tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                tickLine={false}
                type="number"
              />
              <YAxis
                dataKey="name"
                tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
                tickLine={false}
                type="category"
                width={118}
              />
              <Tooltip
                content={<MissionStatusTooltip />}
                cursor={{
                  fill: 'rgba(210, 255, 114, 0.06)',
                  stroke: 'rgba(214, 226, 206, 0.12)',
                  strokeWidth: 1,
                }}
              />
              <Bar
                barSize={18}
                dataKey="value"
                fill="#d2ff72"
                radius={[0, 6, 6, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    fill={
                      STATUS_COLORS[entry.status] ?? STATUS_COLORS.IN_PROGRESS
                    }
                    key={`cell-${index}`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState>No missions recorded yet.</EmptyState>
        )}
      </div>

      {analytics && Object.keys(analytics.droneModelBreakdown).length ? (
        <div
          className="muted"
          style={{ marginTop: '1.5rem', fontSize: '0.8rem' }}
        >
          <strong>Fleet Models:</strong>{' '}
          {Object.entries(analytics.droneModelBreakdown)
            .map(([model, count]) => `${formatEnumLabel(model)} (${count})`)
            .join(' · ')}
        </div>
      ) : null}
    </SurfaceCard>
  );
}
