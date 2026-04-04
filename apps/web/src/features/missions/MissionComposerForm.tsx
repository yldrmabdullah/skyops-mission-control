import { useState } from 'react';
import { DateInput } from '../../components/DateInput';
import { FormNotice } from '../../components/FormNotice';
import { formatEnumLabel } from '../../lib/format';
import type { CreateMissionPayload, Drone } from '../../types/api';
import {
  createMissionFormState,
  missionFormToPayload,
  missionTypes,
} from './mission-form.utils';

interface Feedback {
  tone: 'success' | 'error';
  message: string;
}

interface MissionComposerFormProps {
  drones: Drone[];
  feedback: Feedback | null;
  isPending: boolean;
  onSubmit: (payload: CreateMissionPayload) => void;
}

export function MissionComposerForm({
  drones,
  feedback,
  isPending,
  onSubmit,
}: MissionComposerFormProps) {
  const [formState, setFormState] = useState(createMissionFormState);
  const availableDroneCount = drones.filter(
    (drone) => drone.status === 'AVAILABLE',
  ).length;

  return (
    <form
      className="form-grid"
      data-testid="create-mission-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(missionFormToPayload(formState));
      }}
    >
      <label className="field">
        <span className="field-label">Mission name</span>
        <input
          required
          className="input"
          data-testid="mission-name-input"
          value={formState.name}
          onChange={(event) =>
            setFormState((currentState) => ({
              ...currentState,
              name: event.target.value,
            }))
          }
        />
      </label>

      <div className="form-field-group">
        <div className="form-row">
          <label className="field">
            <span className="field-label">Mission type</span>
            <select
              className="select"
              value={formState.type}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  type: event.target.value as CreateMissionPayload['type'],
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
              value={formState.droneId}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  droneId: event.target.value,
                }))
              }
            >
              <option value="">Select a drone</option>
              {drones.map((drone) => (
                <option
                  key={drone.id}
                  disabled={drone.status !== 'AVAILABLE'}
                  value={drone.id}
                >
                  {drone.serialNumber} · {formatEnumLabel(drone.status)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="field-hint form-hint-below-pair">
          Only drones with `AVAILABLE` status can be selected for new missions.
          Available now: {availableDroneCount}
        </p>
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
        <DateInput
          compact
          label="Planned start"
          required
          type="datetime-local"
          value={formState.plannedStart}
          onChange={(value) =>
            setFormState((currentState) => ({
              ...currentState,
              plannedStart: value,
            }))
          }
        />

        <DateInput
          compact
          label="Planned end"
          required
          type="datetime-local"
          value={formState.plannedEnd}
          onChange={(value) =>
            setFormState((currentState) => ({
              ...currentState,
              plannedEnd: value,
            }))
          }
        />
      </div>

      {feedback ? (
        <FormNotice tone={feedback.tone} message={feedback.message} />
      ) : null}

      <div className="form-actions">
        <button
          className="button"
          data-testid="create-mission-submit"
          disabled={isPending}
          type="submit"
        >
          {isPending ? 'Scheduling...' : 'Schedule mission'}
        </button>
      </div>
    </form>
  );
}
