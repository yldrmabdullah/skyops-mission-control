import { useState } from 'react';
import { DateInput } from '../../components/DateInput';
import { DecimalTextInput } from '../../components/DecimalTextInput';
import { FormNotice } from '../../components/FormNotice';
import { parseLocaleDecimal } from '../../lib/locale-number';
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
  const [clientError, setClientError] = useState<string | null>(null);
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
        setClientError(null);

        if (activeTransitionStatus === 'COMPLETED') {
          const hours = parseLocaleDecimal(formState.flightHoursLogged);
          if (!Number.isFinite(hours) || hours < 0.1) {
            setClientError(
              'Enter flight hours logged (minimum 0.1). Use a period or comma as the decimal separator.',
            );
            return;
          }
        }

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
              onChange={(event) => {
                setClientError(null);
                setFormState((currentState) => ({
                  ...currentState,
                  status: event.target.value as TransitionFormState['status'],
                }));
              }}
            >
              {availableTransitions.map((status) => (
                <option key={status} value={status}>
                  {formatEnumLabel(status)}
                </option>
              ))}
            </select>
          </label>

          {activeTransitionStatus === 'IN_PROGRESS' ? (
            <DateInput
              label="Actual start"
              type="datetime-local"
              value={formState.actualStart}
              onChange={(value) =>
                setFormState((currentState) => ({
                  ...currentState,
                  actualStart: value,
                }))
              }
            />
          ) : null}

          {activeTransitionStatus === 'COMPLETED' ? (
            <div className="form-field-group">
              <div className="form-row">
                <DateInput
                  compact
                  label="Actual end"
                  type="datetime-local"
                  value={formState.actualEnd}
                  onChange={(value) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      actualEnd: value,
                    }))
                  }
                />

                <label className="field">
                  <span className="field-label">Flight hours logged</span>
                  <DecimalTextInput
                    required
                    className="input"
                    value={formState.flightHoursLogged}
                    onChange={(value) => {
                      setClientError(null);
                      setFormState((currentState) => ({
                        ...currentState,
                        flightHoursLogged: value,
                      }));
                    }}
                  />
                </label>
              </div>
              <p className="field-hint form-hint-below-pair">
                Decimal: 1.5 or 1,5 — both accepted.
              </p>
            </div>
          ) : null}

          {activeTransitionStatus === 'ABORTED' ? (
            <>
              <DateInput
                label="Actual end"
                type="datetime-local"
                value={formState.actualEnd}
                onChange={(value) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    actualEnd: value,
                  }))
                }
              />

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

      {clientError ? <FormNotice tone="error" message={clientError} /> : null}
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
