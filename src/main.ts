/**
 * main.ts
 *
 * The Main Execution Loop of the GEM Agent.
 *
 * This entry point orchestrates the interaction between:
 * 1. The Environment (User Input / Observation)
 * 2. The Cognitive Engine (LLM + Memory)
 * 3. The Runtime Executive (Self-Improvement)
 *
 * Flow:
 * Loop:
 *   $O_t \leftarrow$ Observe Environment
 *   $A_t \leftarrow \text{Engine}(\Theta_t, M_t, O_t)$
 *   Execute $A_t$:
 *     - If 'world': Output to user
 *     - If 'mem': Update $M_t$
 *     - If 'sys': $\Theta_{t+1} \leftarrow \text{Runtime}(\Theta_t, \Delta\Theta)$
 *   $M_{t+1} \leftarrow M_t \cup \{(O_t, A_t, \text{Result})\}$
 */

import * as readline from "readline";
import { loadTheta, saveTheta, patchTheta } from "./config";
import { Memory } from "./memory";
import { runEngine } from "./engine";
import { runtimeExec } from "./runtime";
import { loadReferenceSuite } from "./reference";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log("GEM Agent v0 starting...");

  // Initialize State
  let theta = loadTheta();
  const memory = new Memory();
  const referenceTasks = loadReferenceSuite();
  let lastObservation = "Agent started.";

  while (true) {
    // 1. Observation Phase ($O_t$)
    const userInput = await ask("\nUser (or 'exit'): ");
    if (userInput.toLowerCase() === "exit") break;

    const observation = userInput || lastObservation;

    // 2. Cognitive Phase (Action Selection)
    // $A_t = \pi(O_t, M_t | \Theta_t)$
    const action = await runEngine(
      theta,
      memory.getRecent(),
      observation,
      referenceTasks
    );

    // 3. Execution & Dispatch Phase
    let nextObservation = "";

    switch (action.type) {
      case "world":
        // External Action
        console.log(`\n[WORLD] ${action.message}`);
        nextObservation = `User saw message: "${action.message}"`;
        break;

      case "mem":
        // Internal Memory Action
        memory.apply(action);
        console.log(`\n[MEM] ${action.note}`);
        nextObservation = "Memory updated.";
        break;

      case "sys":
        // Meta-Cognitive Action (Self-Improvement)
        console.log(`\n[SYS PROPOSAL] Patching configuration...`);
        console.log(JSON.stringify(action.patch, null, 2));

        const thetaPrime = patchTheta(theta, action.patch);
        // Validate $\Theta'$ against objective function $J$
        const result = await runtimeExec(theta, thetaPrime);

        if (result.committed) {
          theta = result.theta;
          saveTheta(theta);
          console.log(
            `[SYS COMMIT] J improved from ${result.jOld.toFixed(
              2
            )} to ${result.jNew.toFixed(2)}`
          );
          nextObservation = "Configuration updated successfully.";
        } else {
          console.log(
            `[SYS ROLLBACK] J failed to improve (${result.jOld.toFixed(
              2
            )} -> ${result.jNew.toFixed(2)})`
          );
          nextObservation = "Self-update failed validation.";
        }
        break;

      default:
        console.log(`[ERROR] Unknown Action Type: ${action.type}`);
        nextObservation = "Action execution failed.";
    }

    // 4. State Transition Phase
    lastObservation = nextObservation;

    // Implicit log of the experience tuple $(O_t, A_t, O_{t+1})$
    memory.apply({
      type: "log",
      input: observation,
      action: action,
      result: nextObservation,
    } as any);
  }

  rl.close();
}

main().catch(console.error);
