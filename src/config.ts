/**
 * config.ts
 *
 * Manages the persistence and modification of the Agent Configuration ($\Theta$).
 * This module serves as the interface to the underlying storage of the agent's
 * hyperparameters (system prompt, tools, etc.).
 */

import * as fs from "fs";
import * as path from "path";
import { Theta } from "./types";

// Path to the persistent configuration file
const THETA_PATH = path.join(__dirname, "../theta.json");

/**
 * Loads the current configuration ($\Theta$) from disk.
 *
 * @returns {Theta} The current agent configuration object.
 * @throws {Error} If the configuration file does not exist.
 */
export function loadTheta(): Theta {
  if (!fs.existsSync(THETA_PATH)) {
    throw new Error(`Theta config not found at ${THETA_PATH}`);
  }
  const content = fs.readFileSync(THETA_PATH, "utf-8");
  return JSON.parse(content);
}

/**
 * Persists the configuration ($\Theta$) to disk.
 * This is called after a successful 'sys' action where $J(\Theta') > J(\Theta)$.
 *
 * @param {Theta} theta - The new configuration to save.
 */
export function saveTheta(theta: Theta): void {
  fs.writeFileSync(THETA_PATH, JSON.stringify(theta, null, 2));
}

/**
 * Applies a partial update (patch) to the current configuration.
 * Used to generate a candidate configuration $\Theta'$ from $\Theta$.
 *
 * @param {Theta} theta - The base configuration.
 * @param {Partial<Theta>} patch - The proposed changes.
 * @returns {Theta} The new candidate configuration $\Theta'$.
 */
export function patchTheta(theta: Theta, patch: Partial<Theta>): Theta {
  // Simple shallow merge for v0, deep merge would be better for nested objects
  // For tools, we might want to replace or append. For v0, let's just merge top-level.
  const newTheta = { ...theta, ...patch };

  // Special handling for tools if patch has tools - currently overwrite
  // Future work: Implement granular tool additions/removals
  if (patch.tools) {
    newTheta.tools = patch.tools;
  }

  return newTheta;
}
