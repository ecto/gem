import * as fs from "fs";
import * as path from "path";
import { Task, Theta } from "./types";
import { runEngine } from "./engine";

const REFERENCE_DIR = path.join(__dirname, "../R");
const TASKS_FILE = path.join(REFERENCE_DIR, "tasks.jsonl");

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

export async function runReference(theta: Theta): Promise<number> {
  const tasks = loadReferenceSuite();
  if (tasks.length === 0) return 0;

  let successes = 0;
  for (const task of tasks) {
    try {
      // We pass empty memory for reference tasks to ensure pure function testing of theta
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
          // Default to includes
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

  return successes / tasks.length;
}
