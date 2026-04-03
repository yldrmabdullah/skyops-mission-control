import { useState } from 'react';
import { FormNotice } from '../../components/FormNotice';
import { formatEnumLabel } from '../../lib/format';
import type { Mission } from '../../types/api';
import {
  createTransitionForm,
  getAllowedTransitions,
  type TransitionFormState,
  transitionFormToPayload,
} from './mission-form.utils';

interface Feedback {
  tone: 'success' | 'error';
  message: string;
}

interface MissionTransitionFormProps {
  feedback: Feedback | null;
  isPending: boolean;
  mission: Mission;
  onSubmit: (payload: ReturnType<typeof transitionFormToPayload>) => void;
}

export function MissionTransitionForm({
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
        onSubmit(transitionFormToPayload(formState, activeTransitionStatus));
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
                  status: event.target.value as TransitionFormState['status'],
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
