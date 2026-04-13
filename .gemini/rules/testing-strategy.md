# Testing Strategy Rules

## Test Pyramid

This project uses a 3-tier testing strategy:

| Tier | Tool | Location | Purpose |
|------|------|----------|---------|
| **Unit** | Jest | `*.spec.ts` next to source | Service logic, utilities, pure functions |
| **Integration** | Jest + pg-mem | `apps/api/test/*.e2e-spec.ts` | Multi-service flows with in-memory DB |
| **E2E** | Playwright | `apps/web/e2e/*.spec.ts` | Full browser user flows |

## Unit Tests

### Service Tests — Mock Pattern

Services inject abstract repository interfaces. In tests, provide mock implementations:

```typescript
const module: TestingModule = await Test.createTestingModule({
  providers: [
    DronesService,
    {
      provide: IDronesRepository,    // ← abstract class as DI token
      useValue: {
        findOne: jest.fn(),
        findBySerialNumber: jest.fn(),
        findAll: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
      },
    },
    {
      provide: WorkspaceContext,
      useValue: { fleetOwnerId: 'user-1', userId: 'user-1' },
    },
    {
      provide: AuditService,
      useValue: { record: jest.fn().mockResolvedValue({}) },
    },
  ],
}).compile();
```

### Key Patterns

- **Mock WorkspaceContext** — provide `fleetOwnerId` and `userId` as plain values.
- **Mock AuditService** — use `jest.fn().mockResolvedValue({})` for `record()`.
- **Mock NotificationsService** — use `jest.fn().mockResolvedValue(undefined)` for all methods.
- **Entity methods** — when the entity has methods like `isMaintenanceDue()`, mock them on the test object:
  ```typescript
  const mockDrone = {
    ...droneData,
    isMaintenanceDue: jest.fn().mockReturnValue(false),
  } as unknown as Drone;
  ```
- **Test edge cases first** — maintenance overdue, status transitions, role access.
- **Don't use `as any`** — use `as unknown as Type` or create typed interface for private methods:
  ```typescript
  interface ServicePrivate {
    assertNoOverlap(...): Promise<void>;
  }
  const privateSvc = service as unknown as ServicePrivate;
  ```

### Utility / Pure Function Tests

Test files live next to the utility file: `maintenance.utils.spec.ts` beside `maintenance.utils.ts`.

```typescript
describe('maintenance utils', () => {
  it('calculates the calendar maintenance due date 90 days after', () => {
    const lastMaintDate = new Date('2026-01-01T00:00:00.000Z');
    expect(
      calculateCalendarMaintenanceDueDate(lastMaintDate).toISOString(),
    ).toBe('2026-04-01T00:00:00.000Z');
  });
});
```

- Use **deterministic dates** (explicit ISO strings) — never `new Date()` in assertions.
- Test **boundary conditions**: exactly at 50h, at 49.9h, at 50.1h.
- Test **serial number regex**: valid format, lowercase rejection, partial matches.

## Integration Tests

### pg-mem Pattern

Integration tests use `pg-mem` for an in-memory PostgreSQL that supports TypeORM:

```typescript
import { newDb, DataType } from 'pg-mem';

const database = newDb({ autoCreateForeignKeyIndices: true });

// Register required PostgreSQL functions
database.public.registerFunction({
  name: 'uuid_generate_v4',
  returns: DataType.uuid,
  implementation: () => randomUUID(),
  impure: true,
});

// Create TypeORM DataSource
const dataSource = await database.adapters.createTypeormDataSource({
  type: 'postgres',
  entities: [User, Drone, Mission, MaintenanceLog],
  synchronize: true,  // OK for tests only!
});
await dataSource.initialize();
```

### What to Test

Integration tests validate **cross-module business flows**:

```
Drone create (49h) → Mission create → Transition PLANNED→PRE_FLIGHT→IN_PROGRESS→COMPLETED (+2h)
→ Assert: drone.totalFlightHours === 51, drone.status === MAINTENANCE
```

- Wire real services with real repositories (TypeORM on pg-mem).
- Mock only side-effect services (audit, notifications) — not core domain.
- Clean up: `await dataSource.destroy()` in `afterEach`.

## Frontend E2E Tests (Playwright)

### Configuration

- Playwright config: `apps/web/playwright.config.ts`
- Starts API via `scripts/start-e2e-api.sh` and web preview via `scripts/start-e2e-web.sh`.
- Uses a dedicated e2e user (`e2e@skyops.test` / `E2eTestPass1`) created by the API startup script.

### Test Pattern

```typescript
test('creates a drone, schedules a mission, transitions it', async ({ page }) => {
  const uniqueSerial = `SKY-E${Date.now().toString().slice(-3)}-A1B2`;

  // 1. Sign in
  await page.goto('/sign-in');
  await page.getByTestId('signin-email-input').fill('e2e@skyops.test');
  await page.getByTestId('signin-password-input').fill('E2eTestPass1');
  await page.getByTestId('signin-submit').click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // 2. Create drone
  await page.goto('/drones');
  await page.getByTestId('drone-serial-input').fill(uniqueSerial);
  // ...
});
```

### Rules

- Use `data-testid` attributes for reliable selectors — never CSS classes.
- Generate unique values per test run (timestamps in serial numbers, mission names).
- Assert **toast messages** for user-visible feedback.
- Assert **URL changes** after navigation actions.
- Assert **table content** for state verification.

## When to Write Tests

| Change Type | Required Tests |
|-------------|---------------|
| New utility function | Unit test in same directory |
| New service method | Service spec with mocked repository |
| New DTO validation rule | Covered by existing ValidationPipe tests or add edge case |
| New endpoint | Controller spec (delegation check) |
| Business rule change | Both unit test for the rule AND integration test for the flow |
| State machine change | Transition utils spec + integration lifecycle test |
| Bug fix | Regression test that reproduces the bug first |

## Running Tests

```bash
# Backend unit tests
pnpm --filter @skyops/api exec jest --runInBand

# Backend integration tests
pnpm --filter @skyops/api exec jest --config ./test/jest-e2e.json --runInBand

# Frontend E2E
pnpm --filter @skyops/web test:e2e

# All lint
pnpm lint
```
