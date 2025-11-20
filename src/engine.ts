/**
 * engine.ts
 *
 * The Cognitive Engine.
 *
 * This module interfaces with the Large Language Model (LLM) to generate the agent's
 * next action $A_t$ based on the current state $S_t = (\Theta, M, O_t)$.
 *
 * It is responsible for:
 * 1. Constructing the context window (prompt engineering).
 * 2. Invoking the LLM inference.
 * 3. Parsing and validating the LLM's output into a structured Action.
 */

import OpenAI from "openai";
import { Theta, Action } from "./types";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize the LLM client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Executes the cognitive cycle to determine the agent's next move.
 *
 * @param {Theta} theta - The current agent configuration (system prompt, tools).
 * @param {any[]} memory - The recent episodic memory context.
 * @param {string} observation - The current external stimulus/observation.
 * @param {any[]} referenceTasks - (Optional) The set of goals the agent is optimizing for.
 *                                 Provided to guide the agent's meta-cognitive updates.
 *
 * @returns {Promise<Action>} The chosen action (World, Mem, or Sys).
 */
export async function runEngine(
  theta: Theta,
  memory: any[],
  observation: string,
  referenceTasks: any[] = []
): Promise<Action> {
  // Construct the prompt ($P$)
  // $P = f(\Theta, M, O, T)$
  const prompt = `
You are an agent with the following configuration:
${JSON.stringify(theta, null, 2)}

Recent Memory:
${JSON.stringify(memory.slice(-3))}

Current Observation:
${observation}

Reference Tasks (Performance Goals):
The following are the tasks you are evaluated on. Use this information to guide your configuration updates.
${JSON.stringify(
  referenceTasks.map((t: any) => ({ input: t.input, expected: t.expected })),
  null,
  2
)}

You must respond with a JSON object representing your action.
Available Action Types:
1. "world": Interact with the user or environment.
   { "type": "world", "message": "string" }
2. "mem": Write to memory.
   { "type": "mem", "note": "string" }
3. "sys": Propose a configuration update.
   { "type": "sys", "patch": { ...partial theta... } }

Respond ONLY with the JSON object.
`;

  try {
    // $A \sim \pi_{LLM}(P)$
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content)
      return { type: "world", message: "Error: No content from LLM" };

    // Heuristic cleaning of markdown code blocks often returned by LLMs
    const jsonStr = content
      .replace(/^```json\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse LLM JSON:", jsonStr);
      return {
        type: "world",
        message: "I tried to act but failed to produce valid JSON.",
      };
    }
  } catch (e) {
    console.error("Engine error:", e);
    return { type: "world", message: "Internal Engine Error" };
  }
}
