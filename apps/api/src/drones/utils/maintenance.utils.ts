const HOURS_BETWEEN_MAINTENANCE = 50;
const DAYS_BETWEEN_MAINTENANCE = 90;

export const DRONE_SERIAL_NUMBER_REGEX = /^SKY-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function calculateNextMaintenanceDueDate(
  lastMaintenanceDate: Date,
): Date {
  const dueDate = new Date(lastMaintenanceDate);
  dueDate.setUTCDate(dueDate.getUTCDate() + DAYS_BETWEEN_MAINTENANCE);
  return dueDate;
}

export function calculateFlightHoursSinceMaintenance(
  totalFlightHours: number,
  flightHoursAtLastMaintenance: number,
): number {
  return Number((totalFlightHours - flightHoursAtLastMaintenance).toFixed(1));
}

export function isMaintenanceDue(params: {
  totalFlightHours: number;
  flightHoursAtLastMaintenance: number;
  nextMaintenanceDueDate: Date;
  currentDate?: Date;
}) {
  const currentDate = params.currentDate ?? new Date();
  const hoursSinceMaintenance = calculateFlightHoursSinceMaintenance(
    params.totalFlightHours,
    params.flightHoursAtLastMaintenance,
  );

  return (
    hoursSinceMaintenance >= HOURS_BETWEEN_MAINTENANCE ||
    params.nextMaintenanceDueDate.getTime() <= currentDate.getTime()
  );
}

export function isMaintenanceDueWithinDays(
  nextMaintenanceDueDate: Date,
  days: number,
  currentDate = new Date(),
) {
  const threshold = new Date(currentDate);
  threshold.setUTCDate(threshold.getUTCDate() + days);
  return nextMaintenanceDueDate.getTime() <= threshold.getTime();
}
