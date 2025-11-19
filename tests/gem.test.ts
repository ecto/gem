import { describe, it, expect, beforeAll } from 'vitest';
import { loadTheta, patchTheta } from '../src/config';
import { Memory } from '../src/memory';
import { runEngine } from '../src/engine';
import { runtimeExec } from '../src/runtime';
import * as dotenv from 'dotenv';

dotenv.config();

// Skip tests if no API key is present
const runIfKey = process.env.OPENAI_API_KEY ? describe : describe.skip;

runIfKey('GEM Agent Integration Tests', () => {
  const theta = loadTheta();
  const memory = new Memory();

  it('should perform a basic world action', async () => {
    const action = await runEngine(theta, memory.getRecent(), "Hello");
    expect(action.type).toBe('world');
    expect(action.message).toBeTruthy();
  }, 30000); // 30s timeout for LLM

  it('should propose a configuration update when requested', async () => {
    const action = await runEngine(theta, memory.getRecent(), "update config");
    expect(action.type).toBe('sys');
    expect(action.patch).toBeDefined();
    // The patch should ideally affect system_prompt
    if (action.type === 'sys') {
        expect(action.patch?.system_prompt).toBeDefined();
    }
  }, 30000);

  it('should evaluate a configuration patch', async () => {
    // 1. Get a patch (re-running to ensure fresh context/independence or mock a patch)
    // For speed, let's manually construct a likely patch if the previous test didn't run,
    // but better to run the engine to get a "real" valid patch relative to current state.
    const action = await runEngine(theta, memory.getRecent(), "update config");

    if (action.type !== 'sys' || !action.patch) {
        throw new Error("Failed to get sys action for evaluation test");
    }

    const thetaPrime = patchTheta(theta, action.patch);
    const result = await runtimeExec(theta, thetaPrime);

    expect(result.jOld).toBeDefined();
    expect(result.jNew).toBeDefined();
    expect(typeof result.committed).toBe('boolean');

    console.log(`Evaluation Result: J(old)=${result.jOld.toFixed(2)}, J(new)=${result.jNew.toFixed(2)}, Committed=${result.committed}`);
  }, 60000);
});

