# Ubiquitous Language

This document defines the shared domain vocabulary for the entire **OSAI** system — Autonomous AI Compensation Engine with Deterministic Guardrails. It serves as the single source of truth for terminology used across developers, product managers, and agents.

---

## System-Wide Concepts

### OSAI (Autonomous AI Compensation Engine)
The full system. An Enterprise Agentic OS that autonomously resolves delivery-related client complaints while remaining strictly bounded by a deterministic rule graph. The LLM reasons; the data model decides.

### Deterministic Guardrail
The foundational design principle: no LLM output can produce a side-effect without passing through an independent, Neo4j-backed business invariant check. The LLM may hallucinate; the guardrail cannot.

### Incident
A business event representing a client complaint or delivery anomaly. Carries a structured payload: `{ userId, tier, location, delayMinutes }`. The entry point into the autonomous resolution loop.

### Compensation Package
The output of a successful resolution: a calculated monetary value (e.g., `10.00 EUR`) issued to a client as a voucher or refund. Must satisfy all business invariants before execution.

### Delivery Zone (`DeliveryZone`)
A geographic constraint entity in Neo4j. Delay compensation rules apply **only** to orders within the `Poznan` zone. Zone membership is enforced at the graph level, not by the LLM.

### Client Tier (`ClientTier`)
A client classification affecting compensation amounts. An enum with values: `Standard` | `Prime`. A `Prime` client receives higher base compensation and additional vouchers on restaurant cancellations. The enum is defined identically in both `ms-ai-data-model` and `ms-ai-agents` (both use `Standard = 'Standard'`).

### Compensation Ceiling (`MaxRefund`)
A hard invariant node in the Neo4j graph. The maximum compensation for a delivery delay is **15.00 EUR**. Any proposed amount exceeding this limit triggers a `SecurityException`.

### Supervisor Approval Threshold
A hard invariant: any compensation exceeding **20.00 EUR** requires manual approval by a human supervisor. Enforced at the graph validation layer, independent of the LLM.

### Policy Input
The unstructured plain-text source of all business constraints. Provided directly from the Next.js Admin UI (frontend) to the sync endpoint. Ingested by MS AI-Data-Model and converted into structured graph entities via direct Ollama LLM extraction.

### Graph Seeding / Sync
The operational phase in which rules text from the frontend is received by MS AI-Data-Model, dispatched directly to Ollama for structured extraction, and `MERGE`d idempotently into the Neo4j Knowledge Graph.

### SecurityException
A typed domain error thrown by MS AI-Data-Model when a proposed transaction violates a hard business invariant (e.g., exceeds the compensation ceiling). Immediately aborts execution and triggers an SSE alert to the Admin UI.

---

## Domain Error Hierarchy

All services use a consistent typed error hierarchy rooted in `DomainError`:

| Error                 | Service              | When thrown                                         |
|-----------------------|----------------------|-----------------------------------------------------|
| `ValidationError`     | Both                 | Input fails domain invariants                       |
| `NotFoundError`       | Both                 | Requested entity does not exist                     |
| `ConflictError`       | Both                 | Uniqueness constraint violation                     |
| `AuthorizationError`  | Both                 | Permission issues                                   |
| `InvalidOperationError` | Both               | State-based logic violations, missing env vars      |
| `ExtractionError`     | ai-data-model        | AI extraction failures                              |
| `RulesNotSyncedError` | ai-data-model        | Rules not yet synced before resolution              |
| `ServiceUnavailableError` | ai-data-model     | Downstream service unavailable (Neo4j, etc.)        |

---

## MS AI-Data-Model — Knowledge Graph & Invariant Enforcer

### Knowledge Graph
The Neo4j-backed directed graph that encodes all business rules as structured entities and typed relationships (e.g., `[Zone: Poznan] --HAS_LIMIT--> [MaxRefund: 15.00 EUR]`). The authoritative runtime source of truth.

### Policy Frame (`PolicyFrame`)
A deterministic, non-fuzzy data frame returned by the `GET /api/policy` endpoint. Contains: `{ baseRefund, primeBonus, ceiling }`. Consumed by MS AI-Agents to anchor the LLM's reasoning.

### Transaction Validation
The server-side process inside MS AI-Data-Model that evaluates a proposed action against Neo4j invariants. Runs independently of the LLM context — the graph is interrogated via Cypher, not via the model.

### Idempotent MERGE
The Neo4j write strategy used during Graph Seeding. Ensures that re-triggering a sync does not duplicate nodes or relationships — the graph state converges regardless of how many times it is seeded.

### Neo4j Bolt
The binary wire protocol used for all communication between MS AI-Data-Model and the Neo4j database (port `7687`). Managed via the `neo4j-driver` v5 official Node.js client.

### NotificationSeverity
A union type defined in `Notification.ts`: `'info' | 'warn' | 'error' | 'log' | 'success'`. Used across `ms-ai-data-model` for SSE event severity. Single source of truth — the duplicate definition was removed from `SystemNotificationPayload.ts`.

---

## MS AI-Agents — Reasoning & Orchestration Layer

### ReAct Loop (Reasoning + Acting)
The Mastra-orchestrated execution pattern. The agent alternates between _reasoning_ (formulating what to do next) and _acting_ (invoking a registered tool). Continues until a final answer is reached or `AGENT_MAX_STEPS` is exhausted.

### Agent Tool
A typed, schema-validated function registered in the Mastra tool registry that the agent may invoke during its ReAct loop. Tools are the **only** mechanism by which the agent can interact with external systems.

### `get_delivery_policy` Tool
An agent tool that calls `MS AI-Data-Model GET /api/policy` with `{ location, tier }` and returns a `PolicyFrame`. Used by the agent to retrieve hard business constraints before formulating a compensation decision.

### `issue_delivery_voucher` Tool
An agent tool that calls `MS AI-Data-Model POST /api/transaction` with a proposed `{ amount }`. Triggers Transaction Validation. On success, the compensation is executed; on failure, a `SecurityException` is returned.

### Execution Trace
A structured, ordered log of all ReAct loop steps (reasoning thoughts, tool invocations, tool results, final answer). Streamed in real-time from MS AI-Agents to MS AI-Data-Model via SSE, where it is processed and formatted before being pushed to the Admin UI via the startup SSE connection. Each step carries a `correlationId` and `traceId`.

### SSE Stream (Server-Sent Events)
The system uses two unidirectional, persistent HTTP connections:
1. From Next.js Admin UI to MS AI-Data-Model (established at startup), over which the processed Execution Trace is delivered.
2. From MS AI-Agents to MS AI-Data-Model, over which raw agent execution events are streamed.
A red event on these streams signals a Guardrail Breach.

### Guardrail Breach Event
An SSE event emitted when a `SecurityException` is thrown. Payload includes: the attempted amount, the violated invariant, and the rule number. Causes the Admin UI execution log to flash red.

---

## LLM Integration & Inference Policies

### Ollama Connection (`OllamaConnection`)
Direct HTTP communication with the local Ollama server (port `11434`) initiated by both `MS AI-Agents` (for ReAct reasoning) and `MS AI-Data-Model` (for sync extraction).

### Deterministic Temperature Lock
A strict policy constraint that forces `temperature=0.0` on every inference request. Locks the LLM into greedy decoding — ensures completely repeatable output for identical prompts.

### Validation Guard / Schema Enforcement
A structural validation layer that intercepts raw LLM text output and parses it against a Zod schema. Runs inside both `MS AI-Agents` and `MS AI-Data-Model` to prevent malformed data from propagating.

### Inference Retry Loop
A resilient execution wrapper that retries failed LLM requests up to **3 times** with exponential backoff on transient network failures or timeouts. Throws an error only after all retries are exhausted.

---

## Observability

### Correlation ID (`correlationId`)
A request-scoped unique identifier (`x-correlation-id` HTTP header) propagated via `AsyncLocalStorage` across all async lifecycles, log entries, trace spans, and SSE events within a single incident resolution flow.

### Token Telemetry
Structured performance metadata emitted after every successful inference call. Contains: `promptTokens`, `completionTokens`, and `durationMs`. Used for cost monitoring and latency observability.

### Execution Log
The Admin UI panel that displays the live SSE stream of a resolution's Execution Trace. Color-coded: green for successful steps, red for Guardrail Breach events.
