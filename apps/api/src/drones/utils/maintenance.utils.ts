const HOURS_BETWEEN_MAINTENANCE = 50;
const DAYS_BETWEEN_MAINTENANCE = 90;

/** Used to map remaining flight hours to a calendar horizon (case: 50h vs 90d, whichever first). */
const AVG_FLIGHT_HOURS_PER_CALENDAR_DAY = 2.5;

export const DRONE_SERIAL_NUMBER_REGEX = /^SKY-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Calendar-only branch: last maintenance + 90 days. */
export function calculateCalendarMaintenanceDueDate(
  lastMaintenanceDate: Date,
): Date {
  return addDaysUTC(lastMaintenanceDate, DAYS_BETWEEN_MAINTENANCE);
}

/**
 * Next maintenance due instant: the earlier of the 90-day rule and an estimated
 * date when the next 50 flight-hour bucket is reached (from `now`).
 */
export function calculateNextMaintenanceDueDate(
  lastMaintenanceDate: Date,
  totalFlightHours: number,
  flightHoursAtLastMaintenance: number,
  now = new Date(),
): Date {
  const calendarDue = calculateCalendarMaintenanceDueDate(lastMaintenanceDate);
  const hoursSinceMaintenance = calculateFlightHoursSinceMaintenance(
    totalFlightHours,
    flightHoursAtLastMaintenance,
  );

  let hoursBasedDue: Date;
  if (hoursSinceMaintenance >= HOURS_BETWEEN_MAINTENANCE) {
    hoursBasedDue = lastMaintenanceDate;
  } else {
    const remaining = HOURS_BETWEEN_MAINTENANCE - hoursSinceMaintenance;
    const daysToAccumulate = Math.ceil(
      remaining / AVG_FLIGHT_HOURS_PER_CALENDAR_DAY,
    );
    hoursBasedDue = addDaysUTC(now, daysToAccumulate);
  }

  return hoursBasedDue.getTime() <= calendarDue.getTime()
    ? hoursBasedDue
    : calendarDue;
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
