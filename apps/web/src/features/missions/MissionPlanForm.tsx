import { useState } from 'react';
import { DateInput } from '../../components/DateInput';
import { FormNotice } from '../../components/FormNotice';
import { formatEnumLabel } from '../../lib/format';
import type { CreateMissionPayload, Drone, Mission } from '../../types/api';
import {
  createMissionEditForm,
  missionFormToPayload,
  missionTypes,
} from './mission-form.utils';

interface Feedback {
  tone: 'success' | 'error';
  message: string;
}

interface MissionPlanFormProps {
  drones: Drone[];
  feedback: Feedback | null;
  isPending: boolean;
  mission: Mission;
  onSubmit: (payload: CreateMissionPayload) => void;
}

export function MissionPlanForm({
  drones,
  feedback,
  isPending,
  mission,
  onSubmit,
}: MissionPlanFormProps) {
  const [formState, setFormState] = useState(() =>
    createMissionEditForm(mission),
  );

  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(missionFormToPayload(formState));
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
