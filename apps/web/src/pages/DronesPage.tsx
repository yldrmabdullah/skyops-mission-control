import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { DroneRegistryForm } from '../features/drones/DroneRegistryForm';
import {
  DroneRegistryHighlights,
  DroneRegistryToolbar,
  DronesTable,
} from '../features/drones/DroneRegistryPanels';
import { createDrone, fetchDrones, getErrorMessage } from '../lib/api';
import type { CreateDronePayload } from '../types/api';

export function DronesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [formFeedback, setFormFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  const selectedStatus = searchParams.get('status') ?? '';
  const deferredSearchValue = useDeferredValue(searchValue);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['drones', selectedStatus],
    queryFn: () => fetchDrones(selectedStatus || undefined),
  });

  const createDroneMutation = useMutation({
    mutationFn: (payload: CreateDronePayload) => createDrone(payload),
    onSuccess: async () => {
      setFormFeedback({
        tone: 'success',
        message: 'Drone registered successfully.',
      });
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
        <article className="card">
          <div className="card-header">
            <h3>Add drone</h3>
            <span className="muted">
              Full validation is enforced by the API
            </span>
          </div>

          <DroneRegistryForm
            feedback={formFeedback}
            isPending={createDroneMutation.isPending}
            onSubmit={(payload) => {
              setFormFeedback(null);
              createDroneMutation.mutate(payload);
            }}
          />
        </article>

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

      <DronesTable
        drones={filteredDrones}
        isLoading={isLoading}
        total={data?.meta.total ?? 0}
      />
    </>
  );
}
