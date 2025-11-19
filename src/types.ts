export interface Tool {
  name: string;
  signature: string;
  description: string;
}

export interface Theta {
  system_prompt: string;
  tools: Tool[];
  [key: string]: any;
}

export interface Action {
  type: "world" | "mem" | "sys";
  [key: string]: any;
}

export interface AgentState {
  theta: Theta;
  memory: any; // Arbitrary memory structure
  last_observation: string;
}

export interface Task {
  id: string;
  input: string;
  expected: string;
  eval_type?: "exact" | "includes" | "regex";
}

export interface ConfigLogEntry {
  timestamp: string;
  theta_before: Theta;
  theta_after: Theta;
  j_before: number;
  j_after: number;
  committed: boolean;
}
