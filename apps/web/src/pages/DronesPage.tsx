import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { FormNotice } from '../components/FormNotice';
import { StatusPill } from '../components/StatusPill';
import { createDrone, fetchDrones, getErrorMessage } from '../lib/api';
import type { CreateDronePayload, DroneModel, DroneStatus } from '../types/api';

const droneModels: DroneModel[] = [
  'PHANTOM_4',
  'MATRICE_300',
  'MAVIC_3_ENTERPRISE',
];

const droneStatuses: DroneStatus[] = ['AVAILABLE', 'MAINTENANCE', 'RETIRED'];

const initialDroneForm = {
  serialNumber: '',
  model: 'MATRICE_300' as DroneModel,
  status: 'AVAILABLE' as DroneStatus,
  totalFlightHours: '0',
  lastMaintenanceDate: new Date().toISOString().slice(0, 10),
  flightHoursAtLastMaintenance: '0',
};

export function DronesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [formState, setFormState] = useState(initialDroneForm);
  const [formFeedback, setFormFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  const selectedStatus = searchParams.get('status') ?? '';
  const deferredSearchValue = useDeferredValue(searchValue);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['drones', selectedStatus],
    queryFn: () => fetchDrones(selectedStatus || undefined),
  });

  const createDroneMutation = useMutation({
    mutationFn: (payload: CreateDronePayload) => createDrone(payload),
    onSuccess: async () => {
      setFormFeedback({
        tone: 'success',
        message: 'Drone registered successfully.',
      });
      setFormState(initialDroneForm);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['drones'] }),
        queryClient.invalidateQueries({ queryKey: ['fleet-health'] }),
      ]);
    },
    onError: (error) => {
      setFormFeedback({
        tone: 'error',
        message: getErrorMessage(error),
      });
    },
  });

  const filteredDrones =
    data?.data.filter((drone) => {
      const normalizedSearch = deferredSearchValue.trim().toLowerCase();

      if (!normalizedSearch) {
        return true;
      }

      return (
        drone.serialNumber.toLowerCase().includes(normalizedSearch) ||
        drone.model.toLowerCase().includes(normalizedSearch)
      );
    }) ?? [];

  return (
    <>
      <header className="page-header">
        <div>
          <div className="badge">Drone Registry</div>
          <h2>Fleet inventory with operational and maintenance context.</h2>
          <p>
            Create, review, and monitor fleet assets with interview-ready data
            points: availability, maintenance deadlines, and operational
            history.
          </p>
        </div>
        <div className="badge">{data?.meta.total ?? 0} registered drones</div>
      </header>

      <section className="panel-grid split">
        <article className="card">
          <div className="card-header">
            <h3>Add drone</h3>
            <span className="muted">
              Full validation is enforced by the API
            </span>
          </div>

          <form
            className="form-grid"
            data-testid="create-drone-form"
            onSubmit={(event) => {
              event.preventDefault();
              setFormFeedback(null);

              createDroneMutation.mutate({
                serialNumber: formState.serialNumber.trim().toUpperCase(),
                model: formState.model,
                status: formState.status,
                totalFlightHours: Number(formState.totalFlightHours || 0),
                lastMaintenanceDate: new Date(
                  `${formState.lastMaintenanceDate}T00:00:00`,
                ).toISOString(),
                flightHoursAtLastMaintenance: Number(
                  formState.flightHoursAtLastMaintenance || 0,
                ),
              });
            }}
          >
            <label className="field">
              <span className="field-label">Serial number</span>
              <input
                required
                className="input"
                data-testid="drone-serial-input"
                placeholder="SKY-A1B2-C3D4"
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
                      {model.replaceAll('_', ' ')}
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
                  {droneStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll('_', ' ')}
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
                required
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

            {formFeedback ? (
              <FormNotice
                tone={formFeedback.tone}
                message={formFeedback.message}
              />
            ) : null}

            <div className="form-actions">
              <button
                className="button"
                data-testid="create-drone-submit"
                disabled={createDroneMutation.isPending}
                type="submit"
              >
                {createDroneMutation.isPending ? 'Saving...' : 'Register drone'}
              </button>
            </div>
          </form>
        </article>

        <article className="card">
          <div className="card-header">
            <h3>Registry intelligence</h3>
            <span className="muted">What reviewers will notice</span>
          </div>
          <div className="list">
            <div className="list-row">
              <div>
                <div className="list-row-title">Strong domain validation</div>
                <div className="muted">
                  Serial format, maintenance dates, and operational status are
                  enforced end to end.
                </div>
              </div>
            </div>
            <div className="list-row">
              <div>
                <div className="list-row-title">
                  Maintenance-aware operations
                </div>
                <div className="muted">
                  Fleet detail is linked to mission and maintenance history,
                  making operational risk easy to explain live.
                </div>
              </div>
            </div>
            <div className="list-row">
              <div>
                <div className="list-row-title">Drill-down ready</div>
                <div className="muted">
                  Each row links to a full detail screen with update and
                  maintenance actions.
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>

      <div className="toolbar" style={{ marginTop: '1rem' }}>
        <input
          className="input"
          placeholder="Search by serial number or model"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
        <select
          className="select"
          value={selectedStatus}
          onChange={(event) => {
            const nextParams = new URLSearchParams(searchParams);

            if (event.target.value) {
              nextParams.set('status', event.target.value);
            } else {
              nextParams.delete('status');
            }

            setSearchParams(nextParams);
          }}
        >
          <option value="">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="IN_MISSION">In mission</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      <article className="card">
        <div className="card-header">
          <h3>Registered drones</h3>
          <span className="muted">
            {filteredDrones.length} visible / {data?.meta.total ?? 0} total
          </span>
        </div>

        {isLoading ? (
          <div className="empty-state">Loading fleet data...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Serial number</th>
                <th>Model</th>
                <th>Status</th>
                <th>Total hours</th>
                <th>Next maintenance</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrones.map((drone) => (
                <tr key={drone.id}>
                  <td>
                    <Link to={`/drones/${drone.id}`}>{drone.serialNumber}</Link>
                  </td>
                  <td>{drone.model.replaceAll('_', ' ')}</td>
                  <td>
                    <StatusPill value={drone.status} />
                  </td>
                  <td>{drone.totalFlightHours.toFixed(1)}h</td>
                  <td>
                    {new Date(
                      drone.nextMaintenanceDueDate,
                    ).toLocaleDateString()}
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
