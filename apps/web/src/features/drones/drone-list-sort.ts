export const DRONE_LIST_SORT_FIELDS = [
  'serialNumber',
  'model',
  'status',
  'totalFlightHours',
  'nextMaintenanceDueDate',
  'registeredAt',
] as const;

export type DroneListSortField = (typeof DRONE_LIST_SORT_FIELDS)[number];

export type DroneListSortOrderUi = 'asc' | 'desc';

export function isDroneListSortField(
  value: string | null,
): value is DroneListSortField {
  return (
    value !== null &&
    (DRONE_LIST_SORT_FIELDS as readonly string[]).includes(value)
  );
}

/** Stable sort for React Query + API from URL params. */
export function resolveDroneListSort(params: URLSearchParams): {
  sortBy: DroneListSortField;
  sortOrder: 'ASC' | 'DESC';
} {
  const rawSort = params.get('sort');
  const sortBy: DroneListSortField = isDroneListSortField(rawSort)
    ? rawSort
    : 'registeredAt';

  const rawOrder = params.get('order');
  if (rawOrder === 'asc') {
    return { sortBy, sortOrder: 'ASC' };
  }
  if (rawOrder === 'desc') {
    return { sortBy, sortOrder: 'DESC' };
  }

  return {
    sortBy,
    sortOrder: sortBy === 'registeredAt' ? 'DESC' : 'ASC',
  };
}

export function sortOrderToParam(order: 'ASC' | 'DESC'): DroneListSortOrderUi {
  return order === 'ASC' ? 'asc' : 'desc';
}
