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

### Running the Agent (Mock Mode)

By default, if no `OPENAI_API_KEY` is present in `apps/agent/.env`, the agent runs in **Mock Mode**. This is perfect for demonstrating the mechanism without LLM variance.

```bash
npm start --workspace=apps/agent
```

### Triggering a Self-Update

In Mock Mode, the engine listens for specific phrases to simulate behavior:

1.  **Standard Queries**:
    - "What is 2 + 2?" -> "4"
    - "Status report" -> "All systems nominal."

2.  **Trigger Update**:
    - Type `update config` to force the agent to propose a structural patch.
    - The patch adds a rule: "Always start your response with 'RESULT: '".

### Inspecting Logs

All configuration changes are logged to:
`apps/agent/memory/config_log.jsonl`

Each entry contains:

- `theta_before` / `theta_after`
- `j_before` / `j_after` (Performance scores)
- `committed` (Boolean result)

## Reference Suite

Located in `apps/agent/R/tasks.jsonl`. These are the "tests" the agent must pass to accept a self-update.
