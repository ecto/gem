import * as fs from "fs";
import * as path from "path";
import { Theta } from "./types";

const THETA_PATH = path.join(__dirname, "../theta.json");

export function loadTheta(): Theta {
  if (!fs.existsSync(THETA_PATH)) {
    throw new Error(`Theta config not found at ${THETA_PATH}`);
  }
  const content = fs.readFileSync(THETA_PATH, "utf-8");
  return JSON.parse(content);
}

export function saveTheta(theta: Theta): void {
  fs.writeFileSync(THETA_PATH, JSON.stringify(theta, null, 2));
}

export function patchTheta(theta: Theta, patch: Partial<Theta>): Theta {
  // Simple shallow merge for v0, deep merge would be better for nested objects
  // For tools, we might want to replace or append. For v0, let's just merge top-level.
  const newTheta = { ...theta, ...patch };

  // Special handling for tools if patch has tools - currently overwrite
  if (patch.tools) {
    newTheta.tools = patch.tools;
  }

  return newTheta;
}
