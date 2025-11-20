# The General Evaluator Model (GEM)

**A Unified Architecture for Self-Improving Intelligent Systems**

## Abstract

Current artificial intelligence systems generally fall into two categories: static function approximators (models) or task-solving loops (agents). While agents can accumulate episodic memory (“in-context learning”), they typically lack a principled mechanism to modify their own control structure. We propose the **General Evaluator Model (GEM)**, a minimal formal framework for self-improving systems. GEM redefines the agent not as a fixed loop, but as a recursive evaluator in which self-modification is a privileged subset of the action space. By distinguishing between State Updates (Type 1) and Configuration Updates (Type 2), and by constraining the latter with an explicit performance functional over a reference suite, GEM provides a substrate-independent blueprint for agents that can safely rewrite their own configuration.

---

## 1. Introduction

Most contemporary agents are defined by a fixed tuple: a large language model (LLM), a system prompt, a set of tools, and a memory bank. The memory changes over time, but the structure of the agent — its prompts, tool definitions, and control logic — remains frozen.

This creates a ceiling on intelligence. A truly intelligent system must be able to critique and upgrade its own reasoning process, not just accumulate more data. It requires structural self-improvement, not only state-level learning.

The General Evaluator Model (GEM) starts from a simple claim:

> An intelligent agent is fundamentally an evaluator that maps its current configuration, memory, and observations into actions.
>
> A self-improving agent is one whose evaluator can select actions that modify its own configuration, subject to explicit performance constraints.

GEM treats the agent’s configuration (its “source code”) as mutable data, accessible to the evaluator itself, and formalizes self-modification as part of the action space.

---

## 2. The Formal Model

We define an agent at time $t$ as a tuple of Configuration, Memory, and Last Observation:

$$ \text{Agent}\_t = (\theta_t, M_t, O_t) $$

### 2.1 Components

1.  **Configuration $\theta$**: The structural logic governing the agent.

    - Examples: system prompts, tool definitions, control policies, retrieval hyperparameters, reflection cadence.
    - Domain: a meta-language $\mathcal{M}$. In practice, $\theta \in \mathcal{M}$ is a structured object (e.g. JSON, DSL, Python config) that fully specifies behavior given the engine.

2.  **Memory $M$**: The fluid internal state of the agent.

    - Examples: dialogue history, vector store contents, current beliefs about the world, episodic logs, cached plans.
    - Domain: arbitrary data structures, possibly spanning multiple stores.

3.  **Observation $O$**: The most recent percept from the environment.

    - Examples: user message, sensor readings, tool outputs.

4.  **Engine $f$**: The underlying substrate that executes the logic encoded by $\theta$.
    - Examples: a fixed LLM (e.g. GPT-4), a policy network, a symbolic solver.
    - Type: $f: (\theta, M, O) \to \Delta(A)$ where $\Delta(A)$ denotes a distribution over actions.

Intuitively: $\theta$ and $M$ are the “data,” $f$ is the “kernel.” Changing $\theta$ changes the evaluator’s structure; changing $M$ changes only its state.

### 2.2 Unified Action Space

Standard reinforcement learning treats the action space $A$ as targeting only the external world. GEM partitions the action space into three disjoint subsets:

$$ A = A*{\text{world}} \cup A*{\text{mem}} \cup A\_{\text{sys}} $$

1.  **$A_{\text{world}}$ (Act)**: Actions that affect the external environment.

    - Examples: `send_message(user_text)`, `move_robot(Δx, Δy)`, `call_api(request)`.

2.  **$A_{\text{mem}}$ (Learn)**: Actions that modify the memory $M$, but not the configuration $\theta$.

    - Examples: `write_to_memory(entry)`, `update_belief(key, value)`, `append_to_log(trace)`.

3.  **$A_{\text{sys}}$ (Evolve)**: Actions that propose changes to the configuration $\theta$.
    - Examples: `rewrite_prompt(patch)`, `add_new_tool(spec)`, `adjust_planning_depth(k)`, `change_reflection_interval(k)`.

We call actions in $A_{\text{mem}}$ **Type 1** (state-level) updates, and actions in $A_{\text{sys}}$ **Type 2** (structural) updates.

---

## 3. The Evaluation Cycle

At each discrete step $t$, the agent executes the following cycle:

1.  **Evaluate**
    Given current configuration $\theta_t$, memory $M_t$, and observation $O_t$, the engine computes a distribution over actions:
    $$ P_t = f(\theta_t, M_t, O_t) \in \Delta(A) $$

2.  **Select**
    A concrete action $a_t \in A$ is drawn or chosen:
    $$ a_t = \text{select}(P_t) $$

3.  **Apply**
    Depending on which partition $a_t$ belongs to:

    - If $a_t \in A_{\text{world}}$:
      The environment responds with a new observation $O_{t+1} = \text{act\_external}(a_t)$.
      Memory $M_t$ may also be updated by a separate perception or logging mechanism.

    - If $a_t \in A_{\text{mem}}$:
      Memory is updated by a memory application function $M_{t+1} = \text{apply\_mem}(M_t, a_t)$.
      Observation may be set to a synthetic feedback (e.g. "Memory updated."), and $\theta\_{t+1} = \theta_t.

    - If $a_t \in A_{\text{sys}}$:
      A configuration patch is proposed: $\theta' = \text{patch}(\theta_t, a_t)$.
      This triggers the structural update mechanism described in Section 4.

4.  **Advance**
    The new agent state is $\text{Agent}_{t+1} = (\theta_{t+1}, M_{t+1}, O_{t+1})$ with $\theta_{t+1}, M_{t+1}, O_{t+1}$ determined as above.

This is the entire dynamics. There is no special “outer loop”: self-improvement is just a particular class of actions in $A_{\text{sys}}$.

---

## 4. Learning vs Self-Improvement

GEM draws a sharp line between Type 1 and Type 2 change.

### 4.1 Type 1: State Improvement (Learning)

When the agent selects $a_t \in A_{\text{mem}}$, it modifies its memory $M_t$ while leaving configuration $\theta_t$ unchanged:

$$ M*{t+1} \leftarrow \text{apply_mem}(M_t, a_t), \qquad \theta*{t+1} \leftarrow \theta_t $$

This covers:

- in-context learning
- retrieval-augmented generation (RAG) updates
- belief updates, logging, episodic memory, caches

The evaluator’s structure (how it reasons) is fixed; only its state (what it knows) evolves.

### 4.2 Type 2: Structural Improvement (Evolution)

When the agent selects $a_t \in A_{\text{sys}}$, it is attempting to change its own evaluator configuration:

$$ \theta' \leftarrow \text{patch}(\theta_t, a_t) $$

At this point, the system does not immediately commit to $\theta'$. Instead, a Runtime Executive intercepts the proposal and treats it as a hypothesis about a better self. That hypothesis must be validated against a performance functional.

This is the key move: self-modification is an action, but a guarded one.

---

## 5. The Performance Functional J

Self-modification without verification leads to instability and collapse. GEM therefore requires:

- a reference suite $R$ of tasks/goals, and
- a performance functional $J: (\theta, R) \to \mathbb{R}$

Intuitively, $R$ is a test set for the agent’s configuration, and $J$ is the evaluation metric. In practice, $J$ can aggregate multiple objectives:

- task success rate
- latency or cost
- safety or compliance scores

into a single scalar.

Given a proposed configuration $\theta'$ produced by a Type 2 action, the Runtime evaluates:

$$ J(\theta', R) \quad\text{vs}\quad J(\theta_t, R) $$

The structural update rule is:

$$ \theta\_{t+1} = \begin{cases} \theta' & \text{if } J(\theta', R) \ge J(\theta_t, R) + \varepsilon \quad \text{(Commit)} \\ \theta_t & \text{otherwise} \quad \text{(Rollback)} \end{cases} $$

for some margin $\varepsilon \ge 0$.

If the update is rejected, the agent receives a synthetic observation:
$O_{t+1} = \text{"Self-update failed validation."}$

This feedback becomes part of its experience: the agent can learn which kinds of structural edits tend to pass or fail, using its own failures as training data.

Two important points:

1.  $R$ is a reference class, not the whole world. Over-fitting $\theta$ to $R$ is a concrete manifestation of Goodhart’s law.
2.  In a fully autonomous system, selecting and expanding $R$ itself becomes part of the long-term problem of self-governance.

---

## 6. Concrete Instantiation: LLM-GEM

To demonstrate that GEM is implementable with current tools, consider a language-model based agent.

### 6.1 Meta-Language $\mathcal{M}$

Let $\theta$ be a JSON configuration object:

```json
{
  "persona": "string",
  "system_prompt": "string",
  "thought_pattern": "chain_of_thought | tree_of_thought",
  "tools": [
    {
      "name": "string",
      "signature": "string",
      "description": "string"
    }
  ],
  "planning_depth": "integer",
  "reflection_interval": "integer"
}
```

Here, $\mathcal{M}$ is the space of such JSON documents, and $\theta_t \in \mathcal{M}$ fully specifies how the engine behaves: prompts, tools, planning strategy, reflection cadence.

### 6.2 Engine $f$

- A frozen LLM, e.g. GPT-4 or Claude 3.x.
- Given $(\theta_t, M_t, O_t)$, the engine constructs a prompt and tool context, then outputs a distribution over actions $A$ (which includes both external actions and internal configuration/memory tools).

### 6.3 System-Level Action $A_{\text{sys}}$

Add a special tool: `update_configuration(json_patch)`

This tool takes a proposed patch to the JSON configuration $\theta_t$. When the agent calls it, the Runtime:

1.  Constructs $\theta' = \text{patch}(\theta_t, \text{json\_patch})$.
2.  Spins up a sandbox agent with configuration $\theta'$.
3.  Evaluates it on the reference suite $R$ (e.g. a battery of math, coding, reasoning, and safety tasks).
4.  Computes $J(\theta', R)$ and compares it to $J(\theta_t, R)$.
5.  Commits or rolls back the patch based on the rule in Section 5.

### 6.4 Example

1.  The agent consistently fails arithmetic tasks because it lacks a calculator.
2.  It notices a pattern in failures and proposes:
    ```json
    update_configuration({
      "add_tool": {
        "name": "python",
        "signature": "code: string",
        "description": "Execute Python code and return the result."
      }
    })
    ```
3.  The Runtime generates $\theta'$ with the new tool, runs the sandbox on $R$, and observes that math and some reasoning tasks now succeed more often.
4.  If $J(\theta', R) \ge J(\theta_t, R) + \varepsilon$, the update is committed.
5.  The next time, $\text{Agent}_{t+1}$ permanently has access to a calculator tool.

Under GEM, this is not “prompt engineering” done by a human. It is self-engineering done by the agent, guarded by a verification layer.

---

## 7. Implications

### 7.1 Structural agency over prompts and tools

In GEM, prompts, tool definitions, and control policies are not fixed implementation details; they are part of $\theta$, and therefore legitimate action targets. The agent is responsible for engineering its own configuration, shaped by the performance functional $J$.

### 7.2 The role and limits of the reference suite R

Because Type 2 updates are accepted based on $J(\theta, R)$, the agent’s evolution is shaped by what $R$ measures.

- If $R$ is narrow, the agent can structurally overfit to a small set of tests.
- If $R$ is broad and diverse, structural improvements are more likely to generalize.

At scale, a self-evolving agent would need to expand and curate $R$ over time, adding new tests when it encounters new failure modes. GEM makes this dependence explicit rather than implicit.

### 7.3 Recursive closure

There is no separate “manager” outside the agent deciding how to update $\theta$. The same evaluator $f(\theta_t, M_t, O_t)$:

- chooses actions in $A_{\text{world}}$ to act on the environment,
- chooses actions in $A_{\text{mem}}$ to shape its memory,
- chooses actions in $A_{\text{sys}}$ to propose changes to itself.

The current intelligence generates hypotheses about a better intelligence, which are then tested against $J$. This is a concrete, operational notion of recursive self-improvement.

---

## 8. Core Definition

We can summarize GEM in one line:

> **An intelligent system is an evaluator $f(\theta, M, O)$ whose action space includes privileged operations that rewrite its own configuration $\theta$, with those rewrites constrained by a performance functional $J$ over a reference suite $R$.**

Everything else — prompts, tools, memory stores, policies, even “agent frameworks” — is just a particular choice of:

- meta-language $\mathcal{M}$ for $\theta$,
- memory structures $M$,
- action space decomposition $A_{\text{world}}, A_{\text{mem}}, A_{\text{sys}}$, and
- verification functional $J$.

GEM’s claim is that once you structure an agent this way, self-improvement is no longer a hack or an afterthought. It is part of the agent’s core interface to itself.

---

## 9. Implementation & Usage

This repository contains a prototype implementation of GEM (`v0`).

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

All configuration changes are logged to: `memory/config_log.jsonl`

Each entry contains:

- `theta_before` / `theta_after`
- `j_before` / `j_after` (Performance scores)
- `committed` (Boolean result)

### Reference Suite

Located in `R/tasks.jsonl`. These are the "tests" the agent must pass to accept a self-update.
