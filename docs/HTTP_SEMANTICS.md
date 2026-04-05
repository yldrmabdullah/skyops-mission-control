# HTTP status semantics (API)

Conventions for NestJS controllers and filters in this codebase. Align new endpoints with these choices so the SPA and clients behave predictably.

## Success

| Code | Use |
|------|-----|
| **200** | Successful `GET`, `PATCH`, `DELETE` with a body (or empty). |
| **201** | Resource created (`POST` that creates an entity). |

## Client / domain errors

| Code | Use |
|------|-----|
| **400** | Validation failed (`class-validator`), malformed input, or **business rules** that are not about conflicting persisted state. Prefer Nest `BadRequestException` **or** [`DomainException`](../apps/api/src/common/exceptions/domain.exception.ts) subclasses (stable `code` + optional `details`). |
| **401** | Missing or invalid JWT (`UnauthorizedException`). |
| **403** | Authenticated but not allowed for this action (`ForbiddenException`, role guard). |
| **404** | Resource does not exist or is not visible in the current workspace scope (`NotFoundException` or `DomainException` with `HttpStatus.NOT_FOUND`). |
| **409** | Request is valid but **conflicts with current state** (overlapping **active** mission window, duplicate serial, mission that is no longer editable). Prefer `ConflictException` **or** `DomainException` with `HttpStatus.CONFLICT`. |
| **429** | Rate limit (`ThrottlerGuard`). |

## Domain errors (`DomainException`)

Mission and related flows use **typed** `DomainException` subclasses in [`mission-specific.exceptions.ts`](../apps/api/src/missions/exceptions/mission-specific.exceptions.ts) so clients receive a **machine-readable `code`** (e.g. `MISSION_SCHEDULE_OVERLAP`, `MISSION_INVALID_TRANSITION`) alongside `message` and optional `details`.

## Database exclusion (Postgres)

If a row still violates the **exclusion constraint** on overlapping active mission windows (race under extreme load), PostgreSQL raises `23P01`. [`HttpExceptionFilter`](../apps/api/src/common/filters/http-exception.filter.ts) maps that to **409** with `code: MISSION_SCHEDULE_OVERLAP`.

## Notes

- **400 vs 409:** Prefer **409** when another row or state would be violated if the operation succeeded; prefer **400** for “this input / transition is never allowed.”
- **Structured body:** `HttpExceptionFilter` returns `statusCode`, `message`, `timestamp`, `path`, and optional `code` / `details` for `HttpException` subclasses.

## References

- [`http-exception.filter.ts`](../apps/api/src/common/filters/http-exception.filter.ts)
- [`domain.exception.ts`](../apps/api/src/common/exceptions/domain.exception.ts)
