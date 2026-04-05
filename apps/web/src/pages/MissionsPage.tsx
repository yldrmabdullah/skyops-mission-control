import { useDeferredValue, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from '../auth/use-auth';
import { FormNotice } from '../components/FormNotice';
import { StatePanel } from '../components/StatePanel';
import { EmptyState, SurfaceCard } from '../components/SurfaceCard';
import { useNotifications } from '../components/use-notifications';
import { MissionComposerForm } from '../features/missions/MissionComposerForm';
import {
  MissionFilters,
  MissionTimelineTable,
  SelectedMissionPanel,
} from '../features/missions/MissionPanels';
import {
  missionSortOrderToParam,
  resolveMissionListSort,
} from '../features/missions/mission-list-sort';
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
import {
  localDateToEndOfDayIso,
  localDateToStartOfDayIso,
} from '../lib/date-iso-range';
import { invalidateMissionBoardQueries } from '../lib/query-invalidation';
import { canScheduleMissions } from '../lib/roles';
import { useFeedbackState } from '../hooks/use-feedback-state';
import type {
  CreateMissionPayload,
  MissionListSortField,
  MissionStatus,
  TransitionMissionPayload,
} from '../types/api';

interface MissionFiltersState {
  status: '' | MissionStatus;
  droneId: string;
  startDate: string;
  endDate: string;
  search: string;
}

export function MissionsPage() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sortBy, sortOrder } = resolveMissionListSort(searchParams);
  const allowMissionEdits = canScheduleMissions(user?.role);
  const [filters, setFilters] = useState<MissionFiltersState>({
    status: '',
    droneId: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [createSuccessCount, setCreateSuccessCount] = useState(0);
  const createFeedback = useFeedbackState();
  const editFeedback = useFeedbackState();
  const transitionFeedback = useFeedbackState();

  const queryClient = useQueryClient();
  const deferredMissionSearch = useDeferredValue(filters.search);

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
      deferredMissionSearch.trim(),
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      fetchMissions({
        status: filters.status || undefined,
        droneId: filters.droneId || undefined,
        startDate: filters.startDate
          ? localDateToStartOfDayIso(filters.startDate)
          : undefined,
        endDate: filters.endDate
          ? localDateToEndOfDayIso(filters.endDate)
          : undefined,
        search: deferredMissionSearch.trim() || undefined,
        sortBy,
        sortOrder,
      }),
    placeholderData: keepPreviousData,
  });
  const dronesResponse = dronesQuery.data;
  const missionsResponse = missionsQuery.data;
  const isTimelineLoading =
    missionsQuery.isPending && missionsQuery.data === undefined;
  const isMissionListBackgroundFetch =
    missionsQuery.isFetching && missionsQuery.data !== undefined;

  const drones = dronesQuery.isError ? [] : (dronesResponse?.data ?? []);
  const missions = missionsQuery.isError ? [] : (missionsResponse?.data ?? []);
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

  const createMissionMutation = useMutation({
    mutationFn: (payload: CreateMissionPayload) => createMission(payload),
    onSuccess: async (mission) => {
      createFeedback.setFeedback({
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
      await invalidateMissionBoardQueries(queryClient);
    },
    onError: (error) => {
      createFeedback.setFeedback({
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
      editFeedback.setFeedback({
        tone: 'success',
        message: 'Mission plan updated successfully.',
      });
      notify({
        tone: 'success',
        title: 'Mission updated',
        description: 'The mission plan has been saved successfully.',
      });
      setSelectedMissionId(mission.id);
      await invalidateMissionBoardQueries(queryClient);
    },
    onError: (error) => {
      editFeedback.setFeedback({
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
      transitionFeedback.setFeedback({
        tone: 'success',
        message: 'Mission status updated successfully.',
      });
      notify({
        tone: 'success',
        title: 'Mission transitioned',
        description: 'The lifecycle state was updated successfully.',
      });
      await invalidateMissionBoardQueries(queryClient);
    },
    onError: (error) => {
      transitionFeedback.setFeedback({
        tone: 'error',
        message: getErrorMessage(error),
      });
    },
  });

  if (missionsQuery.isError && dronesQuery.isError) {
    return (
      <StatePanel
        actionHref="/"
        actionLabel="Return to dashboard"
        description={getErrorMessage(dronesQuery.error ?? missionsQuery.error)}
        title="Unable to load mission control"
        tone="error"
      />
    );
  }

  return (
    <>
      {dronesQuery.isError ? (
        <div className="section-spaced">
          <FormNotice
            message="Drone list failed to load; mission filters may be limited."
            tone="warning"
          />
        </div>
      ) : null}
      {missionsQuery.isError ? (
        <div className="section-spaced">
          <FormNotice message="Mission list failed to load." tone="warning" />
        </div>
      ) : null}

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
          {missionsQuery.isError ? 0 : (missionsResponse?.meta.total ?? 0)}{' '}
          tracked missions
        </div>
      </header>

      <MissionFilters
        drones={drones}
        droneId={filters.droneId}
        endDate={filters.endDate}
        search={filters.search}
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
          description={
            allowMissionEdits
              ? 'Only currently available drones can be assigned at planning time.'
              : 'Scheduling and lifecycle changes are limited to Pilots and Managers.'
          }
          title="Schedule mission"
        >
          {allowMissionEdits ? (
            <MissionComposerForm
              key={createSuccessCount}
              drones={drones}
              feedback={createFeedback.feedback}
              isPending={createMissionMutation.isPending}
              onSubmit={(payload) => {
                createFeedback.clearFeedback();
                createMissionMutation.mutate(payload);
              }}
            />
          ) : (
            <EmptyState>
              Your role can review the timeline below; mission changes are not
              available here.
            </EmptyState>
          )}
        </SurfaceCard>

        <SelectedMissionPanel mission={selectedMission}>
          {allowMissionEdits ? (
            <>
              {selectedMission?.status === 'PLANNED' ? (
                <>
                  <MissionPlanForm
                    key={`${selectedMission.id}-${selectedMission.plannedStart}-${selectedMission.plannedEnd}`}
                    drones={assignableDrones}
                    feedback={editFeedback.feedback}
                    isPending={updateMissionMutation.isPending}
                    mission={selectedMission}
                    onSubmit={(payload) => {
                      editFeedback.clearFeedback();
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
                  feedback={transitionFeedback.feedback}
                  isPending={transitionMutation.isPending}
                  mission={selectedMission}
                  onSubmit={(payload) => {
                    transitionFeedback.clearFeedback();
                    transitionMutation.mutate({
                      missionId: selectedMission.id,
                      payload,
                    });
                  }}
                />
              ) : null}
            </>
          ) : selectedMission ? (
            <p className="muted">
              Lifecycle changes require a Pilot or Manager account.
            </p>
          ) : (
            <EmptyState>
              Select a mission in the table for read-only context.
            </EmptyState>
          )}
        </SelectedMissionPanel>
      </section>

      <MissionTimelineTable
        isBackgroundFetching={isMissionListBackgroundFetch}
        isLoading={isTimelineLoading}
        missions={missions}
        selectedMissionId={activeMissionId}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSelect={(missionId) => {
          setSelectedMissionId(missionId);
          editFeedback.clearFeedback();
          transitionFeedback.clearFeedback();
        }}
        onSortChange={(field: MissionListSortField) => {
          const nextParams = new URLSearchParams(searchParams);
          if (sortBy === field) {
            nextParams.set(
              'order',
              missionSortOrderToParam(sortOrder === 'ASC' ? 'DESC' : 'ASC'),
            );
          } else {
            nextParams.set('sort', field);
            nextParams.set('order', 'asc');
          }
          setSearchParams(nextParams, {
            replace: true,
            preventScrollReset: true,
          });
        }}
      />
    </>
  );
}
