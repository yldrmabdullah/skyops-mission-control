# Senior Refactoring Implementation Plan: SkyOps Mission Control

This plan outlines the steps to elevate the current codebase to a high-scale, production-ready "Senior" architecture. We will focus on clean code, decoupling, and maintainability.

## 🟢 Phase 1: Global Workspace Context (Foundation)
**Goal:** Eliminate `fleetOwnerId` parameter drilling across the entire service layer.

1.  **Create `WorkspaceContext` Provider**:
    - [x] Define a request-scoped provider in `apps/api/src/common`.
    - [x] Implement a `WorkspaceContextInterceptor` to extract the `ownerId` from the JWT and inject it into the context.
2.  **Refactor Context Injection**:
    - [x] Update `MissionsService` and `DronesService` to inject `WorkspaceContext`.
    - [x] Remove `fleetOwnerId` parameter from internal and external method signatures.

## 🟡 Phase 2: Automated Auditing (Boilerplate Reduction)
**Goal:** Remove manual `auditService.record()` calls using a declarative approach.

1.  **Implement `@Audit()` Decorator**:
    - [x] Create a custom decorator in `apps/api/src/audit/decorators`.
2.  **Create `AuditInterceptor`**:
    - [x] Implement an interceptor that listens for methods decorated with `@Audit()`.
    - [x] Capture return values or parameters automatically to record the audit trail.
3.  **Cleanup Services**:
    - [x] Replace manual audit calls in `MissionsService`, `DronesService`, etc., with the new decorator.

## 🟠 Phase 3: Repository Pattern (Infrastructure Decoupling)
**Goal:** Decouple domain logic from TypeORM specifics.

1.  **Define Repository Interfaces**:
    - [x] Create `IDroneRepository`, `IMissionRepository`, `IMaintenanceRepository` in a dedicated `domain` folder or within modules.
2.  **Implement TypeORM Repositories**:
    - [x] Create concrete implementations in `infrastructure` or `database` folders.
3.  **Dependency Injection Update**:
    - [x] Register types for interfaces in NestJS modules.
    - [x] Refactor services to depend on interfaces rather than `@InjectRepository(Entity)`.

## 🔴 Phase 4: Service Decomposition (Scalability)
**Goal:** Break down the 500+ line `MissionsService` into manageable "Use Cases."

1.  **Introduce Use Case Pattern**:
    - [x] Create `apps/api/src/missions/use-cases` directory.
    - [x] Implement `CreateMissionUseCase`, `SubmitMaintenanceUseCase`, `TransitionMissionUseCase`.
2.  **Refactor Mission Transitions**:
    - [x] Extract transition-specific logic (`persistInProgressMission`, `persistCompletedMission`) into dedicated handlers.
3.  **Thin the Service**:
    - [x] Turn `MissionsService` into a thin facade that delegates to specific Use Cases or remove it in favor of direct Use Case injection in Controllers.

## 🔵 Phase 5: Domain Logic & Frontend Polish
**Goal:** Finalize the "Clean Architecture" by pushing logic into Entities.

1.  **Rich Domain Models**:
    - [x] Move date validation and state transition rules directly into the `Mission` and `Drone` entities (Active Record-ish or Domain Model approach).
2.  **Frontend State Consistency**:
    - [x] Implement a unified error handling hook for React Query to match the new API structure.
    - [x] (Optional) Introduce a lightweight state manager (e.g., Zustand) for complex multi-step forms if needed.

---

**NOT:** Bu işlem sırasında mevcut testlerin bozulmaması için adım adım ilerlenecektir.
