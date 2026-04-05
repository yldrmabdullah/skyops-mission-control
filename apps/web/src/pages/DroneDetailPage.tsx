import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { StatePanel } from '../components/StatePanel';
import { SurfaceCard } from '../components/SurfaceCard';
import { StatusPill } from '../components/StatusPill';
import { useNotifications } from '../components/use-notifications';
import { DroneDangerZone } from '../features/drones/DroneDangerZone';
import { DroneProfileForm } from '../features/drones/DroneProfileForm';
import { MaintenanceLogForm } from '../features/drones/MaintenanceLogForm';
import {
  DroneSummaryPanel,
  MaintenanceHistoryPanel,
  MissionHistoryPanel,
} from '../features/drones/DronePanels';
import { useFeedbackState } from '../hooks/use-feedback-state';
import {
  createMaintenanceLog,
  deleteDrone,
  fetchDrone,
  getErrorMessage,
  updateDrone,
  uploadMaintenanceAttachment,
} from '../lib/api';
import { invalidateDroneRelatedQueries } from '../lib/query-invalidation';
import { canManageFleet, canRecordMaintenance } from '../lib/roles';

export function DroneDetailPage() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const { droneId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileFeedback = useFeedbackState();
  const maintenanceFeedback = useFeedbackState();
  const deleteFeedback = useFeedbackState();
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);

  const droneQuery = useQuery({
    queryKey: ['drone', droneId],
    queryFn: () => fetchDrone(droneId),
    enabled: Boolean(droneId),
  });
  const drone = droneQuery.data;
  const isLoading = droneQuery.isLoading;

  const updateDroneMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateDrone>[1]) =>
      updateDrone(droneId, payload),
    onSuccess: async () => {
      profileFeedback.setFeedback({
        tone: 'success',
        message: 'Drone profile updated successfully.',
      });
      notify({
        tone: 'success',
        title: 'Drone updated',
        description: 'The drone profile is now up to date.',
      });
      await invalidateDroneRelatedQueries(queryClient, droneId);
    },
    onError: (error) => {
      profileFeedback.setFeedback({
        tone: 'error',
        message: getErrorMessage(error),
      });
    },
  });

  const createMaintenanceLogMutation = useMutation({
    mutationFn: async ({
      payload,
      file,
    }: {
      payload: Parameters<typeof createMaintenanceLog>[0];
      file?: File;
    }) => {
      const log = await createMaintenanceLog(payload);
      if (file) {
        await uploadMaintenanceAttachment(log.id, file);
      }
      return log;
    },
    onSuccess: async () => {
      maintenanceFeedback.setFeedback({
        tone: 'success',
        message: 'Maintenance log added successfully.',
      });
      notify({
        tone: 'success',
        title: 'Maintenance recorded',
        description: 'The maintenance history and due dates were refreshed.',
      });
      await invalidateDroneRelatedQueries(queryClient, droneId);
    },
    onError: (error) => {
      maintenanceFeedback.setFeedback({
        tone: 'error',
        message: getErrorMessage(error),
      });
    },
  });

  const deleteDroneMutation = useMutation({
    mutationFn: () => deleteDrone(droneId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['drones'] }),
        queryClient.invalidateQueries({ queryKey: ['fleet-health'] }),
      ]);
      notify({
        tone: 'success',
        title: 'Drone deleted',
        description: 'The drone has been removed from the registry.',
      });
      void navigate('/drones');
    },
    onError: (error) => {
      deleteFeedback.setFeedback({
        tone: 'error',
        message: getErrorMessage(error),
      });
      setIsDeleteArmed(false);
    },
  });

  if (isLoading) {
    return (
      <StatePanel
        description="The drone profile, mission history, and maintenance logs are loading."
        title="Loading drone detail"
      />
    );
  }

  if (droneQuery.isError) {
    const message = getErrorMessage(droneQuery.error);
    const isNotFound = message.toLowerCase().includes('was not found');

    return (
      <StatePanel
        actionHref="/drones"
        actionLabel="Return to registry"
        description={
          isNotFound
            ? 'The selected drone could not be found. It may have been deleted or the URL may be incorrect.'
            : message
        }
        title={isNotFound ? 'Drone not found' : 'Unable to load drone detail'}
        tone={isNotFound ? 'warning' : 'error'}
      />
    );
  }

  if (!drone) {
    return (
      <StatePanel
        actionHref="/drones"
        actionLabel="Return to registry"
        description="No drone data is available for this route."
        title="Drone unavailable"
        tone="warning"
      />
    );
  }

  const canDelete = !drone.missions?.length && !drone.maintenanceLogs?.length;
  const allowFleetEdits = canManageFleet(user?.role);
  const allowMaintenance = canRecordMaintenance(user?.role);

  return (
    <>
      <header className="page-header">
        <div>
          <div className="badge">Drone Detail</div>
          <h2>{drone.serialNumber}</h2>
          <p>
            Full operational context for one asset: profile updates, maintenance
            registration, and linked mission history in a single view.
          </p>
        </div>
        <div className="stack-inline">
          {drone.maintenanceDue ? (
            <div className="badge accent">Maintenance due</div>
          ) : null}
          <StatusPill value={drone.status} />
        </div>
      </header>

      <section className="panel-grid split">
        {allowFleetEdits ? (
          <SurfaceCard
            actions={
              <span className="muted">
                Keep serial, status, and maintenance data aligned
              </span>
            }
            title="Edit profile"
          >
            <DroneProfileForm
              key={`${drone.id}-${drone.status}-${drone.totalFlightHours}-${drone.lastMaintenanceDate}`}
              drone={drone}
              feedback={profileFeedback.feedback}
              isPending={updateDroneMutation.isPending}
              onSubmit={(payload) => {
                profileFeedback.clearFeedback();
                updateDroneMutation.mutate(payload);
              }}
            />
          </SurfaceCard>
        ) : (
          <SurfaceCard
            title="Profile"
            description="Fleet profile changes are limited to workspace managers."
          >
            <p className="muted">
              You are signed in as <strong>{user?.role}</strong>. View-only
              access to this drone&apos;s registry data.
            </p>
          </SurfaceCard>
        )}

        {allowMaintenance ? (
          <SurfaceCard
            actions={
              <span className="muted">
                Routine checks and repairs update due dates automatically
              </span>
            }
            title="Add maintenance log"
          >
            <MaintenanceLogForm
              key={`${drone.id}-${drone.totalFlightHours}-${drone.maintenanceLogs?.length ?? 0}`}
              droneId={droneId}
              totalFlightHours={drone.totalFlightHours}
              feedback={maintenanceFeedback.feedback}
              isPending={createMaintenanceLogMutation.isPending}
              onSubmit={(payload, options) => {
                maintenanceFeedback.clearFeedback();
                createMaintenanceLogMutation.mutate({
                  payload,
                  file: options?.file,
                });
              }}
            />
          </SurfaceCard>
        ) : (
          <SurfaceCard
            title="Maintenance"
            description="Technicians and managers record maintenance events."
          >
            <p className="muted">
              Your role ({user?.role}) cannot create maintenance logs in this
              workspace.
            </p>
          </SurfaceCard>
        )}
      </section>

      <section className="panel-grid split section-spaced">
        <DroneSummaryPanel drone={drone} />
        <MaintenanceHistoryPanel
          drone={drone}
          emptyHint={
            user?.role === 'PILOT'
              ? 'Detailed maintenance history is visible to Technicians and Managers only.'
              : undefined
          }
        />
      </section>

      <section className="section-spaced">
        <MissionHistoryPanel drone={drone} />
      </section>

      {allowFleetEdits ? (
        <section className="section-spaced">
          <DroneDangerZone
            canDelete={canDelete}
            feedback={deleteFeedback.feedback}
            isDeleteArmed={isDeleteArmed}
            isPending={deleteDroneMutation.isPending}
            onDelete={() => {
              deleteFeedback.clearFeedback();

              if (!isDeleteArmed) {
                setIsDeleteArmed(true);
                return;
              }

              deleteDroneMutation.mutate();
            }}
          />
        </section>
      ) : null}
    </>
  );
}
