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
import { createDrone, fetchDrones, getErrorMessage } from '../lib/api';
import type { CreateDronePayload } from '../types/api';

export function DronesPage() {
  const { notify } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [createSuccessCount, setCreateSuccessCount] = useState(0);
  const dronesTableAnchorRef = useRef<HTMLDivElement>(null);
  const scrollTargetDroneIdRef = useRef<string | null>(null);
  const lastHandledCreateSuccessCountRef = useRef(0);
  const [formFeedback, setFormFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  const selectedStatus = searchParams.get('status') ?? '';
  const deferredSearchValue = useDeferredValue(searchValue);
  const queryClient = useQueryClient();

  const dronesQuery = useQuery({
    queryKey: ['drones', selectedStatus],
    queryFn: () => fetchDrones(selectedStatus || undefined),
  });
  const data = dronesQuery.data;
  const isLoading = dronesQuery.isLoading;

  const createDroneMutation = useMutation({
    mutationFn: (payload: CreateDronePayload) => createDrone(payload),
    onSuccess: async (createdDrone) => {
      scrollTargetDroneIdRef.current = createdDrone.id;
      setFormFeedback({
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
      setFormFeedback({
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
            feedback={formFeedback}
            isPending={createDroneMutation.isPending}
            onSubmit={(payload) => {
              setFormFeedback(null);
              createDroneMutation.mutate(payload);
            }}
          />
        </SurfaceCard>

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
          drones={filteredDrones}
          isLoading={isLoading}
          total={data?.meta.total ?? 0}
        />
      </div>
    </>
  );
}
