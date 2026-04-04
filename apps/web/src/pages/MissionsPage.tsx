import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StatePanel } from '../components/StatePanel';
import { EmptyState, SurfaceCard } from '../components/SurfaceCard';
import { useNotifications } from '../components/use-notifications';
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
  const { notify } = useNotifications();
  const [filters, setFilters] = useState<MissionFiltersState>({
    status: '',
    droneId: '',
    startDate: '',
    endDate: '',
  });
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [createSuccessCount, setCreateSuccessCount] = useState(0);
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

  const dronesQuery = useQuery({
    queryKey: ['drones', 'missions-page'],
    queryFn: () => fetchDrones(),
  });

  const missionsQuery = useQuery({
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
  const dronesResponse = dronesQuery.data;
  const missionsResponse = missionsQuery.data;
  const isLoading = missionsQuery.isLoading;

  const drones = dronesResponse?.data ?? [];
  const missions = missionsResponse?.data ?? [];
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
      setCreateSuccessCount((current) => current + 1);
      notify({
        tone: 'success',
        title: 'Mission scheduled',
        description: 'The mission has been added to the active board.',
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
      notify({
        tone: 'success',
        title: 'Mission updated',
        description: 'The mission plan has been saved successfully.',
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
      notify({
        tone: 'success',
        title: 'Mission transitioned',
        description: 'The lifecycle state was updated successfully.',
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

  if (dronesQuery.isError || missionsQuery.isError) {
    return (
      <StatePanel
        actionHref="/dashboard"
        actionLabel="Return to dashboard"
        description={getErrorMessage(dronesQuery.error ?? missionsQuery.error)}
        title="Unable to load mission control"
        tone="error"
      />
    );
  }

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
        <SurfaceCard
          description="Only currently available drones can be assigned at planning time."
          title="Schedule mission"
        >
          <MissionComposerForm
            key={createSuccessCount}
            drones={drones}
            feedback={createFeedback}
            isPending={createMissionMutation.isPending}
            onSubmit={(payload) => {
              setCreateFeedback(null);
              createMissionMutation.mutate(payload);
            }}
          />
        </SurfaceCard>

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
              <EmptyState>
                Direct editing is locked after pre-flight activity begins.
              </EmptyState>
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
