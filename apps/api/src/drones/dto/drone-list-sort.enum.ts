/** Whitelist for `GET /drones` ordering (entity column names). */
export enum DroneListSortField {
  SERIAL_NUMBER = 'serialNumber',
  MODEL = 'model',
  STATUS = 'status',
  TOTAL_FLIGHT_HOURS = 'totalFlightHours',
  NEXT_MAINTENANCE_DUE_DATE = 'nextMaintenanceDueDate',
  REGISTERED_AT = 'registeredAt',
}

export enum DroneListSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
