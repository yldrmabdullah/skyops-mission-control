/** Whitelist for `GET /missions` ordering (entity column names). */
export enum MissionListSortField {
  NAME = 'name',
  TYPE = 'type',
  PILOT_NAME = 'pilotName',
  SITE_LOCATION = 'siteLocation',
  PLANNED_START = 'plannedStart',
  STATUS = 'status',
}

export enum MissionListSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
