import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/use-auth';
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
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

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
    { label: 'Fleet health report', isError: fleetHealthQuery.isError },
    { label: 'Drone list', isError: dronesQuery.isError },
    { label: 'Mission list', isError: missionsQuery.isError },
  ].filter(e => e.isError).map(e => e.label);

  useEffect(() => {
    if (roleWelcome) {
      toast.info(roleWelcome, {
        duration: 5000,
        id: 'role-welcome',
      });
    }
  }, [roleWelcome]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl space-y-8"
    >
      <AnimatePresence>
        {partialErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert variant="destructive" className="glass border-rose-500/50 bg-rose-500/5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Data Sync Warning</AlertTitle>
              <AlertDescription>
                Some dashboard data failed to load: {partialErrors.join(', ')}. 
                Live updates might be delayed.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <DashboardPageHeader
          availableDroneCount={availableDroneCount}
          fleetHealth={fleetHealth}
          showMissionBoardLink={canScheduleMissions(user?.role)}
        />
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <motion.div variants={itemVariants}>
            <DashboardAnalyticsCard
              analytics={analyticsQuery.data}
              isError={analyticsQuery.isError}
              isLoading={analyticsQuery.isLoading}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <DashboardMaintenanceAndUpcoming
              dronesError={dronesQuery.isError}
              maintenanceAlerts={maintenanceAlerts}
              missionsError={missionsQuery.isError}
              referenceNow={referenceNow}
              upcomingMissions={upcomingMissions}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <DashboardFleetStatusAndActivity
              fleetHealth={fleetHealth}
              fleetHealthError={fleetHealthQuery.isError}
              missionsError={missionsQuery.isError}
              recentMissions={recentMissions}
            />
          </motion.div>
        </div>

        <div className="xl:col-span-1">
          <motion.div variants={itemVariants} className="xl:sticky xl:top-24">
            <DashboardNotificationsCard
              isError={inAppQuery.isError}
              isLoading={inAppQuery.isLoading}
              isMarkReadPending={markReadMutation.isPending}
              rows={inAppQuery.data ?? []}
              onMarkRead={(id) => markReadMutation.mutate(id)}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
