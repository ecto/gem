import OpenAI from "openai";
import { Theta, Action } from "./types";
import * as dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

export async function runEngine(
  theta: Theta,
  memory: any[],
  observation: string,
  referenceTasks: any[] = []
): Promise<Action> {
  // REAL MODE (OpenAI)

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
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-5.1",
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content)
      return { type: "world", message: "Error: No content from LLM" };

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
