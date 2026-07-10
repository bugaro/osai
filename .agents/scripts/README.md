# SDLC Pipeline Orchestration Scripts

This directory contains orchestration scripts that automate, validate, and track transitions in the Software Development Lifecycle (SDLC) pipeline.

---

## 🛠️ Main Utility: `sdlc.js`

`sdlc.js` is a command-line runner that coordinates state transitions, executes validation testing suites, audits structured application logs, verifies telemetry metrics endpoints, and automates conventional git releases.

### Usage & Commands

Run commands from the workspace root directory:

#### 1. Initialize Feature
Starts a new pipeline flow for a feature. Automatically sets `sdlc_state.json` to phase `01-brainstorm`.
```bash
node .agents/scripts/sdlc.js init <feature-name>
```

#### 2. Check Pipeline Status
Displays the active feature context, the current SDLC phase, and the execution status.
```bash
node .agents/scripts/sdlc.js status
```

#### 3. Transition to Next Phase
Runs automated validation checks (e.g. file structures, unit testing suites, compile checks) for the current phase and moves the state to the next phase on success.
```bash
node .agents/scripts/sdlc.js transition
```

#### 4. Run QA Audit Loop
Performs a deep QA audit (intended for phase `07-verify-qa`):
1. Runs the entire testing suite (unit, integration, E2E).
2. Audits Pino JSON logs for `WARN` or `ERROR` levels and unhandled exceptions (via `audit_logs.sh`).
3. Verifies Prometheus `/metrics` availability (via `check_metrics.sh`).
On success, transitions directly to `09-finalize-release`. On failure, writes a bug report and shifts state to `08-fix-bugs`.
```bash
node .agents/scripts/sdlc.js qa-run
```

#### 5. Finalize Release
Performs finalize checks, updates PRD and Issue statuses to `done`, stages files, and commits them using Conventional Commits formatting, resetting the state to `idle`.
```bash
node .agents/scripts/sdlc.js release
```

---

## 🗄️ State File: `sdlc_state.json`

The CLI dynamically syncs progress in `sdlc_state.json` at the root of the workspace. If this file does not exist, running any `sdlc.js` command will automatically create it with default values.

Example schema:
```json
{
  "feature": "user-auth",
  "phase": "03-write-tdd",
  "status": "in_progress",
  "history": [
    {
      "phase": "01-brainstorm",
      "status": "completed",
      "timestamp": "2026-06-28T02:10:00.000Z"
    }
  ]
}
```
