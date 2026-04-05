import type { QueryClient } from '@tanstack/react-query';

export async function invalidateDroneRelatedQueries(
  queryClient: QueryClient,
  droneId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['drone', droneId] }),
    queryClient.invalidateQueries({ queryKey: ['drones'] }),
    queryClient.invalidateQueries({ queryKey: ['fleet-health'] }),
  ]);
}

export async function invalidateMissionBoardQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['missions'] }),
    queryClient.invalidateQueries({ queryKey: ['fleet-health'] }),
    queryClient.invalidateQueries({ queryKey: ['drones'] }),
  ]);
}
