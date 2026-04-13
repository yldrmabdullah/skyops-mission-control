# Backend Architecture Rules

## Module Structure

Every NestJS domain module follows this layered pattern:

```
Controller → Service / UseCase → Repository Interface → TypeORM Implementation
```

### Controller Layer
- Thin controllers. No business logic — delegate everything to service/use-case.
- Use `@ParseUUIDPipe` for all `:id` params.
- Use `@Query()` with a DTO class for list endpoints (pagination, filters, sort).
- Use `@Body()` with a validated DTO for create/update.
- Apply `@Roles()` + `@UseGuards(RolesGuard)` for role-restricted endpoints.
- Always add `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth` Swagger decorators.

```typescript
// ✅ Correct pattern
@Post()
@UseGuards(RolesGuard)
@Roles(OperatorRole.MANAGER)
create(@Body() dto: CreateDroneDto) {
  return this.dronesService.create(dto);
}

// ❌ Wrong — business logic in controller
@Post()
create(@Body() dto: CreateDroneDto) {
  if (dto.status === 'RETIRED') throw new Error('...');  // NO!
  return this.repo.save(dto);  // NO!
}
```

### Service / Use-Case Layer
- Services own business logic and orchestration.
- For complex domains (missions), decompose into **Use-Case classes** (one per operation).
- Read workspace scope from `WorkspaceContext`, NOT from method parameters.
- Use `@Audit()` decorator for operations that need audit trail logging.
- Use **guard functions** from `utils/` for domain rule enforcement (e.g., `assertDroneCanBeRetired`).
- Wrap multi-entity saves in **transactions**: `this.dataSource.transaction(async (manager) => { ... })`.

### Repository Layer
- **Always** define an abstract class interface in `repositories/{name}.repository.interface.ts`.
- Provide `TypeOrm` implementation that extends the abstract class.
- Wire in the module with `{ provide: IXxxRepository, useClass: TypeOrmXxxRepository }`.
- For shared entity access across modules, use a **persistence module** (see `DronePersistenceModule`).

```typescript
// Interface — used as DI token
export abstract class IDronesRepository {
  abstract findOne(id: string, ownerId: string): Promise<Drone | null>;
  abstract save(drone: Drone): Promise<Drone>;
  // ...
}

// Module wiring
{
  provide: IDronesRepository,
  useClass: TypeOrmDronesRepository,
}
```

## DTO & Validation Rules

- All DTOs use `class-validator` decorators.
- **Always** add `@Transform(trim)` for string fields.
- **Always** add `@MinLength(1)` for required string fields (prevents whitespace-only).
- **Always** add `@Max()` for numeric fields that have business-meaningful upper bounds.
- Use `@IsDateString()` for date inputs, then parse with `parseIsoDateOrThrow()` in the service.
- Use `@IsEnum()` for enum fields — never accept raw strings.
- Use `@IsOptional()` + `@IsXxx()` for optional fields.
- Use `@Type(() => Number)` with `@IsNumber()` for numeric query params.

```typescript
// ✅ Correct DTO field
@Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
@IsString()
@MinLength(1)
@MaxLength(120)
name!: string;
```

## Error Handling

- Use `DomainException` (extends `HttpException`) for business rule violations.
- Each module can define specific exceptions in `exceptions/` directory.
- Include a `code` string (e.g., `'MISSION_OVERLAP'`) and `details` object for machine-readable errors.
- The global `HttpExceptionFilter` normalizes all responses to a standard shape.
- **Never** throw raw `Error` — always use NestJS/Domain exceptions.
- **Never** catch and swallow errors silently in services (except fire-and-forget like audit/notifications).

```typescript
// ✅ Domain exception with error code
export class MissionOverlapException extends DomainException {
  constructor(droneId: string) {
    super('Drone already has a scheduled mission', 'MISSION_OVERLAP', 400, { droneId });
  }
}

// ❌ Generic — frontend can't distinguish error type
throw new BadRequestException('Something went wrong');
```

## Multi-Tenancy & Workspace Isolation

- `WorkspaceContext` is request-scoped — set by the JWT guard interceptor on every authenticated request.
- **Every** database query MUST include `fleetOwnerId` filter.
- Manager's `workspaceOwnerId` is `null` (they ARE the workspace owner).
- Invited users (Pilot/Technician) have `workspaceOwnerId = managerId`.
- `fleetOwnerId` resolves to: `user.workspaceOwnerId ?? user.id`.

## Entity Design

- Entities may contain domain logic methods (Rich Domain Model):
  - `drone.isMaintenanceDue()` — pure business rule check
  - `mission.assertCanTransitionTo(nextStatus)` — validation that throws
- Keep entity methods **pure** (no DB calls) — they use entity fields only.
- Use `numericTransformer` for PostgreSQL `numeric` columns to get JS numbers (not strings).
- Enum values use `SCREAMING_SNAKE_CASE`.

## Database Migrations

- Create migrations with: `pnpm --filter @skyops/api typeorm migration:generate -d src/database/data-source.ts src/database/migrations/TIMESTAMP-Description`
- **Never** use `synchronize: true` in production or staging.
- Migration names: `{timestamp}-{PascalCaseDescription}.ts`
- Test migrations run in CI.

## Business Rules — Key Thresholds

These constants are defined in `drones/utils/maintenance.utils.ts`:
- `HOURS_BETWEEN_MAINTENANCE = 50`
- `DAYS_BETWEEN_MAINTENANCE = 90`
- `AVG_FLIGHT_HOURS_PER_CALENDAR_DAY = 2.5`
- Watchlist horizon: **7 days**
- Flight-hour tolerance for maintenance log: **0.5 hours**

Mission state machine is defined in `missions/entities/mission.entity.ts`:
```
PLANNED → [PRE_FLIGHT_CHECK, ABORTED]
PRE_FLIGHT_CHECK → [IN_PROGRESS, ABORTED]
IN_PROGRESS → [COMPLETED, ABORTED]
COMPLETED → [] (terminal)
ABORTED → [] (terminal)
```

## Cross-Cutting Concerns

| Concern | Implementation |
|---------|---------------|
| Auth | Global `JwtAuthGuard` (APP_GUARD) |
| Roles | Global `RolesGuard` (APP_GUARD) + `@Roles()` decorator |
| Rate limit | Global `ThrottlerGuard` (APP_GUARD), 120 req/min |
| Audit | `@Audit()` decorator + `AuditInterceptor` (AOP) |
| Validation | Global `ValidationPipe` (whitelist + forbidNonWhitelisted) |
| Error format | Global `HttpExceptionFilter` |
| Security | `helmet` middleware |
| CORS | `parseCorsOrigins()` from `CORS_ORIGIN` env |
