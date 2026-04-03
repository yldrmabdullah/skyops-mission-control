import { useState } from 'react';
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
  availableDrones: Drone[];
  feedback: Feedback | null;
  isPending: boolean;
  onSubmit: (payload: CreateMissionPayload) => void;
}

export function MissionComposerForm({
  availableDrones,
  feedback,
  isPending,
  onSubmit,
}: MissionComposerFormProps) {
  const [formState, setFormState] = useState(createMissionFormState);

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
