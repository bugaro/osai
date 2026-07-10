---
name: 07-verify-qa
description: Quality Assurance focused on executing all tests and auditing the observability stack (logs, metrics, tracing) for anomalies.
---

# 🛡️ Quality Assurance & Observability Validation

## ⚠️ Prerequisites: Clean Session / Fork
> [!IMPORTANT]
> **This skill requires a fresh session.**
> To avoid biased execution and context pollution from coding phases, start a new session before running QA checks. Use `/fork qa-session` or start a new chat.

The primary goal of the QA phase is to guarantee that the implementation works correctly under happy/negative scenarios, is robust, and operates cleanly without warnings, errors, or anomalies in the observability telemetry.

## 🎯 Core Objectives
1. **Full-Suite Validation**: Execute all unit/integration tests AND E2E user scenario tests.
2. **Observability Stack Audit**: Actively inspect application logs, Prometheus metrics, and tracing headers to detect unhandled exceptions, memory leaks, missing correlation IDs, or tracing gaps.
3. **Structured Verification Report**: Formally document what was checked, the testing commands, the specific telemetry audited, and the final result.

---

## 🛠️ Execution Workflow

### 1. Test Suite Execution
- **Unit/Integration Tests**: Run the test commands (e.g. `npm run test:unit`, `npm run test:integration`).
- **E2E Tests**: Ensure the local/containerized stack is up, and run the E2E suite (e.g. `npm run test:e2e`).
- All tests must pass with 100% success rate.

### 2. Observability & Telemetry Audit
While or immediately after running the tests and invoking the endpoints, you MUST perform a deep telemetry inspection:

#### A. Structured Log Audit (Pino / stdout)
- Inspect the output logs generated during execution.
- **Search for Errors & Warnings**: Check for Pino log entries with `level` >= 40 (`WARN` or `ERROR`). Check for any uncaught exceptions, promise rejections, or database connection warnings.
- **Trace Context Validation**: Verify that every log statement related to a specific transaction has the correct `correlationId` or `traceId` property. Ensure no logs have empty or missing context IDs.

#### B. Metrics Audit (Prometheus / `/metrics`)
- Perform a HTTP request to `/metrics` (or read metrics output).
- Verify that Prometheus formatted metrics are returned.
- Check that standard request counters (e.g. request count, error count) and histograms (e.g. duration) exist, have correct labels (`method`, `route`, `status_code`), and accurately incremented during test runs.

#### C. Tracing Audit (OpenTelemetry)
- Check that trace headers (`x-correlation-id` or standard `traceparent`) are successfully received and forwarded by all internal microservices.

### 3. Compiler & Clean Code Verification
- Run `npx tsc --noEmit` inside the service directories. Zero type errors allowed.
- Ensure no raw error objects are thrown (must use DomainError subclasses).

### 4. Final Reporting (The "Explain" Step)
Your validation report MUST contain a **Validation Summary** section covering:
- **Tests Executed**: Commands run and their outcome.
- **Logs Audited**: Specific errors, warnings, or exceptions searched for, and confirm whether Pino JSON logs carried the required correlation IDs.
- **Metrics Audited**: Confirm GET `/metrics` response validity and metric updates.
- **Anomalies Checked**: List any anomalies or confirm system is clean.

---

## 📦 Completion Protocol

At the very end of your final report, output a JSON block indicating the status. The orchestrator uses this to transition issues:

If the implementation **PASSES**:
```json
{
  "status": "PASSED"
}
```

If the implementation **FAILS**:
```json
{
  "status": "FAILED",
  "reason": "Detailed explanation of failures, missing test coverages, or observability anomalies (e.g., WARN/ERROR log levels detected, correlation ID propagation gap, missing Prometheus metrics)."
}
```

## Limitations & Safeguards
- **Zero Log Tolerance**: The QA phase MUST fail if any Pino logs contain levels >= 40 (`WARN`/`ERROR`).
- **Telemetry Health Checks**: You are strictly prohibited from passing verification if the `/metrics` endpoint is unreachable or returns malformed data (invalid Prometheus format).

## Pipeline Transition
- To run verification, execute `node .agents/scripts/sdlc.js qa-run` from the workspace root. This will automatically execute tests, audit stdout logs, check metrics, and update the pipeline state (transitioning to finalize-release on pass, or fix-bugs on fail).