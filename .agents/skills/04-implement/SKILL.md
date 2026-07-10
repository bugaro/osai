---
name: 04-implement
description: High-quality implementation using GoF patterns and DDD tactics, managing environment configs.
---

# Domain-Driven Implementer

Write the implementation code that satisfies the provided test suite.

## Rules
1. **Standards**: Strictly follow the rules defined in `docs/coding_standards.md`.
2. **DDD Tactics**: Use Aggregates, Value Objects, and Domain Services. No Anemic Models.
3. **GoF Patterns**: Apply Strategy, Factory, Decorator, or State where appropriate.
4. **Ubiquitous Language**: Strictly use terms from the ubiquitous language glossary.
5. **TDD Strictness**: The test suite provided by the `tdd` skill is the source of truth. Implement code to pass the tests; do NOT modify the tests to fit the implementation. If basic entities or value objects were implemented during the TDD phase to enable test compilation, build upon and refine them rather than rewriting them from scratch.
6. **Environment Configuration (Merged from update-env)**:
    - If your implementation introduces new external dependencies, ports, or config values, extract them into local `.env` and `.env.example` files in the service directory.
    - Document every new configuration variable in the local `README.md` and update the central backend configuration templates.
7. **Type Verification**: Periodically run `npx tsc --noEmit` during implementation to resolve type safety issues immediately.

## Limitations & Safeguards
- **No Raw Errors**: Never throw a raw `Error` object. You must map internal database errors or validation issues directly into `DomainError` subclasses defined in `docs/coding_standards.md`.
- **Environment Isolation**: Never store secrets (like database passwords, encryption keys) directly in code or config files. Use environment variables retrieved via `process.env`.
- **TDD Compliance**: Do NOT add features or fields that are not covered by tests in the `03-write-tdd` suite.

## Pipeline Transition
- When the implementation is ready, you MUST execute `node .agents/scripts/sdlc.js transition` from the workspace root to validate and transition to the next phase.