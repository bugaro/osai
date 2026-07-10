# Architectural Review: Payment Gateway Service

- **Scope**: New Service
- **Classification**: Bounded Context - Core

## Critical Review
1. **Idempotency Key Collision**: The proposed API structure relies on simple timestamps for idempotency, which risks double-charging users during concurrent network retries. We must enforce UUIDv4 keys.
2. **Synchronous REST dependency on Ledger Service**: Making blocking calls to the Ledger during checkout creates a single point of failure. We should decouple using a RabbitMQ outbox queue.
3. **Missing DB Transaction Boundaries**: Writing transaction status to the DB and sending events must be wrapped in a single database transaction, or we risk sending events for failed db writes.

## Infra & Migration Checklist
- [x] Register container in `infrastructure/docker-compose.yml` under `include`.
- [x] Configure DB connection variables (`POSTGRES_DB`, `POSTGRES_USER`).
- [ ] Establish CORS parameters in the API gateway configuration.

## QA Strategy & Test Scenarios
- **Unit/Integration**: Test how the transaction processor behaves when the database queries timeout. Ensure it rolls back state and releases locks.
- **Contract Testing**: Validate HTTP responses return exactly `ApplicationError` payload schemas rather than raw Node errors.
- **E2E/QA Focus & Scenario Outlines**:
  - *Given* a user checkout request with a duplicate `x-idempotency-key` header,
  - *When* sent in rapid succession (< 50ms interval),
  - *Then* the system must return HTTP 409 Conflict for the second request and process the first request exactly once.

## Domain Glossary
- **Payment Transaction**: A financial transfer record.
- **Idempotency Key**: A unique reference header preventing duplicate runs.

## System Components
- **Gateway Interactor**: REST controller.
- **Storage**: PostgreSQL with Transaction Isolation Level Read Committed.
