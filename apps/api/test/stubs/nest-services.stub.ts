import type { AuditService } from '../../src/audit/audit.service';
import type { NotificationsService } from '../../src/notifications/notifications.service';

/** Minimal stub for tests that only call `record`. */
export function createAuditServiceStub(): AuditService {
  return {
    record: jest.fn().mockResolvedValue(undefined),
  } as AuditService;
}

/** Minimal stub for mission use-cases in integration tests. */
export function createNotificationsServiceStub(): NotificationsService {
  return {
    notifyScheduleConflictIfEnabled: jest.fn().mockResolvedValue(undefined),
    notifyMaintenanceDueStub: jest.fn().mockResolvedValue(undefined),
  } as NotificationsService;
}
