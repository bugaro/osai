# Architecture — OSAI: Autonomous AI Compensation Engine

## 1. System Overview

OSAI is a **production-ready, localized Enterprise Agentic OS** built around three independent microservices and a Next.js Admin UI. Its core design principle is **deterministic guardrails**: an LLM can reason freely, but every action it proposes is independently validated against a Neo4j Knowledge Graph before any side-effect is applied.

All services implement a **hexagonal architecture** (domain logic isolated from infrastructure), a consistent **typed error hierarchy** rooted in `DomainError`, and **fail-fast configuration** where required env vars throw `InvalidOperationError` at startup instead of silently defaulting.

---

## 2. Service Topology

```
                        [ Next.js Admin UI ] 💻
                                  │
                  1. HTTP GET /api/events (SSE Stream at startup)
                  2. HTTP POST /api/sync /resolve
                  3. HTTP GET /api/graph
                                  ▼
           [ MS AI-Data-Model ] (Gateway & DB) 🛡️ ◄──────────────┐
             (Port 3002 · Hono · Neo4j Driver)                  │
               │                                                 │
               │ HTTP POST /api/agents/resolve                   │
               │ (initiates agent ReAct loop)                    │
               ▼                                                 │
     [ MS AI-Agents ] (Reasoning) 🧠                              │
     (Port 3001 · Hono · Mastra)                                  │
        │                                                         │
        ├─► HTTP GET /api/policy ─────────────────────────────────┤
        │   (fetch policy frame)                                  │
        │                                                         │
        ├─► HTTP POST /api/transaction ───────────────────────────┤
        │   (validate & execute)                                  │
        │                                                         │
        ├─► SSE connection /api/events ───────────────────────────┤
        │   (stream raw execution events to gateway)              │
        │                                                         │
        └─► HTTP POST /api/generate ──────────────────────────────┐
            (direct inference)                                    │
                                                                 ▼
           [ MS AI-Data-Model ] ──► HTTP POST /api/generate ──► [ Ollama Engine ] 🤖
                                                                 (Port 11434)
```

### Communication Protocol

| Route                                     | Protocol | Style                      | Port  |
|-------------------------------------------|----------|----------------------------|-------|
| Admin UI → AI-Data-Model (Gateway)        | SSE      | GET ➔ SSE (at startup)     | 3002  |
| Admin UI → AI-Data-Model (Sync/Resolve)   | HTTP     | POST JSON                  | 3002  |
| AI-Agents → AI-Data-Model (Trace)         | SSE      | GET/POST ➔ SSE             | 3002  |
| AI-Data-Model → AI-Agents (Resolve)       | HTTP     | POST JSON                  | 3001  |
| AI-Agents → AI-Data-Model (Policy)        | HTTP     | GET JSON                   | 3002  |
| AI-Agents → AI-Data-Model (Transaction)   | HTTP     | POST JSON                  | 3002  |
| AI-Agents → Ollama                        | HTTP     | REST (Direct Inference)    | 11434 |
| AI-Data-Model → Ollama                    | HTTP     | REST (Ingestion Pipeline)  | 11434 |
| AI-Data-Model → Neo4j                     | Bolt     | Native                     | 7687  |

---

## 3. Microservice Specifications

### 3.1 MS AI-Data-Model (`ms-ai-data-model`)

**Responsibility:** Gateway, Source of Truth, Ingestion pipeline, and trace processor. Establishes a persistent SSE connection with the Next.js Admin UI at startup. Accepts frontend-submitted policy text, runs direct inference against Ollama to extract structured policies, and maps them to Neo4j. Listens for incoming SSE trace events from `ms-ai-agents`, processes/formats the raw events, and streams the finished trace to the Admin UI.

| Attribute       | Value                                  |
|-----------------|----------------------------------------|
| Port            | `3002` (Exposed publicly)              |
| Framework       | Hono `^4.12+` via `@hono/node-server`  |
| Language        | TypeScript `v6+` (no build step)       |
| Database        | Neo4j `5.x`                            |
| Container name  | `osai-ai-data-model`                   |

**Key API Contracts:**
- `GET /api/events` — Persistent SSE endpoint. Next.js Admin UI connects at startup to receive real-time updates and processed execution traces.
- `POST /api/sync` — Ingests rules text submitted from frontend, connects directly to Ollama to extract entities, and maps them idempotently into Neo4j.
- `POST /api/resolve` — Gateway resolution endpoint. Accepts complaint JSON payload and triggers `POST /api/agents/resolve` on `ms-ai-agents`.
- `POST /api/agent/trace` (or SSE endpoint) — Internal endpoint where `ms-ai-agents` connects to stream raw execution events.
- `GET /api/policy?location=&tier=` — Internal route called by `ms-ai-agents`. Returns deterministic data frame: `{ baseRefund, primeBonus, ceiling }`.
- `POST /api/transaction` — Internal route called by `ms-ai-agents`. Validates and executes a proposed AI action. Throws `SecurityException` on invariant violation.
- `GET /api/graph` — Returns full graph topology (nodes + edges) for UI visualization.
- `GET /metrics` — Prometheus metrics endpoint.

**Domain Invariants (enforced in Neo4j, not by LLM):**
- Delay compensation ceiling: `15.00 EUR`
- Supervisor approval threshold: `> 20.00 EUR`
- Zone constraint: Delay rules apply only to `Poznan`

**Clean-Code Refactoring Highlights:**
- Centralized `constants.ts` — all magic values, env var names, defaults, and metric names in one file
- Fail-fast config validation — missing `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`, `OLLAMA_URL`, `AI_AGENTS_URL`, `PORT` throw `InvalidOperationError` at startup
- Typed error hierarchy — `ConflictError`, `AuthorizationError`, `InvalidOperationError` added alongside existing `DomainError` subclasses
- `ClientTier.Standard` aligned to `'Standard'` (was `'Std'`)
- `NotificationSeverity` deduplicated — single source of truth in `Notification.ts`
- Zero raw `Error` throws — all use typed domain errors
- Dead code removed — unused imports, variables eliminated

---

### 3.2 MS AI-Agents (`ms-ai-agents`)

**Responsibility:** Reasoning Layer. Orchestrates the Mastra ReAct loop. Communicates directly with Ollama for model inference. The master agent connects back to `ms-ai-data-model` via SSE to stream raw execution traces.

| Attribute       | Value                              |
|-----------------|------------------------------------|
| Port            | `3001` (Internal only)             |
| Framework       | Hono `^4.12+` + Mastra `latest`    |
| Language        | TypeScript `v6+` (no build step)   |
| Container name  | `osai-ai-agents`                   |

**Key API Contracts:**
- `POST /api/agents/resolve` — Accepts incident payload from `ms-ai-data-model`, initiates the Mastra loop, and establishes an SSE stream sending raw events to `ms-ai-data-model`.
- `GET /metrics` — Prometheus metrics endpoint.

**Mastra Tools registered:**
- `get_delivery_policy(location, tier)` → AI-Data-Model `GET /api/policy`
- `issue_delivery_voucher(amount)` → AI-Data-Model `POST /api/transaction`

**Clean-Code Refactoring Highlights:**
- Added `ConflictError` and `AuthorizationError` to typed error hierarchy

---

### 3.3 Frontend — Admin UI (`frontend/admin-ui`)

**Responsibility:** Operator dashboard for graph visualization, complaint submission, and real-time execution log monitoring.

| Attribute       | Value                             |
|-----------------|-----------------------------------|
| Port            | `3000`                            |
| Framework       | Next.js `15` (App Router)         |
| Language        | TypeScript `v6+`                  |
| Container name  | `osai-admin-ui`                   |

**Key Views:**
- **Graph View** — Real-time SSE-powered Neo4j topology visualization.
- **Complaint Resolver** — Submit incident payloads directly to `ms-ai-data-model` (`POST /api/resolve`) and observe the logs streamed over the persistent startup SSE connection.
- **Execution Log** — Color-coded streaming log (green = success, red = guardrail violation).

**Clean-Code Refactoring Highlights:**
- Centralized `shared/lib/constants.ts` — reconnect config and `GRAPH_CONFIG` extracted
- Removed unused `Loader2` import from `IncidentForm.tsx`
- Removed unused `SyncRequest` interface from shared types
- Removed unused `d3-force` and `d3-zoom` dependencies

---

## 4. Technology Stack

| Layer           | Technology                                          | Version                      |
|-----------------|-----------------------------------------------------|------------------------------|
| Language        | TypeScript                                          | `v6.0+`                      |
| Runtime         | Node.js (native `--experimental-strip-types`)       | `v24 LTS`                    |
| HTTP Framework  | Hono via `@hono/node-server`                        | `^4.12+`                     |
| Agents          | Mastra                                              | `latest`                     |
| Local LLM       | Ollama (`qwen2.5:3b`)                               | `0.30.10`                    |
| Graph Database  | Neo4j                                               | `5.x`                        |
| Frontend        | Next.js (App Router)                                | `15`                         |
| Containerisation | Docker & Docker Compose                            | latest                       |
| Metrics         | Prometheus · `prom-client`                          | `v3.11.3` · `^15.1.2`        |
| Logs            | Grafana Loki · Pino JSON                            | `3.7.1` · `^9.0.0`           |
| Tracing         | OpenTelemetry SDK · OTLP gRPC exporter              | `@opentelemetry/sdk-node ^0.220.0` |
| Visualization   | Grafana                                             | `13.0.1`                     |
| Collector       | Grafana Alloy                                       | `v1.16.0`                    |

---

## 5. Repository Layout

```
shelf/
├── docs/
│   ├── app.md
│   ├── architecture.md            ← this file
│   ├── coding_standards.md
│   ├── ubiquitous_language.md
│   └── PRD/
│       └── prd-clean-code-refactoring.md
│
├── backend/
│   ├── infrastructure/            # Shared infra (Docker Compose, observability)
│   │   ├── docker-compose.orchestration.yml
│   │   ├── docker-compose.observability.yml
│   │   ├── .env
│   │   ├── alloy/config.alloy
│   │   ├── grafana/
│   │   ├── loki/
│   │   └── prometheus/prometheus.yml
│   │
│   └── services/
│       ├── ai-data-model/          # MS AI-Data-Model (Neo4j · Hono)
│       │   ├── docker-compose.yml
│       │   ├── .env
│       │   ├── src/
│       │   │   ├── server.ts       # Entry: otel bootstrap must be FIRST import
│       │   │   ├── app.ts          # Hono app factory
│       │   │   ├── constants.ts    # Centralized magic values & env var names
│       │   │   ├── domain/         # Entities, ports, invariants (pure TS)
│       │   │   │   ├── enums/
│       │   │   │   │   ├── ClientTier.ts
│       │   │   │   │   └── TraceEventType.ts
│       │   │   │   ├── errors/
│       │   │   │   │   ├── DomainError.ts
│       │   │   │   │   ├── ConflictError.ts
│       │   │   │   │   ├── AuthorizationError.ts
│       │   │   │   │   ├── InvalidOperationError.ts
│       │   │   │   │   ├── ValidationError.ts
│       │   │   │   │   ├── ExtractionError.ts
│       │   │   │   │   ├── ServiceUnavailableError.ts
│       │   │   │   │   └── RulesNotSyncedError.ts
│       │   │   │   └── invariants/
│       │   │   ├── application/    # Use cases & orchestration
│       │   │   ├── infrastructure/ # Neo4jAdapter, AIProviderClient
│       │   │   └── interface/      # Hono route controllers
│       │   └── package.json
│       │
│       └── ai-agents/              # MS AI-Agents (Mastra · Hono)
│           ├── docker-compose.yml
│           ├── .env
│           ├── src/
│           │   ├── server.ts
│           │   ├── app.ts
│           │   ├── constants.ts
│           │   ├── domain/
│           │   │   ├── enums/
│           │   │   └── errors/
│           │   │       ├── DomainError.ts
│           │   │       ├── ConflictError.ts
│           │   │       ├── AuthorizationError.ts
│           │   │       ├── InvalidOperationError.ts
│           │   │       ├── NotFoundError.ts
│           │   │       └── ValidationError.ts
│           │   ├── application/    # Mastra agent definition, tool registry
│           │   ├── infrastructure/ # HTTP adapters → AI-Data-Model
│           │   └── interface/      # Hono controllers + SSE streaming
│           └── package.json
│
└── frontend/
    └── admin-ui/                   # Next.js Admin Dashboard
        ├── docker-compose.yml
        ├── src/
        │   ├── app/                # App Router pages
        │   ├── features/           # Feature-Sliced Design modules
        │   │   ├── incident-resolver/
        │   │   ├── knowledge-graph/
        │   │   ├── rule-sync/
        │   │   └── trace-terminal/
        │   └── shared/             # UI kit, hooks, API clients
        │       ├── lib/
        │       │   └── constants.ts
        │       ├── types/
        │       └── api/
        └── package.json
```

---

## 6. Observability

All microservices implement the full observability triad.

### Structured Logging (Pino → Loki)
- JSON output to `stdout`; collected by **Grafana Alloy** via Docker socket.
- Every log entry carries `correlationId` and `traceId`.
- PII-flagged entries (`security.mask_pii: true`) are dropped at the Alloy pipeline stage.

### Distributed Tracing (OpenTelemetry → Alloy)
- Each service bootstraps the OTel SDK as its **first side-effect** in `server.ts`.
- Traces exported via **OTLP gRPC** to Alloy on port `4317`.
- `x-correlation-id` propagated via `AsyncLocalStorage` across all async lifecycles.
- `HttpInstrumentation` instruments all inbound/outbound HTTP automatically.

### Metrics (prom-client → Prometheus → Grafana)
- Each service exposes `GET /metrics` in Prometheus exposition format.
- Prometheus scrapes all services on 15s interval.

### Alloy Pipeline Summary

| Input              | Processor           | Output       |
|--------------------|---------------------|--------------|
| Docker socket logs | JSON/logfmt parser  | Loki         |
| OTLP gRPC (traces) | Batch processor     | Debug stdout |
| OTLP gRPC (logs)   | OTel→Loki converter | Loki         |

---

## 7. Orchestration

### Entry Point
```bash
cd backend/infrastructure
docker compose -f docker-compose.orchestration.yml up
```

### Startup Order
```
dependency-check  ─────────────────────────► completed (bootstraps .env + node_modules)
Neo4j             ─────────────────────────► healthy
Ollama  →  ollama-init (pull qwen2.5:3b)  ─► ready
                              MS AI-Data-Model (depends: neo4j + ollama-init)
                              MS AI-Agents (depends: dependency-check + ollama)
Observability stack (Prometheus, Loki, Alloy, Grafana) — parallel
```

### Service URLs (local development)

| Service          | URL                        |
|------------------|----------------------------|
| Admin UI         | http://localhost:3000       |
| MS AI-Data-Model | http://localhost:3002       |
| MS AI-Agents     | http://localhost:3001 (Internal Only) |
| Neo4j Browser    | http://localhost:7474       |
| Ollama API       | http://localhost:11434      |
| Grafana          | http://localhost:3333       |
| Prometheus       | http://localhost:9090       |
| Loki             | http://localhost:3100       |
| Alloy UI         | http://localhost:12345      |

---

## 8. Security & Guardrails Model

The system enforces a **two-layer security model**:

### Layer 1 — LLM Structural Guard (AI-Agents & AI-Data-Model)
- Raw LLM outputs are parsed and validated against Zod schemas directly within their respective services.
- Malformed responses from Ollama are rejected and retried with exponential backoff.
- Enforces strict temperature controls (0.0 temperature lock) when prompting Ollama.

### Layer 2 — Business Invariant Guard (AI-Data-Model)
- Every proposed transaction is validated **independently from the LLM context**.
- Validation reads directly from Neo4j — no LLM involvement.
- Violations throw `SecurityException` and are logged with full context.
- This layer catches adversarial prompt injections and hallucination drift.

**Invariant violation flow:**
```
LLM proposes action  →  AI-Data-Model validates  →  FAIL
                                                      ↓
                                           SecurityException thrown
                                                      ↓
                               SSE stream: [Security Violation] event
                                                      ↓
                               Execution log flashes red in Admin UI
```
