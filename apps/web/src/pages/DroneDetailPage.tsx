import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DroneDangerZone,
  DroneProfileForm,
  MaintenanceLogForm,
} from '../features/drones/DroneForms';
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

  const { data: drone, isLoading } = useQuery({
    queryKey: ['drone', droneId],
    queryFn: () => fetchDrone(droneId),
    enabled: Boolean(droneId),
  });

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

  if (isLoading || !drone) {
    return <div className="empty-state">Loading drone detail...</div>;
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
        <article className="card">
          <div className="card-header">
            <h3>Edit profile</h3>
            <span className="muted">
              Keep serial, status, and maintenance data aligned
            </span>
          </div>

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
        </article>

        <article className="card">
          <div className="card-header">
            <h3>Add maintenance log</h3>
            <span className="muted">
              Routine checks and repairs update due dates automatically
            </span>
          </div>

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
        </article>
      </section>

      <section className="panel-grid split" style={{ marginTop: '1rem' }}>
        <DroneSummaryPanel drone={drone} />
        <MaintenanceHistoryPanel drone={drone} />
      </section>

      <section style={{ marginTop: '1rem' }}>
        <MissionHistoryPanel drone={drone} />
      </section>

      <section style={{ marginTop: '1rem' }}>
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
