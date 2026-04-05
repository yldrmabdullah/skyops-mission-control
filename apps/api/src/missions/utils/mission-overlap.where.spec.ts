import { overlapActiveMissionWhere } from './mission-overlap.where';

describe('overlapActiveMissionWhere', () => {
  it('includes only active scheduling statuses in the where clause', () => {
    const start = new Date('2026-06-01T10:00:00.000Z');
    const end = new Date('2026-06-01T12:00:00.000Z');
    const where = overlapActiveMissionWhere('drone-1', start, end);
    expect(where.droneId).toBe('drone-1');
    expect(where.status).toBeDefined();
    expect(where.plannedStart).toBeDefined();
    expect(where.plannedEnd).toBeDefined();
  });

  it('excludes a mission id when provided', () => {
    const where = overlapActiveMissionWhere(
      'drone-1',
      new Date(),
      new Date(),
      'mission-x',
    );
    expect(where.droneId).toBe('drone-1');
    expect(where).toHaveProperty('id');
  });
});
