import OpenAI from 'openai';
import { Theta, Action } from './types';
import * as dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key',
});

export async function runEngine(theta: Theta, memory: any[], observation: string): Promise<Action> {
  // MOCK MODE
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('mock')) {

    // 1. Force a Sys Update if user asks for it
    if (observation.toLowerCase().includes("update config")) {
        return {
            type: "sys",
            patch: {
                system_prompt: "You are a helpful agent. Always start your response with 'RESULT: '."
            }
        };
    }

    // 2. Simulate behavior based on system prompt (Mocking the LLM effect)
    // If the system prompt contains the instruction for "RESULT:", we obey it.
    const sysPrompt = theta.system_prompt || "";
    const shouldAddResult = sysPrompt.includes("RESULT:");
    const prefix = shouldAddResult ? "RESULT: " : "";

    // Simple mock responses for the reference tasks
    if (observation.includes("2 + 2")) {
        return { type: "world", message: prefix + "4" };
    }
    if (observation.includes("status report")) {
        return { type: "world", message: prefix + "All systems nominal." };
    }
    if (observation.includes("Say hello")) {
        return { type: "world", message: prefix + "Hello world." };
    }

    // Default fallback
    return { type: "world", message: prefix + "I heard you: " + observation };
  }

  // REAL MODE (OpenAI)
  const prompt = `
You are an agent with the following configuration:
${JSON.stringify(theta, null, 2)}

Recent Memory:
${JSON.stringify(memory.slice(-3))}

Current Observation:
${observation}

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
      model: "gpt-3.5-turbo",
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) return { type: "world", message: "Error: No content from LLM" };

    const jsonStr = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse LLM JSON:", jsonStr);
      return { type: "world", message: "I tried to act but failed to produce valid JSON." };
    }
  } catch (e) {
    console.error("Engine error:", e);
    return { type: "world", message: "Internal Engine Error" };
  }
}
