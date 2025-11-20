/**
 * reference.ts
 *
 * Implements the Objective Function $J(\Theta)$ for the agent.
 *
 * This module runs a deterministic suite of reference tasks (unit tests for behavior)
 * to evaluate the performance of a given configuration $\Theta$.
 *
 * $J(\Theta) = \frac{1}{N} \sum_{i=1}^{N} \mathbb{I}(Output_i == Expected_i)$
 * where $N$ is the number of reference tasks and $\mathbb{I}$ is the indicator function.
 */

import * as fs from "fs";
import * as path from "path";
import { Task, Theta } from "./types";
import { runEngine } from "./engine";

// Configuration for the reference suite
const REFERENCE_DIR = path.join(__dirname, "../R");
const TASKS_FILE = path.join(REFERENCE_DIR, "tasks.jsonl");

/**
 * Loads the set of reference tasks $T$.
 *
 * @returns {Task[]} An array of tasks (input/expected pairs).
 */
export function loadReferenceSuite(): Task[] {
  if (!fs.existsSync(TASKS_FILE)) {
    return [];
  }
  const content = fs.readFileSync(TASKS_FILE, "utf-8");
  return content
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
}

/**
 * Calculates the objective function $J$ for a given configuration $\Theta$.
 *
 * It executes the agent with configuration $\Theta$ against all tasks in the reference suite.
 * Memory is cleared (empty) for these runs to ensure functional purity of the test.
 *
 * @param {Theta} theta - The configuration to evaluate.
 * @returns {Promise<number>} The score $J \in [0, 1]$ representing the success rate.
 */
export async function runReference(theta: Theta): Promise<number> {
  const tasks = loadReferenceSuite();
  if (tasks.length === 0) return 0;

  let successes = 0;
  for (const task of tasks) {
    try {
      // We pass empty memory for reference tasks to ensure pure function testing of theta
      // This isolates the impact of \Theta from historical drift.
      const action = await runEngine(theta, [], task.input, tasks);

      if (action.type === "world" && action.message) {
        const output = String(action.message).trim();
        let passed = false;

        if (task.eval_type === "regex") {
          const re = new RegExp(task.expected);
          passed = re.test(output);
        } else if (task.eval_type === "exact") {
          passed = output === task.expected;
        } else {
          // Default to simple inclusion check
          passed = output.includes(task.expected);
        }

        if (passed) {
          successes++;
        }
      }
    } catch (e) {
      console.error(`Task ${task.id} failed error:`, e);
    }
  }

  // Return mean accuracy
  return successes / tasks.length;
}
