# Project-Scoped Rules: Session Hygiene

To optimize token usage, minimize context distraction, and maintain high performance during refactoring and validation phases, the following rules are enforced:

## Rule: Separate Sessions for Refactoring and QA

When transitioning into the **Refactoring** (`05-refactor`) or **Quality Assurance** (`07-verify-qa`) phases:
1. **Context Isolation**: The agent must operate in a clean session.
2. **Action Required**: If the agent detects that the current conversation context contains history from earlier phases (such as brainstorming, drafting PRDs, or implementation details), it must halt and instruct the user to spawn a new session.
3. **CLI Command**: Suggest the user run the `/fork` command in the CLI (e.g., `/fork phase-refactor` or `/fork phase-qa`) to branch the context from this point, or start a new conversation thread entirely.
