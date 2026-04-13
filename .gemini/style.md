# SkyOps Mission Control — AI Style Guide

> Master rules file. All AI assistants MUST follow these conventions when working on this codebase.

## Project Overview

TypeScript monorepo: **NestJS REST API** (`apps/api`) + **React Vite SPA** (`apps/web`) + **PostgreSQL**.
Package manager: **pnpm 10.x** workspaces. Node **≥ 22**.

## Golden Rules

1. **Never use `synchronize: true`** in TypeORM config (except tests). Always create migrations.
2. **Never bypass the repository interface.** Services depend on `IDronesRepository`, not `Repository<Drone>`.
3. **Never store secrets in code.** Use `.env` files and `ConfigModule`.
4. **Always validate at the API boundary.** DTOs use `class-validator` + `class-transformer`.
5. **Always scope data to workspace.** Every query must filter by `fleetOwnerId` from `WorkspaceContext`.
6. **Never return raw entity relations unfiltered.** Strip sensitive data based on role (e.g., pilots don't see maintenance logs).
7. **Preserve existing comments and docstrings** unless directly related to your change.
8. **Run `pnpm lint` before considering any change complete.**

## File Organization

```
apps/api/src/
  {module}/
    entities/          # TypeORM entities + enums
    dto/               # class-validator request DTOs
    repositories/      # abstract interface + TypeORM implementation
    use-cases/         # single-responsibility command handlers (missions only)
    utils/             # pure functions for business rules + their .spec.ts
    exceptions/        # DomainException subclasses (if module-specific)
    {module}.controller.ts
    {module}.controller.spec.ts
    {module}.service.ts
    {module}.service.spec.ts
    {module}.module.ts

apps/web/src/
  pages/               # route-level page components
  features/{domain}/   # feature-specific components, hooks, utils
  components/          # shared UI components
  hooks/               # shared custom hooks
  lib/api/             # axios client, request functions, session, errors
  auth/                # AuthProvider, RequireAuth, context
  types/domains/       # per-domain TypeScript interfaces
```

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Entity class | PascalCase, singular | `Drone`, `Mission` |
| Entity file | kebab-case + `.entity.ts` | `drone.entity.ts` |
| DTO class | PascalCase + purpose | `CreateDroneDto`, `ListDronesQueryDto` |
| Service | PascalCase + `Service` | `DronesService` |
| Use-case | PascalCase + `UseCase` | `TransitionMissionUseCase` |
| Repository interface | `I` + PascalCase + `Repository` | `IDronesRepository` |
| Repository implementation | `TypeOrm` + PascalCase + `Repository` | `TypeOrmDronesRepository` |
| Guard | PascalCase + `Guard` | `RolesGuard` |
| Decorator | PascalCase function | `@CurrentUser()`, `@Roles()`, `@Audit()` |
| Test file | Same name + `.spec.ts` | `drones.service.spec.ts` |
| Migration | Timestamp + PascalCase description | `1741000000000-OperatorWorkspaceEnhancements.ts` |
| Frontend page | PascalCase + `Page` | `DashboardPage.tsx`, `DronesPage.tsx` |
| Frontend feature dir | kebab-case domain name | `features/dashboard/`, `features/missions/` |
| React hook | `use-` prefix, kebab-case file | `use-api-error-handler.ts` |
| API request file | kebab-case domain + `-requests.ts` | `drones-requests.ts` |
| CSS | Single `index.css` with BEM-inspired classes | `.card`, `.card--header` |

## Commit Message Format

```
type(scope): short description

- Detail 1
- Detail 2
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
Scopes: `core`, `api`, `web`, `missions`, `drones`, `maintenance`, `auth`

## Branch Strategy

- `dev` — integration branch
- `master` — production
- `feature/*`, `fix/*`, `chore/*` — branch from `dev`, PR back to `dev`
