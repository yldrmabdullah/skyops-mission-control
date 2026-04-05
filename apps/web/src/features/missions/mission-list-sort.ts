import type { MissionListSortField } from '../../types/api';

export const MISSION_LIST_SORT_FIELDS: readonly MissionListSortField[] = [
  'name',
  'type',
  'pilotName',
  'siteLocation',
  'plannedStart',
  'status',
];

export type MissionListSortOrderUi = 'asc' | 'desc';

export function isMissionListSortField(
  value: string | null,
): value is MissionListSortField {
  return (
    value !== null &&
    (MISSION_LIST_SORT_FIELDS as readonly string[]).includes(value)
  );
}

/** Stable sort for React Query + API from URL params (matches drone registry). */
export function resolveMissionListSort(params: URLSearchParams): {
  sortBy: MissionListSortField;
  sortOrder: 'ASC' | 'DESC';
} {
  const rawSort = params.get('sort');
  const sortBy: MissionListSortField = isMissionListSortField(rawSort)
    ? rawSort
    : 'plannedStart';

  const rawOrder = params.get('order');
  if (rawOrder === 'asc') {
    return { sortBy, sortOrder: 'ASC' };
  }
  if (rawOrder === 'desc') {
    return { sortBy, sortOrder: 'DESC' };
  }

  return {
    sortBy,
    sortOrder: 'ASC',
  };
}

export function missionSortOrderToParam(
  order: 'ASC' | 'DESC',
): MissionListSortOrderUi {
  return order === 'ASC' ? 'asc' : 'desc';
}
