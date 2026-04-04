import { useAuth } from '../auth/use-auth';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { StatePanel } from '../components/StatePanel';
import { SurfaceCard } from '../components/SurfaceCard';
import { useNotifications } from '../components/use-notifications';
import { DroneRegistryForm } from '../features/drones/DroneRegistryForm';
import {
  DroneRegistryHighlights,
  DroneRegistryToolbar,
  DronesTable,
} from '../features/drones/DroneRegistryPanels';
import { useFeedbackState } from '../hooks/use-feedback-state';
import { createDrone, fetchDrones, getErrorMessage } from '../lib/api';
import { canManageFleet } from '../lib/roles';
import type { CreateDronePayload } from '../types/api';

export function DronesPage() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [createSuccessCount, setCreateSuccessCount] = useState(0);
  const dronesTableAnchorRef = useRef<HTMLDivElement>(null);
  const scrollTargetDroneIdRef = useRef<string | null>(null);
  const lastHandledCreateSuccessCountRef = useRef(0);
  const formFeedback = useFeedbackState();

  const selectedStatus = searchParams.get('status') ?? '';
  const queryClient = useQueryClient();

  const deferredSearch = useDeferredValue(searchValue);
  const dronesQuery = useQuery({
    queryKey: ['drones', selectedStatus, deferredSearch.trim()],
    queryFn: () =>
      fetchDrones(
        selectedStatus || undefined,
        deferredSearch.trim() || undefined,
      ),
  });
  const data = dronesQuery.data;
  const isLoading = dronesQuery.isLoading;

  const createDroneMutation = useMutation({
    mutationFn: (payload: CreateDronePayload) => createDrone(payload),
    onSuccess: async (createdDrone) => {
      scrollTargetDroneIdRef.current = createdDrone.id;
      formFeedback.setFeedback({
        tone: 'success',
        message: 'Drone registered successfully.',
      });
      setCreateSuccessCount((current) => current + 1);
      notify({
        tone: 'success',
        title: 'Drone created',
        description: 'The drone registry has been updated successfully.',
      });
      queryClient.setQueriesData(
        { queryKey: ['drones'] },
        (
          current:
            | { data?: CreateDronePayload[]; meta?: { total: number } }
            | undefined,
        ) => {
          if (
            !current ||
            !Array.isArray((current as { data?: unknown[] }).data)
          ) {
            return current;
          }

          const typedCurrent = current as {
            data: (typeof createdDrone)[];
            meta: {
              total: number;
              page: number;
              limit: number;
              totalPages: number;
            };
          };

          const alreadyExists = typedCurrent.data.some(
            (drone) => drone.id === createdDrone.id,
          );

          if (alreadyExists) {
            return typedCurrent;
          }

          return {
            ...typedCurrent,
            data: [createdDrone, ...typedCurrent.data],
            meta: {
              ...typedCurrent.meta,
              total: typedCurrent.meta.total + 1,
            },
          };
        },
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['drones'] }),
        queryClient.invalidateQueries({ queryKey: ['fleet-health'] }),
      ]);
    },
    onError: (error) => {
      formFeedback.setFeedback({
        tone: 'error',
        message: getErrorMessage(error),
      });
    },
  });

  useEffect(() => {
    if (createSuccessCount === 0) {
      return;
    }

    if (lastHandledCreateSuccessCountRef.current === createSuccessCount) {
      return;
    }

    lastHandledCreateSuccessCountRef.current = createSuccessCount;
    const droneId = scrollTargetDroneIdRef.current;
    scrollTargetDroneIdRef.current = null;
    if (!droneId) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dronesTableAnchorRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
        document
          .querySelector<HTMLElement>(`[data-registry-drone-id="${droneId}"]`)
          ?.focus({ preventScroll: true });
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [createSuccessCount]);

  if (dronesQuery.isError) {
    return (
      <StatePanel
        actionHref="/dashboard"
        actionLabel="Return to dashboard"
        description={getErrorMessage(dronesQuery.error)}
        title="Unable to load the drone registry"
        tone="error"
      />
    );
  }

  const tableDrones = data?.data ?? [];
  const showFleetForm = canManageFleet(user?.role);

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
        {showFleetForm ? (
          <SurfaceCard
            actions={
              <span className="muted">
                Full validation is enforced by the API
              </span>
            }
            title="Add drone"
          >
            <DroneRegistryForm
              key={createSuccessCount}
              feedback={formFeedback.feedback}
              isPending={createDroneMutation.isPending}
              onSubmit={(payload) => {
                formFeedback.clearFeedback();
                createDroneMutation.mutate(payload);
              }}
            />
          </SurfaceCard>
        ) : (
          <SurfaceCard
            title="Fleet administration"
            description="Only managers can register or retire drones in this workspace."
          >
            <p className="muted">
              Your role is <strong>{user?.role}</strong>. Ask a workspace
              manager if a new aircraft should be added.
            </p>
          </SurfaceCard>
        )}

        <DroneRegistryHighlights total={data?.meta.total ?? 0} />
      </section>

      <DroneRegistryToolbar
        searchValue={searchValue}
        selectedStatus={selectedStatus}
        onSearchChange={setSearchValue}
        onStatusChange={(status) => {
          const nextParams = new URLSearchParams(searchParams);

          if (status) {
            nextParams.set('status', status);
          } else {
            nextParams.delete('status');
          }

          setSearchParams(nextParams);
        }}
      />

      <div ref={dronesTableAnchorRef}>
        <DronesTable
          drones={tableDrones}
          isLoading={isLoading}
          total={data?.meta.total ?? 0}
        />
      </div>
    </>
  );
}
