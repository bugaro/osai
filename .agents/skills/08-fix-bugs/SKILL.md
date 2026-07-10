---
name: 08-fix-bugs
description: High-quality bug fixing based on QA failure reports, verifying against unit, integration, E2E, and observability.
---

# 🛠️ Bug Fixing Skill

This skill is designed to ingest failure reports from the QA phase, systematically reproduce the bugs, apply target fixes, and verify them using the entire testing and observability harness.

## 🎯 Objectives
- **Precision Resolution**: Resolve all issues, compilation errors, and observability warnings listed in the QA report.
- **TDD & E2E Verification**: Confirm the fix passes unit/integration tests and does not break E2E user journeys.
- **Observability Audit**: Ensure the fix resolves any log warnings, errors, or metric anomalies without introducing new ones.

---

## 🛠️ Execution Workflow

### 1. Diagnosis & Reproduction
- **Audit**: Analyze the original issue, the `BUG-*.md` report, and the specific failure reason provided in the QA status.
- **Reproduction**: Run the corresponding test suite (unit, integration, or E2E) to replicate the failure locally.
- **Observability Trace**: Check the stdout logs or tracing parameters to identify the root cause of the error.

### 2. Targeted Implementation
- **Minimal Clean Fix**: Apply the correction adhering to `docs/coding_standards.md` (no `any`, strict type narrowings, DomainError subclasses).
- **No Side Effects**: Focus on the specific failure. Avoid refactoring unrelated code during the fix phase.

### 3. Comprehensive Verification
- **Test Executions**: Run all affected tests:
  - Unit & Integration tests (`npm run test:unit`, `npm run test:integration`).
  - E2E tests (`npm run test:e2e`).
- **Observability Sweep**: Verify stdout logs for zero errors/warnings (`level` >= 40) and verify that the `/metrics` endpoint functions correctly.
- **TypeScript Check**: Execute `npx tsc --noEmit`. No compilation warnings or type errors allowed.

### 4. Status Update
- **Bug Finalization**: Prepend `[FIXED] ` to the title inside the `BUG-*.md` file.
- **Task Transition**: Change the task status (e.g., `status: todo` or `status: failed`) to `status: staged` in the PRD file's task list.
- **Reporting**: Detail the fix applied, tests run, and log audit confirmation.

---

## 📦 Completion Protocol

When the fix is **READY**:
1. Output "FIXED" clearly at the end of your report.
2. Signal that the task is ready for a second QA pass.

## Limitations & Safeguards
- **Strict Scope Limit**: You are forbidden from modifying files unrelated to the reported bug. Refactoring of surrounding code is prohibited.
- **Double Audit on fix**: After writing a fix, you must verify it passes all unit, integration, and E2E tests, and scan the stdout logs to confirm no new warnings/errors are introduced.

## Pipeline Transition
- When the bugs are fixed and the local tests are verified, execute `node .agents/scripts/sdlc.js qa-run` from the workspace root to re-run the QA validation loop.
