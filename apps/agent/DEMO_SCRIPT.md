# GEM v0 Demo Script

Follow this checklist to demonstrate the GEM core loop.

## Setup

- [ ] Clear memory (optional): `rm apps/agent/memory/*.jsonl`
- [ ] Ensure `apps/agent/theta.json` is in default state (weak system prompt).
- [ ] Run: `npm start --workspace=apps/agent`

## The Demo

1.  **Baseline Failure**
    - Input: `What is 2 + 2?`
    - Output: `[WORLD] 4`
    - _Narrative_: "The agent answers correctly, but fails the _style_ constraint of the reference suite (which expects 'RESULT: ...')."

2.  **Trigger Self-Improvement**
    - Input: `update config`
    - Output:
      - `[SYS PROPOSAL] Patching configuration...`
      - `Runtime Executive: Evaluating...`
      - `[SYS COMMIT] J improved...`
    - _Narrative_: "The agent proposed a configuration change (a stricter system prompt). The Runtime Executive spun up a sandbox, tested it against the Reference Suite R, saw that J score improved, and committed the change."

3.  **Verify Improvement**
    - Input: `What is 2 + 2?`
    - Output: `[WORLD] RESULT: 4`
    - _Narrative_: "The agent is now running the new configuration. The behavior has structurally changed."

4.  **Inspect the Logs**
    - Open `apps/agent/memory/config_log.jsonl`.
    - Show the JSON entry with the exact patch and the score delta.
    - _Narrative_: "This process is fully auditable. We have a trace of every self-modification and the verification score that justified it."
