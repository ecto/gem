import { loadTheta, patchTheta } from './config';
import { Memory } from './memory';
import { runEngine } from './engine';
import { runtimeExec } from './runtime';

async function verify() {
  console.log("Verifying GEM components...");

  const theta = loadTheta();
  const memory = new Memory();

  // Test 1: World Action
  console.log("\nTest 1: World Action");
  const action1 = await runEngine(theta, memory.getRecent(), "Hello");
  console.log("Action 1:", action1);
  if (action1.type !== 'world') throw new Error("Expected world action");

  // Test 2: Sys Action (Mock)
  console.log("\nTest 2: Sys Action");
  const action2 = await runEngine(theta, memory.getRecent(), "update config");
  console.log("Action 2:", action2);
  if (action2.type !== 'sys') throw new Error("Expected sys action");

  // Test 3: Runtime Exec
  console.log("\nTest 3: Runtime Execution");
  const thetaPrime = patchTheta(theta, action2.patch);
  const result = await runtimeExec(theta, thetaPrime);
  console.log("Runtime Result:", result);

  if (result.committed) {
      console.log("SUCCESS: Patch committed (or J stayed same).");
  } else {
      console.log("SUCCESS: Patch rejected (as expected if no improvement).");
  }

  // Check if J was computed
  if (result.jNew === undefined || result.jOld === undefined) {
      throw new Error("J values not returned");
  }
}

verify().catch(e => {
    console.error(e);
    process.exit(1);
});

