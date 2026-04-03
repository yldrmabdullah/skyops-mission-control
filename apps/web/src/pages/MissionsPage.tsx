import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FormNotice } from '../components/FormNotice';
import { StatusPill } from '../components/StatusPill';
import {
  createMission,
  fetchDrones,
  fetchMissions,
  getErrorMessage,
  transitionMission,
  updateMission,
} from '../lib/api';
import { formatEnumLabel } from '../lib/format';
import type {
  CreateMissionPayload,
  Drone,
  Mission,
  MissionStatus,
  MissionType,
  TransitionMissionPayload,
} from '../types/api';

const missionTypes: MissionType[] = [
  'WIND_TURBINE_INSPECTION',
  'SOLAR_PANEL_SURVEY',
  'POWER_LINE_PATROL',
];

const missionStatuses: MissionStatus[] = [
  'PLANNED',
  'PRE_FLIGHT_CHECK',
  'IN_PROGRESS',
  'COMPLETED',
  'ABORTED',
];

function getInitialMissionDates() {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  const end = new Date(Date.now() + 2 * 60 * 60 * 1000);

  return {
    plannedStart: new Date(start.getTime() - start.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16),
    plannedEnd: new Date(end.getTime() - end.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16),
  };
}

function createMissionFormState() {
  const initialDates = getInitialMissionDates();

  return {
    name: '',
    type: 'WIND_TURBINE_INSPECTION' as MissionType,
    droneId: '',
    pilotName: '',
    siteLocation: '',
    plannedStart: initialDates.plannedStart,
    plannedEnd: initialDates.plannedEnd,
  };
}

function getAllowedTransitions(status: MissionStatus): MissionStatus[] {
  switch (status) {
    case 'PLANNED':
      return ['PRE_FLIGHT_CHECK', 'ABORTED'];
    case 'PRE_FLIGHT_CHECK':
      return ['IN_PROGRESS', 'ABORTED'];
    case 'IN_PROGRESS':
      return ['COMPLETED', 'ABORTED'];
    default:
      return [];
  }
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function createMissionEditForm(mission: Mission) {
  return {
    name: mission.name,
    type: mission.type,
    droneId: mission.droneId,
    pilotName: mission.pilotName,
    siteLocation: mission.siteLocation,
    plannedStart: toDateTimeLocalValue(mission.plannedStart),
    plannedEnd: toDateTimeLocalValue(mission.plannedEnd),
  };
}

function createTransitionForm(status: MissionStatus) {
  return {
    status: getAllowedTransitions(status)[0] ?? status,
    actualStart: '',
    actualEnd: '',
    flightHoursLogged: '',
    abortReason: '',
  };
}

interface MissionPlanFormProps {
  feedback: { tone: 'success' | 'error'; message: string } | null;
  isPending: boolean;
  mission: Mission;
  onSubmit: (payload: CreateMissionPayload) => void;
  drones: Drone[];
}

function MissionPlanForm({
  feedback,
  isPending,
  mission,
  onSubmit,
  drones,
}: MissionPlanFormProps) {
  const [formState, setFormState] = useState(() =>
    createMissionEditForm(mission),
  );

  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();

        onSubmit({
          name: formState.name.trim(),
          type: formState.type,
          droneId: formState.droneId,
          pilotName: formState.pilotName.trim(),
          siteLocation: formState.siteLocation.trim(),
          plannedStart: new Date(formState.plannedStart).toISOString(),
          plannedEnd: new Date(formState.plannedEnd).toISOString(),
        });
      }}
    >
      <div className="card-header">
        <div>
          <h3>Refine mission plan</h3>
          <p className="card-subtitle">
            Reschedule or reassign while the mission is still planned.
          </p>
        </div>
      </div>

      <label className="field">
        <span className="field-label">Mission name</span>
        <input
          required
          className="input"
          value={formState.name}
          onChange={(event) =>
            setFormState((currentState) => ({
              ...currentState,
              name: event.target.value,
            }))
          }
        />
      </label>

      <div className="form-row">
        <label className="field">
          <span className="field-label">Mission type</span>
          <select
            className="select"
            value={formState.type}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                type: event.target.value as MissionType,
              }))
            }
          >
            {missionTypes.map((type) => (
              <option key={type} value={type}>
                {formatEnumLabel(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Assigned drone</span>
          <select
            required
            className="select"
            value={formState.droneId}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                droneId: event.target.value,
              }))
            }
          >
            {drones.map((drone) => (
              <option key={drone.id} value={drone.id}>
                {drone.serialNumber}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field-label">Pilot name</span>
          <input
            required
            className="input"
            value={formState.pilotName}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                pilotName: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span className="field-label">Site location</span>
          <input
            required
            className="input"
            value={formState.siteLocation}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                siteLocation: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <div className="form-row">
        <label className="field">
          <span className="field-label">Planned start</span>
          <input
            required
            className="input"
            type="datetime-local"
            value={formState.plannedStart}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                plannedStart: event.target.value,
              }))
            }
          />
        </label>

        <label className="field">
          <span className="field-label">Planned end</span>
          <input
            required
            className="input"
            type="datetime-local"
            value={formState.plannedEnd}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                plannedEnd: event.target.value,
              }))
            }
          />
        </label>
      </div>

      {feedback ? (
        <FormNotice tone={feedback.tone} message={feedback.message} />
      ) : null}

      <div className="form-actions">
        <button
          className="button"
          data-testid="update-mission-submit"
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Saving...' : 'Save mission plan'}
        </button>
      </div>
    </form>
  );
}

interface MissionTransitionFormProps {
  feedback: { tone: 'success' | 'error'; message: string } | null;
  isPending: boolean;
  mission: Mission;
  onSubmit: (payload: TransitionMissionPayload) => void;
}

function MissionTransitionForm({
  feedback,
  isPending,
  mission,
  onSubmit,
}: MissionTransitionFormProps) {
  const [formState, setFormState] = useState(() =>
    createTransitionForm(mission.status),
  );
  const availableTransitions = getAllowedTransitions(mission.status);
  const activeTransitionStatus = availableTransitions.includes(formState.status)
    ? formState.status
    : (availableTransitions[0] ?? mission.status);

  return (
    <form
      className="form-grid"
      data-testid="mission-transition-form"
      onSubmit={(event) => {
        event.preventDefault();

        onSubmit({
          status: activeTransitionStatus,
          actualStart: formState.actualStart
            ? new Date(formState.actualStart).toISOString()
            : undefined,
          actualEnd: formState.actualEnd
            ? new Date(formState.actualEnd).toISOString()
            : undefined,
          flightHoursLogged: formState.flightHoursLogged
            ? Number(formState.flightHoursLogged)
            : undefined,
          abortReason: formState.abortReason || undefined,
        });
      }}
    >
      <div className="card-header">
        <div>
          <h3>Lifecycle transition</h3>
          <p className="card-subtitle">
            Transition rules are enforced by the backend.
          </p>
        </div>
      </div>

      {availableTransitions.length === 0 ? (
        <div className="empty-state">
          This mission is already in a terminal state.
        </div>
      ) : (
        <>
          <label className="field">
            <span className="field-label">Next status</span>
            <select
              className="select"
              data-testid="mission-transition-select"
              value={activeTransitionStatus}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  status: event.target.value as MissionStatus,
                }))
              }
            >
              {availableTransitions.map((status) => (
                <option key={status} value={status}>
                  {formatEnumLabel(status)}
                </option>
              ))}
            </select>
          </label>

          {activeTransitionStatus === 'IN_PROGRESS' ? (
            <label className="field">
              <span className="field-label">Actual start</span>
              <input
                className="input"
                type="datetime-local"
                value={formState.actualStart}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    actualStart: event.target.value,
                  }))
                }
              />
            </label>
          ) : null}

          {activeTransitionStatus === 'COMPLETED' ? (
            <div className="form-row">
              <label className="field">
                <span className="field-label">Actual end</span>
                <input
                  className="input"
                  type="datetime-local"
                  value={formState.actualEnd}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      actualEnd: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                <span className="field-label">Flight hours logged</span>
                <input
                  required
                  className="input"
                  min="0.1"
                  step="0.1"
                  type="number"
                  value={formState.flightHoursLogged}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      flightHoursLogged: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          ) : null}

          {activeTransitionStatus === 'ABORTED' ? (
            <>
              <label className="field">
                <span className="field-label">Actual end</span>
                <input
                  className="input"
                  type="datetime-local"
                  value={formState.actualEnd}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      actualEnd: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                <span className="field-label">Abort reason</span>
                <textarea
                  required
                  className="input textarea"
                  rows={4}
                  value={formState.abortReason}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      abortReason: event.target.value,
                    }))
                  }
                />
              </label>
            </>
          ) : null}
        </>
      )}

      {feedback ? (
        <FormNotice tone={feedback.tone} message={feedback.message} />
      ) : null}

      <div className="form-actions">
        <button
          className="button secondary"
          data-testid="mission-transition-submit"
          disabled={isPending || availableTransitions.length === 0}
          type="submit"
        >
          {isPending ? 'Updating...' : 'Apply transition'}
        </button>
      </div>
    </form>
  );
}

export function MissionsPage() {
  const [filters, setFilters] = useState<{
    status: '' | MissionStatus;
    droneId: string;
    startDate: string;
    endDate: string;
  }>({
    status: '',
    droneId: '',
    startDate: '',
    endDate: '',
  });
  const [createForm, setCreateForm] = useState(createMissionFormState);
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [createFeedback, setCreateFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [editFeedback, setEditFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [transitionFeedback, setTransitionFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const { data: dronesResponse } = useQuery({
    queryKey: ['drones', 'missions-page'],
    queryFn: () => fetchDrones(),
  });

  const { data: missionsResponse, isLoading } = useQuery({
    queryKey: [
      'missions',
      filters.status,
      filters.droneId,
      filters.startDate,
      filters.endDate,
    ],
    queryFn: () =>
      fetchMissions({
        status: filters.status || undefined,
        droneId: filters.droneId || undefined,
        startDate: filters.startDate
          ? new Date(`${filters.startDate}T00:00:00`).toISOString()
          : undefined,
        endDate: filters.endDate
          ? new Date(`${filters.endDate}T23:59:59`).toISOString()
          : undefined,
      }),
  });

  const drones = dronesResponse?.data ?? [];
  const availableDrones = drones.filter(
    (drone) => drone.status === 'AVAILABLE',
  );
  const activeMissionId = missionsResponse?.data.some(
    (mission) => mission.id === selectedMissionId,
  )
    ? selectedMissionId
    : (missionsResponse?.data[0]?.id ?? '');
  const selectedMission = missionsResponse?.data.find(
    (mission) => mission.id === activeMissionId,
  );
  const assignableDrones = drones.filter(
    (drone) =>
      drone.status === 'AVAILABLE' || drone.id === selectedMission?.droneId,
  );

  const createMissionMutation = useMutation({
    mutationFn: (payload: CreateMissionPayload) => createMission(payload),
    onSuccess: async (mission) => {
      setCreateFeedback({
        tone: 'success',
        message: 'Mission scheduled successfully.',
      });
      setSelectedMissionId(mission.id);
      setCreateForm(createMissionFormState());

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['missions'] }),
        queryClient.invalidateQueries({ queryKey: ['fleet-health'] }),
        queryClient.invalidateQueries({ queryKey: ['drones'] }),
      ]);
    },
    onError: (error) => {
      setCreateFeedback({
        tone: 'error',
        message: getErrorMessage(error),
      });
    },
  });

  const updateMissionMutation = useMutation({
    mutationFn: ({
      missionId,
      payload,
    }: {
      missionId: string;
      payload: CreateMissionPayload;
    }) => updateMission(missionId, payload),
    onSuccess: async (mission) => {
      setEditFeedback({
        tone: 'success',
        message: 'Mission plan updated successfully.',
      });
      setSelectedMissionId(mission.id);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['missions'] }),
        queryClient.invalidateQueries({ queryKey: ['fleet-health'] }),
        queryClient.invalidateQueries({ queryKey: ['drones'] }),
      ]);
    },
    onError: (error) => {
      setEditFeedback({
        tone: 'error',
        message: getErrorMessage(error),
      });
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({
      missionId,
      payload,
    }: {
      missionId: string;
      payload: TransitionMissionPayload;
    }) => transitionMission(missionId, payload),
    onSuccess: async () => {
      setTransitionFeedback({
        tone: 'success',
        message: 'Mission status updated successfully.',
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['missions'] }),
        queryClient.invalidateQueries({ queryKey: ['fleet-health'] }),
        queryClient.invalidateQueries({ queryKey: ['drones'] }),
      ]);
    },
    onError: (error) => {
      setTransitionFeedback({
        tone: 'error',
        message: getErrorMessage(error),
      });
    },
  });

  return (
    <>
      <header className="page-header">
        <div>
          <div className="badge">Mission Management</div>
          <h2>
            Schedule, refine, and transition inspection work with confidence.
          </h2>
          <p>
            This board combines planning, operational control, and lifecycle
            enforcement in one screen so the core business rules are easy to
            demo end to end.
          </p>
        </div>
        <div className="badge">
          {missionsResponse?.meta.total ?? 0} tracked missions
        </div>
      </header>

      <div className="toolbar">
        <select
          className="select"
          value={filters.status}
          onChange={(event) =>
            setFilters((currentState) => ({
              ...currentState,
              status: event.target.value as '' | MissionStatus,
            }))
          }
        >
          <option value="">All statuses</option>
          {missionStatuses.map((status) => (
            <option key={status} value={status}>
              {formatEnumLabel(status)}
            </option>
          ))}
        </select>

        <select
          className="select"
          value={filters.droneId}
          onChange={(event) =>
            setFilters((currentState) => ({
              ...currentState,
              droneId: event.target.value,
            }))
          }
        >
          <option value="">All drones</option>
          {drones.map((drone) => (
            <option key={drone.id} value={drone.id}>
              {drone.serialNumber}
            </option>
          ))}
        </select>

        <input
          className="input"
          type="date"
          value={filters.startDate}
          onChange={(event) =>
            setFilters((currentState) => ({
              ...currentState,
              startDate: event.target.value,
            }))
          }
        />

        <input
          className="input"
          type="date"
          value={filters.endDate}
          onChange={(event) =>
            setFilters((currentState) => ({
              ...currentState,
              endDate: event.target.value,
            }))
          }
        />
      </div>

      <section className="panel-grid split">
        <article className="card">
          <div className="card-header">
            <div>
              <h3>Schedule mission</h3>
              <p className="card-subtitle">
                Only currently available drones can be assigned at planning
                time.
              </p>
            </div>
          </div>

          <form
            className="form-grid"
            data-testid="create-mission-form"
            onSubmit={(event) => {
              event.preventDefault();
              setCreateFeedback(null);

              createMissionMutation.mutate({
                name: createForm.name.trim(),
                type: createForm.type,
                droneId: createForm.droneId,
                pilotName: createForm.pilotName.trim(),
                siteLocation: createForm.siteLocation.trim(),
                plannedStart: new Date(createForm.plannedStart).toISOString(),
                plannedEnd: new Date(createForm.plannedEnd).toISOString(),
              });
            }}
          >
            <label className="field">
              <span className="field-label">Mission name</span>
              <input
                required
                className="input"
                data-testid="mission-name-input"
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((currentState) => ({
                    ...currentState,
                    name: event.target.value,
                  }))
                }
              />
            </label>

            <div className="form-row">
              <label className="field">
                <span className="field-label">Mission type</span>
                <select
                  className="select"
                  value={createForm.type}
                  onChange={(event) =>
                    setCreateForm((currentState) => ({
                      ...currentState,
                      type: event.target.value as MissionType,
                    }))
                  }
                >
                  {missionTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatEnumLabel(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field-label">Assigned drone</span>
                <select
                  required
                  className="select"
                  data-testid="mission-drone-select"
                  value={createForm.droneId}
                  onChange={(event) =>
                    setCreateForm((currentState) => ({
                      ...currentState,
                      droneId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select a drone</option>
                  {availableDrones.map((drone) => (
                    <option key={drone.id} value={drone.id}>
                      {drone.serialNumber}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label className="field">
                <span className="field-label">Pilot name</span>
                <input
                  required
                  className="input"
                  value={createForm.pilotName}
                  onChange={(event) =>
                    setCreateForm((currentState) => ({
                      ...currentState,
                      pilotName: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                <span className="field-label">Site location</span>
                <input
                  required
                  className="input"
                  value={createForm.siteLocation}
                  onChange={(event) =>
                    setCreateForm((currentState) => ({
                      ...currentState,
                      siteLocation: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="form-row">
              <label className="field">
                <span className="field-label">Planned start</span>
                <input
                  required
                  className="input"
                  type="datetime-local"
                  value={createForm.plannedStart}
                  onChange={(event) =>
                    setCreateForm((currentState) => ({
                      ...currentState,
                      plannedStart: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="field">
                <span className="field-label">Planned end</span>
                <input
                  required
                  className="input"
                  type="datetime-local"
                  value={createForm.plannedEnd}
                  onChange={(event) =>
                    setCreateForm((currentState) => ({
                      ...currentState,
                      plannedEnd: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            {createFeedback ? (
              <FormNotice
                tone={createFeedback.tone}
                message={createFeedback.message}
              />
            ) : null}

            <div className="form-actions">
              <button
                className="button"
                data-testid="create-mission-submit"
                disabled={createMissionMutation.isPending}
                type="submit"
              >
                {createMissionMutation.isPending
                  ? 'Scheduling...'
                  : 'Schedule mission'}
              </button>
            </div>
          </form>
        </article>

        <article className="card">
          <div className="card-header">
            <div>
              <h3>Selected mission</h3>
              <p className="card-subtitle">
                Planned missions can be edited here before operational work
                begins.
              </p>
            </div>
          </div>

          {!selectedMission ? (
            <div className="empty-state">
              Select a mission from the table below to manage it.
            </div>
          ) : (
            <>
              <div className="list-row">
                <div>
                  <div className="list-row-title">{selectedMission.name}</div>
                  <div className="muted">
                    {selectedMission.drone?.serialNumber ??
                      selectedMission.droneId}{' '}
                    · {formatEnumLabel(selectedMission.type)}
                  </div>
                </div>
                <StatusPill value={selectedMission.status} />
              </div>

              <div className="detail-grid" style={{ marginTop: '1rem' }}>
                <div className="card">
                  <div className="muted">Pilot</div>
                  <strong>{selectedMission.pilotName}</strong>
                </div>
                <div className="card">
                  <div className="muted">Site</div>
                  <strong>{selectedMission.siteLocation}</strong>
                </div>
                <div className="card">
                  <div className="muted">Planned start</div>
                  <strong>
                    {format(
                      new Date(selectedMission.plannedStart),
                      'dd MMM yyyy HH:mm',
                    )}
                  </strong>
                </div>
                <div className="card">
                  <div className="muted">Planned end</div>
                  <strong>
                    {format(
                      new Date(selectedMission.plannedEnd),
                      'dd MMM yyyy HH:mm',
                    )}
                  </strong>
                </div>
              </div>

              <hr className="card-divider" />

              {selectedMission.status === 'PLANNED' ? (
                <MissionPlanForm
                  key={`${selectedMission.id}-${selectedMission.plannedStart}-${selectedMission.plannedEnd}`}
                  feedback={editFeedback}
                  isPending={updateMissionMutation.isPending}
                  mission={selectedMission}
                  drones={assignableDrones}
                  onSubmit={(payload) => {
                    setEditFeedback(null);
                    updateMissionMutation.mutate({
                      missionId: selectedMission.id,
                      payload,
                    });
                  }}
                />
              ) : (
                <div className="empty-state">
                  Direct editing is locked after pre-flight activity begins.
                </div>
              )}

              <hr className="card-divider" />

              <MissionTransitionForm
                key={`${selectedMission.id}-${selectedMission.status}`}
                feedback={transitionFeedback}
                isPending={transitionMutation.isPending}
                mission={selectedMission}
                onSubmit={(payload) => {
                  setTransitionFeedback(null);
                  transitionMutation.mutate({
                    missionId: selectedMission.id,
                    payload,
                  });
                }}
              />
            </>
          )}
        </article>
      </section>

      <article className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <div>
            <h3>Mission timeline</h3>
            <p className="card-subtitle">
              Click a row to load edit and transition controls.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading missions...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Pilot</th>
                <th>Site</th>
                <th>Planned start</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {missionsResponse?.data.map((mission) => (
                <tr
                  key={mission.id}
                  className={
                    activeMissionId === mission.id ? 'table-row-selected' : ''
                  }
                  onClick={() => {
                    setSelectedMissionId(mission.id);
                    setEditFeedback(null);
                    setTransitionFeedback(null);
                  }}
                >
                  <td>{mission.name}</td>
                  <td>{formatEnumLabel(mission.type)}</td>
                  <td>{mission.pilotName}</td>
                  <td>{mission.siteLocation}</td>
                  <td>
                    {format(
                      new Date(mission.plannedStart),
                      'dd MMM yyyy HH:mm',
                    )}
                  </td>
                  <td>
                    <StatusPill value={mission.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </>
  );
}
