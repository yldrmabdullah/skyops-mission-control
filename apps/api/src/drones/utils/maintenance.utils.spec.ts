import {
  DRONE_SERIAL_NUMBER_REGEX,
  calculateFlightHoursSinceMaintenance,
  calculateNextMaintenanceDueDate,
  isMaintenanceDue,
} from './maintenance.utils';

describe('maintenance utils', () => {
  it('calculates the next maintenance due date 90 days after the last maintenance', () => {
    const lastMaintenanceDate = new Date('2026-01-01T00:00:00.000Z');

    expect(
      calculateNextMaintenanceDueDate(lastMaintenanceDate).toISOString(),
    ).toBe('2026-04-01T00:00:00.000Z');
  });

  it('calculates flight hours since maintenance with one decimal precision', () => {
    expect(calculateFlightHoursSinceMaintenance(102.4, 80.1)).toBe(22.3);
  });

  it('marks maintenance as due when the flight hour threshold is reached', () => {
    expect(
      isMaintenanceDue({
        totalFlightHours: 150,
        flightHoursAtLastMaintenance: 100,
        nextMaintenanceDueDate: new Date('2026-12-01T00:00:00.000Z'),
        currentDate: new Date('2026-04-01T00:00:00.000Z'),
      }),
    ).toBe(true);
  });

  it('marks maintenance as due when the calendar threshold is reached', () => {
    expect(
      isMaintenanceDue({
        totalFlightHours: 120,
        flightHoursAtLastMaintenance: 90,
        nextMaintenanceDueDate: new Date('2026-03-01T00:00:00.000Z'),
        currentDate: new Date('2026-04-01T00:00:00.000Z'),
      }),
    ).toBe(true);
  });

  it('keeps the serial number regex strict and uppercase', () => {
    expect(DRONE_SERIAL_NUMBER_REGEX.test('SKY-A1B2-C3D4')).toBe(true);
    expect(DRONE_SERIAL_NUMBER_REGEX.test('sky-a1b2-c3d4')).toBe(false);
  });
});
