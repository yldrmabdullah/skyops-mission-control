import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { FormNotice } from '../components/FormNotice';
import { StatusPill } from '../components/StatusPill';
import {
  createMaintenanceLog,
  deleteDrone,
  fetchDrone,
  getErrorMessage,
  updateDrone,
} from '../lib/api';
import { formatEnumLabel, toDateInputValue } from '../lib/format';
import type {
  CreateMaintenanceLogPayload,
  Drone,
  DroneModel,
  DroneStatus,
  MaintenanceType,
  UpdateDronePayload,
} from '../types/api';

const droneModels: DroneModel[] = [
  'PHANTOM_4',
  'MATRICE_300',
  'MAVIC_3_ENTERPRISE',
];

const editableStatuses: DroneStatus[] = ['AVAILABLE', 'MAINTENANCE', 'RETIRED'];

const maintenanceTypes: MaintenanceType[] = [
  'ROUTINE_CHECK',
  'BATTERY_REPLACEMENT',
  'MOTOR_REPAIR',
  'FIRMWARE_UPDATE',
  'FULL_OVERHAUL',
];

interface DroneProfileFormProps {
  drone: Drone;
  feedback: { tone: 'success' | 'error'; message: string } | null;
  isPending: boolean;
  onSubmit: (payload: UpdateDronePayload) => void;
}

function DroneProfileForm({
  drone,
  feedback,
  isPending,
  onSubmit,
}: DroneProfileFormProps) {
  const [formState, setFormState] = useState(() => ({
    serialNumber: drone.serialNumber,
    model: drone.model,
    status: drone.status,
    totalFlightHours: String(drone.totalFlightHours),
    flightHoursAtLastMaintenance: String(
      drone.flightHoursAtLastMaintenance ?? drone.totalFlightHours,
    ),
    lastMaintenanceDate: toDateInputValue(drone.lastMaintenanceDate),
  }));

  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();

        onSubmit({
          serialNumber: formState.serialNumber.trim().toUpperCase(),
          model: formState.model,
          status: formState.status,
          totalFlightHours: Number(formState.totalFlightHours),
          flightHoursAtLastMaintenance: Number(
            formState.flightHoursAtLastMaintenance,
          ),
          lastMaintenanceDate: new Date(
            `${formState.lastMaintenanceDate}T00:00:00`,
          ).toISOString(),
        });
      }}
    >
      <label className="field">
        <span className="field-label">Serial number</span>
        <input
          required
          className="input"
          value={formState.serialNumber}
          onChange={(event) =>
            setFormState((currentState) => ({
              ...currentState,
              serialNumber: event.target.value,
            }))
          }
        />
      </label>

      <div className="form-row">
        <label className="field">
          <span className="field-label">Model</span>
          <select
            className="select"
            value={formState.model}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                model: event.target.value as DroneModel,
              }))
            }
          >
            {droneModels.map((model) => (
              <option key={model} value={model}>
                {formatEnumLabel(model)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Status</span>
          <select
            className="select"
            value={formState.status}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                status: event.target.value as DroneStatus,
              }))
            }
          >
            {editableStatuses.map((status) => (
              <option key={status} value={status}>
                {formatEnumLabel(status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field-label">Total flight hours</span>
          <input
            className="input"
            min="0"
            step="0.1"
            type="number"
            value={formState.totalFlightHours}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                totalFlightHours: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span className="field-label">Hours at last maintenance</span>
          <input
            className="input"
            min="0"
            step="0.1"
            type="number"
            value={formState.flightHoursAtLastMaintenance}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                flightHoursAtLastMaintenance: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">Last maintenance date</span>
        <input
          className="input"
          type="date"
          value={formState.lastMaintenanceDate}
          onChange={(event) =>
            setFormState((currentState) => ({
              ...currentState,
              lastMaintenanceDate: event.target.value,
            }))
          }
        />
      </label>

      {feedback ? (
        <FormNotice tone={feedback.tone} message={feedback.message} />
      ) : null}

      <div className="form-actions">
        <button
          className="button"
          data-testid="update-drone-submit"
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Saving...' : 'Update drone'}
        </button>
      </div>
    </form>
  );
}

interface MaintenanceLogFormProps {
  droneId: string;
  totalFlightHours: number;
  feedback: { tone: 'success' | 'error'; message: string } | null;
  isPending: boolean;
  onSubmit: (payload: CreateMaintenanceLogPayload) => void;
}

function MaintenanceLogForm({
  droneId,
  totalFlightHours,
  feedback,
  isPending,
  onSubmit,
}: MaintenanceLogFormProps) {
  const [formState, setFormState] = useState(() => ({
    type: 'ROUTINE_CHECK' as MaintenanceType,
    technicianName: '',
    notes: '',
    performedAt: new Date().toISOString().slice(0, 10),
    flightHoursAtMaintenance: String(totalFlightHours),
  }));

  return (
    <form
      className="form-grid"
      data-testid="create-maintenance-form"
      onSubmit={(event) => {
        event.preventDefault();

        onSubmit({
          droneId,
          type: formState.type,
          technicianName: formState.technicianName.trim(),
          notes: formState.notes.trim() || undefined,
          performedAt: new Date(
            `${formState.performedAt}T00:00:00`,
          ).toISOString(),
          flightHoursAtMaintenance: Number(formState.flightHoursAtMaintenance),
        });
      }}
    >
      <div className="form-row">
        <label className="field">
          <span className="field-label">Maintenance type</span>
          <select
            className="select"
            value={formState.type}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                type: event.target.value as MaintenanceType,
              }))
            }
          >
            {maintenanceTypes.map((type) => (
              <option key={type} value={type}>
                {formatEnumLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Technician</span>
          <input
            required
            className="input"
            value={formState.technicianName}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                technicianName: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field-label">Performed at</span>
          <input
            required
            className="input"
            type="date"
            value={formState.performedAt}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                performedAt: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span className="field-label">Flight hours at maintenance</span>
          <input
            required
            className="input"
            min="0"
            step="0.1"
            type="number"
            value={formState.flightHoursAtMaintenance}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                flightHoursAtMaintenance: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">Notes</span>
        <textarea
          className="input textarea"
          rows={4}
          value={formState.notes}
          onChange={(event) =>
            setFormState((currentState) => ({
              ...currentState,
              notes: event.target.value,
            }))
          }
        />
      </label>

      {feedback ? (
        <FormNotice tone={feedback.tone} message={feedback.message} />
      ) : null}

      <div className="form-actions">
        <button
          className="button secondary"
          data-testid="create-maintenance-submit"
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Saving...' : 'Add maintenance log'}
        </button>
      </div>
    </form>
  );
}

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

  const { data, isLoading } = useQuery({
    queryKey: ['drone', droneId],
    queryFn: () => fetchDrone(droneId),
    enabled: Boolean(droneId),
  });

  const updateDroneMutation = useMutation({
    mutationFn: (payload: UpdateDronePayload) => updateDrone(droneId, payload),
    onSuccess: async () => {
      setProfileFeedback({
        tone: 'success',
        message: 'Drone profile updated successfully.',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['drone', droneId] }),
        queryClient.invalidateQueries({ queryKey: ['drones'] }),
        queryClient.invalidateQueries({ queryKey: ['fleet-health'] }),
      ]);
    },
    onError: (error) => {
      setProfileFeedback({
        tone: 'error',
        message: getErrorMessage(error),
      });
    },
  });

  const createMaintenanceLogMutation = useMutation({
    mutationFn: (payload: CreateMaintenanceLogPayload) =>
      createMaintenanceLog(payload),
    onSuccess: async () => {
      setMaintenanceFeedback({
        tone: 'success',
        message: 'Maintenance log added successfully.',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['drone', droneId] }),
        queryClient.invalidateQueries({ queryKey: ['drones'] }),
        queryClient.invalidateQueries({ queryKey: ['fleet-health'] }),
      ]);
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

  if (isLoading || !data) {
    return <div className="empty-state">Loading drone detail...</div>;
  }

  const hasOperationalHistory =
    Boolean(data.missions?.length) || Boolean(data.maintenanceLogs?.length);

  return (
    <>
      <header className="page-header">
        <div>
          <div className="badge">Drone Detail</div>
          <h2>{data.serialNumber}</h2>
          <p>
            Full operational context for one asset: profile updates, maintenance
            registration, and linked mission history in a single view.
          </p>
        </div>
        <div className="stack-inline">
          {data.maintenanceDue ? (
            <div className="badge accent">Maintenance due</div>
          ) : null}
          <StatusPill value={data.status} />
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
            key={`${data.id}-${data.status}-${data.totalFlightHours}-${data.lastMaintenanceDate}`}
            drone={data}
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
            key={`${data.id}-${data.totalFlightHours}-${data.maintenanceLogs?.length ?? 0}`}
            droneId={droneId}
            totalFlightHours={data.totalFlightHours}
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
        <article className="card">
          <h3>Profile summary</h3>
          <div className="list" style={{ marginTop: '1rem' }}>
            <div className="list-row">
              <span>Model</span>
              <strong>{formatEnumLabel(data.model)}</strong>
            </div>
            <div className="list-row">
              <span>Total flight hours</span>
              <strong>{data.totalFlightHours.toFixed(1)}h</strong>
            </div>
            <div className="list-row">
              <span>Last maintenance</span>
              <strong>
                {format(new Date(data.lastMaintenanceDate), 'dd MMM yyyy')}
              </strong>
            </div>
            <div className="list-row">
              <span>Next maintenance due</span>
              <strong>
                {format(new Date(data.nextMaintenanceDueDate), 'dd MMM yyyy')}
              </strong>
            </div>
          </div>
        </article>

        <article className="card">
          <h3>Maintenance history</h3>
          <div className="list" style={{ marginTop: '1rem' }}>
            {data.maintenanceLogs?.length ? (
              data.maintenanceLogs.map((log) => (
                <div className="list-row" key={log.id}>
                  <div>
                    <div className="list-row-title">
                      {formatEnumLabel(log.type)}
                    </div>
                    <div className="muted">
                      {log.technicianName} ·{' '}
                      {format(new Date(log.performedAt), 'dd MMM yyyy')}
                    </div>
                  </div>
                  <strong>{log.flightHoursAtMaintenance.toFixed(1)}h</strong>
                </div>
              ))
            ) : (
              <div className="empty-state">
                No maintenance logs recorded yet.
              </div>
            )}
          </div>
        </article>
      </section>

      <section style={{ marginTop: '1rem' }}>
        <article className="card">
          <h3>Mission history</h3>
          <div className="list" style={{ marginTop: '1rem' }}>
            {data.missions?.length ? (
              data.missions.map((mission) => (
                <div className="list-row" key={mission.id}>
                  <div>
                    <div className="list-row-title">{mission.name}</div>
                    <div className="muted">
                      {mission.siteLocation} ·{' '}
                      {format(
                        new Date(mission.plannedStart),
                        'dd MMM yyyy HH:mm',
                      )}
                    </div>
                  </div>
                  <StatusPill value={mission.status} />
                </div>
              ))
            ) : (
              <div className="empty-state">
                No mission history available yet.
              </div>
            )}
          </div>
        </article>
      </section>

      <section style={{ marginTop: '1rem' }}>
        <article className="card danger-zone">
          <div className="card-header">
            <div>
              <h3>Danger zone</h3>
              <p className="card-subtitle">
                Full CRUD support is available for drones with no mission or
                maintenance history.
              </p>
            </div>
          </div>

          {hasOperationalHistory ? (
            <div className="empty-state">
              This drone cannot be deleted because operational history must stay
              auditable.
            </div>
          ) : (
            <div className="form-grid">
              <div className="muted">
                Delete is permanently disabled once the asset participates in a
                mission or receives a maintenance log.
              </div>

              {deleteFeedback ? (
                <FormNotice
                  tone={deleteFeedback.tone}
                  message={deleteFeedback.message}
                />
              ) : null}

              <div className="form-actions">
                <button
                  className="button danger"
                  disabled={deleteDroneMutation.isPending}
                  type="button"
                  onClick={() => {
                    setDeleteFeedback(null);

                    if (!isDeleteArmed) {
                      setIsDeleteArmed(true);
                      return;
                    }

                    deleteDroneMutation.mutate();
                  }}
                >
                  {deleteDroneMutation.isPending
                    ? 'Deleting...'
                    : isDeleteArmed
                      ? 'Confirm delete drone'
                      : 'Delete drone'}
                </button>
              </div>
            </div>
          )}
        </article>
      </section>
    </>
  );
}
