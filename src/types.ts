/**
 * types.ts
 *
 * Defines the core data structures for the GEM (Generative Episodic Memory) system.
 * This file establishes the ontology for the agent's state space, action space,
 * and configuration parameters.
 */

/**
 * Represents a callable tool available to the agent.
 * Part of the static configuration ($\Theta$).
 */
export interface Tool {
  /** Unique identifier for the tool */
  name: string;
  /** Function signature describing inputs/outputs */
  signature: string;
  /** Natural language description of the tool's purpose */
  description: string;
}

/**
 * $\Theta$ (Theta): The Agent Configuration.
 *
 * This interface represents the hyperparameters of the agent's cognitive architecture.
 * It includes the system prompt (meta-instructions) and the set of available tools.
 * In this framework, $\Theta$ is mutable and subject to optimization.
 */
export interface Theta {
  /** The foundational instructions governing agent behavior */
  system_prompt: string;
  /** The set of executable capabilities available to the agent */
  tools: Tool[];
  /** Allow for flexible schema expansion */
  [key: string]: any;
}

/**
 * The Action Space ($A$).
 *
 * Defines the set of possible operations the agent can perform in a given state.
 * - 'world': External interaction (e.g., replying to user).
 * - 'mem': Internal state update (episodic memory).
 * - 'sys': Meta-cognitive update (modifying $\Theta$).
 */
export interface Action {
  type: "world" | "mem" | "sys";
  [key: string]: any;
}

/**
 * A Reference Task ($T$).
 *
 * Used to calculate the objective function $J(\Theta)$.
 * Represents a ground-truth example of desired behavior.
 */
export interface Task {
  id: string;
  input: string;
  expected: string;
  eval_type?: "exact" | "includes" | "regex";
}

/**
 * Configuration Change Log Entry.
 *
 * Records the trajectory of $\Theta$ through the optimization landscape.
 * Used for auditing the self-improvement process.
 */
export interface ConfigLogEntry {
  timestamp: string;
  theta_before: Theta;
  theta_after: Theta;
  j_before: number;
  j_after: number;
  committed: boolean;
}
