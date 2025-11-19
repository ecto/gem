import * as readline from "readline";
import { loadTheta, saveTheta, patchTheta } from "./config";
import { Memory } from "./memory";
import { runEngine } from "./engine";
import { runtimeExec } from "./runtime";
import { AgentState } from "./types";
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

  let theta = loadTheta();
  const memory = new Memory();
  const referenceTasks = loadReferenceSuite();
  let lastObservation = "Agent started.";

  while (true) {
    // 1. Observation
    const userInput = await ask("\nUser (or 'exit'): ");
    if (userInput.toLowerCase() === "exit") break;

    const observation = userInput || lastObservation;

    // 2. Engine
    const action = await runEngine(
      theta,
      memory.getRecent(),
      observation,
      referenceTasks
    );

    // 3. Dispatch & Apply
    let nextObservation = "";

    switch (action.type) {
      case "world":
        console.log(`\n[WORLD] ${action.message}`);
        nextObservation = `User saw message: "${action.message}"`;
        break;

      case "mem":
        memory.apply(action);
        console.log(`\n[MEM] ${action.note}`);
        nextObservation = "Memory updated.";
        break;

      case "sys":
        console.log(`\n[SYS PROPOSAL] Patching configuration...`);
        console.log(JSON.stringify(action.patch, null, 2));

        const thetaPrime = patchTheta(theta, action.patch);
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

    // 4. Advance
    lastObservation = nextObservation;

    // Implicit log
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
