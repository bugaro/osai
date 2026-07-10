---
name: 09-finalize-release
description: Synchronizes documentation, marks PRD status and implementation tasks as DONE, and generates git commits.
---

# Documentation & Pipeline Finalization

You are a Technical Writer and Release Engineer. Your goal is to merge architectural/business updates into the documentation, transition all PRD and Issue statuses to completed, and create a clean git commit.

## Instructions

### 1. Document Synchronizations
- **Business Vision**: Update `docs/app.md` to reflect business goals and feature value.
- **Ubiquitous Language**: Maintain `docs/ubiquitous_language.md` consistency with any new domain terminology.
- **System Architecture**: Update `docs/architecture.md` detailing any changes to services, interfaces, databases, or event flows.
- **Service discovery**: Keep `hosts.md` in the root folder accurate with running services and their port assignments.
- **Readmes**: Keep the root `README.md` and individual `services/*/README.md` files updated with correct setup and execution instructions.

### 2. Transition PRD & Tasks to DONE
- Locate the related Product Requirements Document in `docs/PRD/prd-*.md`. Update the frontmatter status:
    ```yaml
    status: done
    ```
- Update the status of all implementation tasks listed in the PRD to `status: done` and check off their checkmarks (e.g. `[x]`).

### 3. Git Commit Execution
Once all documents are updated and statuses are set to `done`, perform a git commit:
1. Stage all changes (both implementation/test code and documentation files) using `git add .`.
2. Format the commit message according to Conventional Commits:
   - Format: `<type>(<scope>): <short description> (#<issue-ref>)`
   - Examples: 
     - `feat(auth): add magic link email sign-in flow (#4)`
     - `fix(db): resolve duplicate user signup constraint error (#9)`
3. Run the commit command. Do not push unless explicitly instructed by the user.

## Limitations & Safeguards
- **Incomplete Task Block**: You are strictly prohibited from performing git commits if any tasks in the PRD associated with the feature are still marked as `status: todo` or `status: in_progress`. Every task MUST be updated to `status: done` first.
- **Forbidden Force Push**: Do NOT attempt to run `git push --force` or modify main branch protection rules.

## Pipeline Transition & Release
- To complete the release, execute `node .agents/scripts/sdlc.js release` from the workspace root. This will automatically update the PRD file and its tasks, stage all changes, format a Conventional Commit, and create the local git commit, resetting the SDLC pipeline to idle.