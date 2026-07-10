---
status: draft
---

# PRD: User Registration & Verification Feature

## Overview & Success Metrics
Enable secure registration of users with mandatory verification emails.
- **Tech KPI**: 100% email event deliveries, registration API latency $\le 200ms$ (95th percentile).

## Technical Constraints & Domain Modeling
- **Interactions**: User Service calls Email Service (async via RabbitMQ).
- **Core Domain**:
  - `User` Aggregate Root with properties `id`, `email`, `status: pending | verified`, and method `verify()`.
  - `UserRegistered` Domain Event.
- **Application Layer**:
  - `RegisterUserUseCase` (Input: `Email`, `Password` DTOs).
- **Database Schema (PostgreSQL)**:
  - Table `users` (id UUID PRIMARY KEY, email VARCHAR UNIQUE, password_hash VARCHAR, verified BOOLEAN).
- **TDD Target Scope**:
  - `User` Aggregate invariant rules (e.g. invalid emails, state shifts).
  - `RegisterUserUseCase` dependencies and outbox event publishing triggers.

## Traceability & Observability
- All operations must propagate `correlationId` via `AsyncLocalStorage`.
- Increment `user_registration_total` metric on success, and `user_registration_failed_total` labeled by error types.

## Acceptance Criteria
- **Happy Path**: Register creates user in DB, publishes event, email is sent.
- **Negative Scenario**: Submitting a duplicate email returns `ConflictError` (HTTP 409).
- **E2E Scenarios**:
  - *Given* a new email `test@domain.com`,
  - *When* POST `/api/v1/users/register` is called,
  - *Then* DB has user with `status: pending`, and RabbitMQ receives a `UserRegistered` event carrying the registration `correlationId`.

## TASK_LIST
- `TASK: user-service/src/domain/user.ts | Define User aggregate and tests | Must throw ValidationError on empty domain | TDD: Yes | E2E: No`
- `TASK: user-service/tests/e2e/register_e2e_test.ts | E2E integration test | Run request and check DB state | TDD: No | E2E: Yes`
