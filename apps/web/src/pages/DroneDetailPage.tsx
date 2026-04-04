import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { StatePanel } from '../components/StatePanel';
import { SurfaceCard } from '../components/SurfaceCard';
import { useNotifications } from '../components/use-notifications';
import { DroneDangerZone } from '../features/drones/DroneDangerZone';
import { DroneProfileForm } from '../features/drones/DroneProfileForm';
import { MaintenanceLogForm } from '../features/drones/MaintenanceLogForm';
import {
  DroneSummaryPanel,
  MaintenanceHistoryPanel,
  MissionHistoryPanel,
} from '../features/drones/DronePanels';
import {
  createMaintenanceLog,
  deleteDrone,
  fetchDrone,
  getErrorMessage,
  updateDrone,
} from '../lib/api';
import { StatusPill } from '../components/StatusPill';

export function DroneDetailPage() {
  const { notify } = useNotifications();
  const { droneId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profileFeedback, setProfileFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [maintenanceFeedback, setMaintenanceFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);

  const droneQuery = useQuery({
    queryKey: ['drone', droneId],
    queryFn: () => fetchDrone(droneId),
    enabled: Boolean(droneId),
  });
  const drone = droneQuery.data;
  const isLoading = droneQuery.isLoading;

  async function refreshDroneData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['drone', droneId] }),
      queryClient.invalidateQueries({ queryKey: ['drones'] }),
      queryClient.invalidateQueries({ queryKey: ['fleet-health'] }),
    ]);
  }

  const updateDroneMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateDrone>[1]) =>
      updateDrone(droneId, payload),
    onSuccess: async () => {
      setProfileFeedback({
        tone: 'success',
        message: 'Drone profile updated successfully.',
      });
      notify({
        tone: 'success',
        title: 'Drone updated',
        description: 'The drone profile is now up to date.',
      });
      await refreshDroneData();
    },
    onError: (error) => {
      setProfileFeedback({
        tone: 'error',
        message: getErrorMessage(error),
      });
    },
  });

  const createMaintenanceLogMutation = useMutation({
    mutationFn: createMaintenanceLog,
    onSuccess: async () => {
      setMaintenanceFeedback({
        tone: 'success',
        message: 'Maintenance log added successfully.',
      });
      notify({
        tone: 'success',
        title: 'Maintenance recorded',
        description: 'The maintenance history and due dates were refreshed.',
      });
      await refreshDroneData();
    },
    onError: (error) => {
      setMaintenanceFeedback({
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
      setDeleteFeedback({
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
            feedback={profileFeedback}
            isPending={updateDroneMutation.isPending}
            onSubmit={(payload) => {
              setProfileFeedback(null);
              updateDroneMutation.mutate(payload);
            }}
          />
        </SurfaceCard>

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
            feedback={maintenanceFeedback}
            isPending={createMaintenanceLogMutation.isPending}
            onSubmit={(payload) => {
              setMaintenanceFeedback(null);
              createMaintenanceLogMutation.mutate(payload);
            }}
          />
        </SurfaceCard>
      </section>

      <section className="panel-grid split section-spaced">
        <DroneSummaryPanel drone={drone} />
        <MaintenanceHistoryPanel drone={drone} />
      </section>

      <section className="section-spaced">
        <MissionHistoryPanel drone={drone} />
      </section>

      <section className="section-spaced">
        <DroneDangerZone
          canDelete={canDelete}
          feedback={deleteFeedback}
          isDeleteArmed={isDeleteArmed}
          isPending={deleteDroneMutation.isPending}
          onDelete={() => {
            setDeleteFeedback(null);

            if (!isDeleteArmed) {
              setIsDeleteArmed(true);
              return;
            }

            deleteDroneMutation.mutate();
          }}
        />
      </section>
    </>
  );
}
