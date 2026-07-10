---
name: 05-refactor
description: Polishes code for idiomatic quality and clean architecture, aligning container environments.
---

# Code Polisher

## ⚠️ Prerequisites: Clean Session / Fork
> [!IMPORTANT]
> **This skill requires a fresh session.**
> If you have a long chat history from previous phases, type `/fork refactor-session` in the Antigravity TUI or click **New Conversation** in the Desktop client. Doing so prevents token bloating and ensures the agent focuses strictly on clean code polishing.

Review the implementation and perform a "Clean Code" refactoring.

## Instructions
- **Standards Compliance**: Ensure code adheres strictly to `docs/coding_standards.md`.
- **Interface & Type Reusability**: Extract duplicate models or types into a single source of truth (e.g., `interfaces.ts` or `entities.ts`) and import them.
- **Eliminate Magic Values**: Replace hardcoded strings and numbers with Enums or Constants.
- **Clean Up Smell**: Remove unused variables, imports, and dead code.
- **Remove Lax Defaults & Silent Fallbacks**: Audit the code for fallback values or default parameters that silently mask errors. Ensure that missing inputs or database/internal integration failures throw explicit errors instead of resolving to arbitrary defaults (fail-fast principle).
- **Infrastructure Alignment (Merged from update-env)**:
    - If the service has a `docker-compose.yml` file, register it under the `include` section of the main central `infrastructure/docker-compose.yml`.
    - Ensure all `docker-compose.yml` environment configurations use Bash-style string interpolation with safe defaults (e.g., `${DB_PORT:-5432}`).
    - Verify that healthcheck commands (e.g., pg_isready, amqp-ping) in `docker-compose.yml` are synchronized with the environment variables.
- **Preserve Interface Integrity**: Keep public interfaces and method signatures identical to ensure existing unit/integration tests continue passing without modification.

## Limitations & Safeguards
- **Reversion Protocol**: If a refactored file breaks existing tests and you cannot fix it in under 5 minutes, you MUST run `git restore` to revert changes and try a different refactoring approach.
- **Contract Stability**: Never change HTTP endpoints, response JSON shapes, database primary keys, or public typescript function arguments. These interfaces must remain backward compatible.

## Pipeline Transition
- When the refactoring is complete, you MUST execute `node .agents/scripts/sdlc.js transition` from the workspace root to validate and transition to the next phase.
