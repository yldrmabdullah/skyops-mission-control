import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../auth/use-auth';
import { FormNotice } from '../components/FormNotice';
import { DashboardAnalyticsCard } from '../features/dashboard/DashboardAnalyticsCard';
import { DashboardFleetStatusAndActivity } from '../features/dashboard/DashboardFleetStatusAndActivity';
import { DashboardMaintenanceAndUpcoming } from '../features/dashboard/DashboardMaintenanceAndUpcoming';
import { DashboardNotificationsCard } from '../features/dashboard/DashboardNotificationsCard';
import { DashboardPageHeader } from '../features/dashboard/DashboardPageHeader';
import {
  selectMaintenanceWatchlistDrones,
  selectRecentMissions,
  selectUpcomingMissions,
} from '../features/dashboard/dashboard-selectors';
import { usePostAuthWelcomeMessage } from '../hooks/use-post-auth-welcome';
import {
  fetchDrones,
  fetchFleetHealthReport,
  fetchInAppNotifications,
  fetchMissions,
  fetchOperationalAnalytics,
  markInAppNotificationRead,
} from '../lib/api';
import { canScheduleMissions } from '../lib/roles';

export function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [referenceNow] = useState(() => Date.now());
  const roleWelcome = usePostAuthWelcomeMessage(user);

  const fleetHealthQuery = useQuery({
    queryKey: ['fleet-health'],
    queryFn: fetchFleetHealthReport,
  });
  const dronesQuery = useQuery({
    queryKey: ['drones', 'dashboard'],
    queryFn: () => fetchDrones(),
  });
  const missionsQuery = useQuery({
    queryKey: ['missions', 'dashboard'],
    queryFn: () => fetchMissions(),
  });
  const analyticsQuery = useQuery({
    queryKey: ['operational-analytics'],
    queryFn: fetchOperationalAnalytics,
  });
  const inAppQuery = useQuery({
    queryKey: ['in-app-notifications'],
    queryFn: () => fetchInAppNotifications(12),
  });
  const markReadMutation = useMutation({
    mutationFn: markInAppNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['in-app-notifications'],
      });
    },
  });

  const fleetHealth = fleetHealthQuery.data;
  const dronesResponse = dronesQuery.data;
  const missionsResponse = missionsQuery.data;
  const drones = dronesResponse?.data ?? [];
  const missions = missionsResponse?.data ?? [];
  const maintenanceAlerts = selectMaintenanceWatchlistDrones(drones);
  const upcomingMissions = selectUpcomingMissions(missions, referenceNow);
  const recentMissions = selectRecentMissions(missions, referenceNow);
  const availableDroneCount = fleetHealth?.statusBreakdown.AVAILABLE ?? 0;

  const partialErrors = [
    fleetHealthQuery.isError ? 'Fleet health report' : null,
    dronesQuery.isError ? 'Drone list' : null,
    missionsQuery.isError ? 'Mission list' : null,
  ].filter(Boolean) as string[];

  return (
    <>
      {roleWelcome ? (
        <div className="section-spaced">
          <FormNotice message={roleWelcome} tone="info" />
        </div>
      ) : null}

      {partialErrors.length ? (
        <div className="section-spaced">
          <FormNotice
            message={`Some dashboard data failed to load: ${partialErrors.join(', ')}. Other sections below may still be useful.`}
            tone="warning"
          />
        </div>
      ) : null}

      <DashboardPageHeader
        availableDroneCount={availableDroneCount}
        fleetHealth={fleetHealth}
        showMissionBoardLink={canScheduleMissions(user?.role)}
      />

      <section className="panel-grid split section-spaced">
        <DashboardAnalyticsCard
          analytics={analyticsQuery.data}
          isError={analyticsQuery.isError}
          isLoading={analyticsQuery.isLoading}
        />
        <DashboardNotificationsCard
          isError={inAppQuery.isError}
          isLoading={inAppQuery.isLoading}
          isMarkReadPending={markReadMutation.isPending}
          rows={inAppQuery.data ?? []}
          onMarkRead={(id) => markReadMutation.mutate(id)}
        />
      </section>

      <DashboardMaintenanceAndUpcoming
        dronesError={dronesQuery.isError}
        maintenanceAlerts={maintenanceAlerts}
        missionsError={missionsQuery.isError}
        referenceNow={referenceNow}
        upcomingMissions={upcomingMissions}
      />

      <DashboardFleetStatusAndActivity
        fleetHealth={fleetHealth}
        fleetHealthError={fleetHealthQuery.isError}
        missionsError={missionsQuery.isError}
        recentMissions={recentMissions}
      />
    </>
  );
}
