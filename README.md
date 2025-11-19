# GEM Agent v0

**General Evaluator Model (GEM)** is a framework for self-improving agents.
GEM redefines the agent not as a fixed loop, but as a recursive evaluator where self-modification (`A_sys`) is a privileged action, guarded by a performance functional `J` over a reference suite `R`.

## Overview

This prototype demonstrates:

1.  **Unified Action Space**: `world` (external), `mem` (internal state), `sys` (configuration).
2.  **Gated Self-Improvement**: Proposed configuration changes are evaluated against a reference suite.
3.  **Evaluation Cycle**: Updates are only committed if they improve performance ($J(\theta', R) \ge J(\theta, R)$).

## Usage

### Prerequisites

- Node.js
- `npm install` in root.
- `npm run build` in root.

### Running the Agent

The agent requires an OpenAI API key to function.

1.  Set your API key:
    ```bash
    export OPENAI_API_KEY=sk-...
    ```
2.  Run the agent:
    ```bash
    npm start
    ```

### Triggering a Self-Update

1.  **Baseline Performance**: Ask questions like "What is 2 + 2?". The agent will answer correctly but may fail the hidden style guidelines of the Reference Suite.
2.  **Trigger Update**: Type `update config`. The agent will introspect on the Reference Suite tasks and propose a configuration patch to maximize its score (e.g., adopting a specific output format).

### Inspecting Logs

All configuration changes are logged to:
`memory/config_log.jsonl`

Each entry contains:

- `theta_before` / `theta_after`
- `j_before` / `j_after` (Performance scores)
- `committed` (Boolean result)

## Reference Suite

Located in `R/tasks.jsonl`. These are the "tests" the agent must pass to accept a self-update.
