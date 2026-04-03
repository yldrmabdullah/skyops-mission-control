import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MissionComposerForm } from '../features/missions/MissionComposerForm';
import {
  MissionFilters,
  MissionTimelineTable,
  SelectedMissionPanel,
} from '../features/missions/MissionPanels';
import { MissionPlanForm } from '../features/missions/MissionPlanForm';
import { MissionTransitionForm } from '../features/missions/MissionTransitionForm';
import {
  createMission,
  fetchDrones,
  fetchMissions,
  getErrorMessage,
  transitionMission,
  updateMission,
} from '../lib/api';
import type {
  CreateMissionPayload,
  MissionStatus,
  TransitionMissionPayload,
} from '../types/api';

interface MissionFiltersState {
  status: '' | MissionStatus;
  droneId: string;
  startDate: string;
  endDate: string;
}

export function MissionsPage() {
  const [filters, setFilters] = useState<MissionFiltersState>({
    status: '',
    droneId: '',
    startDate: '',
    endDate: '',
  });
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
  const missions = missionsResponse?.data ?? [];
  const availableDrones = drones.filter(
    (drone) => drone.status === 'AVAILABLE',
  );
  const activeMissionId = missions.some(
    (mission) => mission.id === selectedMissionId,
  )
    ? selectedMissionId
    : (missions[0]?.id ?? '');
  const selectedMission = missions.find(
    (mission) => mission.id === activeMissionId,
  );
  const assignableDrones = drones.filter(
    (drone) =>
      drone.status === 'AVAILABLE' || drone.id === selectedMission?.droneId,
  );

  async function refreshMissionData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['missions'] }),
      queryClient.invalidateQueries({ queryKey: ['fleet-health'] }),
      queryClient.invalidateQueries({ queryKey: ['drones'] }),
    ]);
  }

  const createMissionMutation = useMutation({
    mutationFn: (payload: CreateMissionPayload) => createMission(payload),
    onSuccess: async (mission) => {
      setCreateFeedback({
        tone: 'success',
        message: 'Mission scheduled successfully.',
      });
      setSelectedMissionId(mission.id);
      await refreshMissionData();
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
      await refreshMissionData();
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
      await refreshMissionData();
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

      <MissionFilters
        drones={drones}
        droneId={filters.droneId}
        endDate={filters.endDate}
        startDate={filters.startDate}
        status={filters.status}
        onChange={(nextFilters) =>
          setFilters((currentState) => ({
            ...currentState,
            ...nextFilters,
          }))
        }
      />

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

          <MissionComposerForm
            availableDrones={availableDrones}
            feedback={createFeedback}
            isPending={createMissionMutation.isPending}
            onSubmit={(payload) => {
              setCreateFeedback(null);
              createMissionMutation.mutate(payload);
            }}
          />
        </article>

        <SelectedMissionPanel mission={selectedMission}>
          {selectedMission?.status === 'PLANNED' ? (
            <>
              <MissionPlanForm
                key={`${selectedMission.id}-${selectedMission.plannedStart}-${selectedMission.plannedEnd}`}
                drones={assignableDrones}
                feedback={editFeedback}
                isPending={updateMissionMutation.isPending}
                mission={selectedMission}
                onSubmit={(payload) => {
                  setEditFeedback(null);
                  updateMissionMutation.mutate({
                    missionId: selectedMission.id,
                    payload,
                  });
                }}
              />
              <hr className="card-divider" />
            </>
          ) : (
            <>
              <div className="empty-state">
                Direct editing is locked after pre-flight activity begins.
              </div>
              <hr className="card-divider" />
            </>
          )}

          {selectedMission ? (
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
          ) : null}
        </SelectedMissionPanel>
      </section>

      <MissionTimelineTable
        isLoading={isLoading}
        missions={missions}
        selectedMissionId={activeMissionId}
        onSelect={(missionId) => {
          setSelectedMissionId(missionId);
          setEditFeedback(null);
          setTransitionFeedback(null);
        }}
      />
    </>
  );
}
