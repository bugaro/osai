# OSAI: Autonomous AI Compensation Engine with Deterministic Guardrails

> **Status**: Implemented & Verified. Clean-code refactoring completed (constants extraction, error type alignment, fail-fast env vars, dead code removal). Full QA suite passed. See `hosts.md` for service endpoints.

This project demonstrates a localized, production-ready implementation of an **Enterprise Agentic OS** architecture tailored for a generic food/grocery delivery service. It showcases how a lightweight Local LLM can autonomously reason through client complaints while remaining strictly bounded by a deterministic **AI Data Model**.

---

## Architecture Blueprint

The system follows a hexagonal architecture: domain logic is isolated from infrastructure concerns. All services share a consistent error hierarchy (`DomainError` base with `ValidationError`, `NotFoundError`, `ConflictError`, `AuthorizationError`, `InvalidOperationError`), centralized constants, and fail-fast configuration validation.

```text
                        [ Next.js Admin UI ] 💻
                                  │
                    1. POST sync / resolve  │  2. SSE (processed trace stream)
                                  ▼
                      [ MS AI-Data-Model ] (Gateway) ──► [ Neo4j DB ]
                                  ▲          │
        SSE (raw execution events) │          │ 3. HTTP POST /resolve-incident
                                  │          ▼
                       [ MS AI-Agents ] (Reasoning)
                                  │          │
                                  │          │
                                  ▼          ▼
                            [ Ollama Engine (Local LLM) ]
```

    MS AI-Data-Model (Gateway & Source of Truth): Establishes a persistent SSE connection with the Next.js Admin UI at startup. Ingests raw business policies (policy payload sent from the Admin UI), directly calls Ollama to extract structured rules, seeds them idempotently into Neo4j, and enforces all runtime transaction validations. It also receives raw execution events from MS AI-Agents via SSE and houses all the processing logic to format and stream the trace to the Admin UI.

    MS AI-Agents (The Reasoning Layer): Uses Mastra to orchestrate a localized reasoning loop, calling Ollama directly for inference. The master agent connects back to MS AI-Data-Model via SSE to stream raw execution events in real-time.

🛠 Core Business Logic & Rule Base

The system operates based on active business policies (unstructured text) that contain 10 fundamental business constraints for the Poznań delivery zone:
Plaintext

1. In Poznan, a delivery delay >20m triggers a 5.00 EUR base compensation, increasing to 10.00 EUR for Prime clients, capped at a 15.00 EUR hard ceiling.
2. All automated operations and financial compensation thresholds are locked to the Poznan zone boundary.

🎬 End-to-End Operational Scenario
Phase 1: Operational Ingestion (Graph Seeding)

    Action: The system administrator triggers the "Sync Operational Rules" endpoint from the Next.js Admin Dashboard, sending the policy content from the frontend.

    Backend Logic: 1. MS AI-Data-Model receives the policy content from the frontend.
    2. It sends structured extraction prompts directly to Ollama.
    3. Ollama runs the text through qwen2.5:3b. MS AI-Data-Model's internal parser validates the JSON schema and returns a clean entity object.
    4. MS AI-Data-Model maps these validated entities into Neo4j using idempotent MERGE queries.

    UI Feedback: An interactive Knowledge Graph topology updates in real-time via the startup Server-Sent Events (SSE) connection, exposing the hardcoded boundaries (e.g., [Zone: Poznan] --HAS_LIMIT--> [MaxRefund: 15.00 EUR]).

Phase 2: Autonomous Complaint Resolution (Successful Flow)

    Trigger: An event is received indicating a delivery delay in the Poznań zone.

        User Payload: { userId: "usr_99", tier: "Prime", location: "Poznan", delayMinutes: 45 }

    Execution Flow:

        Mastra Agent Processing: The MS AI-Agents receives the incident payload and initiates its ReAct (Reasoning + Acting) loop.

        Tool Execution: Recognizing it requires local constraints, the agent invokes get_delivery_policy(location: "Poznan", tier: "Prime").

        Deterministic Retrieval: MS AI-Data-Model queries Neo4j and returns a clean, non-fuzzy data frame:
        JSON

        { "baseRefund": 5.0, "primeBonus": 5.0, "ceiling": 15.0 }

        Decision Formulation: The agent passes the reasoning prompt to Ollama directly, aggregates the base value and prime bonus, determining an appropriate compensation package of 10.00 EUR.

        Transaction Dispatch: The agent fires the issue_delivery_voucher(amount: 10.00) mutation.

        Validation & Execution: The MS AI-Data-Model cross-checks 10.00 <= 15.00 (ceiling). The transaction passes validation and executes safely.