# 🛰️ SkyOps Mission Control — Architectural & Design Decisions

This document outlines the technical architecture, design patterns, and engineering choices made in the project from a senior perspective.

## 🏛️ Architectural Layers

The application is designed using a layered architecture inspired by **Clean Architecture** principles:

1.  **Controllers (Web/API Layer)**: Handles HTTP concerns only (Routing, Request Validation, Response Formatting). Contains zero business logic.
2.  **Use Cases (Application Layer)**: Represents specific business workflows (e.g., `CancelMissionUseCase`). Orchestrates communication between services and repositories.
3.  **Services (Domain Layer)**: The heart of the application. Implements core business rules (e.g., `MaintenanceService`).
4.  **Repositories (Persistence Layer)**: Abstract data access. The application depends on interfaces (`IDronesRepository`) rather than direct database implementations.

## 🛠️ Key Design Decisions

### 1. Repository Pattern & Abstraction
- **Problem Solved**: Tight coupling between business logic and the database (TypeORM/Postgres).
- **Senior Approach**: Defined abstract interfaces like `INotificationsRepository`. This allows for easy mocking in unit tests and ensures the core logic remains unchanged if we migrate to a different ORM or database.

### 2. Domain-Specific Exceptions
- **Problem Solved**: Generic "400 Bad Request" errors lack semantic meaning for the client.
- **Senior Approach**: Implemented custom exception classes like `DroneInMissionException` and `FlightHourMismatchException`. These provide clear error codes (`ErrorCode`) and metadata, enabling the frontend to provide rich, contextual feedback.

### 3. Multi-Tenancy & Data Isolation (`WorkspaceContext`)
- **Problem Solved**: Ensuring data from different fleet owners never leaks between sessions.
- **Senior Approach**: Built a request-scoped `WorkspaceContext`. It automatically injects the `fleetOwnerId` from the authenticated token. This centralizes data isolation instead of manually filtering by `ownerId` in every query.

### 4. Automated State Management (FSM Lite)
- **Problem Solved**: Potential inconsistencies when manually updating drone statuses (AVAILABLE, MAINTENANCE, IN_MISSION).
- **Senior Approach**: Drone statuses are resolved automatically through pure utility functions (`resolveDroneStatusAfterMaintenance`) triggered by significant domain events (e.g., logging a maintenance completion).

## 🧪 Testing Strategy

- **Unit Tests**: Focus on isolated business logic. Thanks to the mock repository pattern, these are I/O independent and extremely fast.
- **Integration Tests (pg-mem)**: Validates full business lifecycles (`full-lifecycle.e2e-spec.ts`) using an in-memory Postgres implementation, avoiding external database dependencies.
- **Linting & Quality**: ESLint and Prettier rules are enforced to maintain code consistency at a CI/CD level.

## 🚀 Future Roadmap (Scalability)

- **Event-Driven Architecture**: Moving side effects like notifications to an asynchronous model (Outbox Pattern) using Redis/RabbitMQ.
- **Microservices Ready**: The modular structure is prepared to be split into independent services (Missions Service, Fleet Service) as the load grows.
