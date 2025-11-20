/**
 * memory.ts
 *
 * Implements the Episodic Memory system for the agent.
 *
 * In the GEM framework, memory serves as a historical record of state-action pairs.
 * This implementation uses a simple JSONL append-only log to persist episodes.
 *
 * Mathematical Context:
 * If $H_t$ is the history at time $t$, $H_t = \{(O_0, A_0), (O_1, A_1), ..., (O_t, A_t)\}$.
 * This module manages $H$.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Action } from './types';

// Configuration for memory persistence
const MEMORY_DIR = path.join(__dirname, '../memory');
const MEMORY_FILE = path.join(MEMORY_DIR, 'episodes.jsonl');

/**
 * Memory Class
 *
 * Manages the read/write operations for the agent's episodic memory.
 */
export class Memory {
  private data: any[] = [];

  constructor() {
    this.load();
  }

  /**
   * Loads the entire memory history from disk into memory.
   * Used at initialization to restore context.
   */
  load() {
    if (fs.existsSync(MEMORY_FILE)) {
      const content = fs.readFileSync(MEMORY_FILE, 'utf-8');
      this.data = content.trim().split('\n').map(line => {
          try { return JSON.parse(line); } catch (e) { return null; }
      }).filter(x => x);
    }
  }

  /**
   * Appends a new action/event to the memory stream.
   *
   * @param {Action} action - The action performed by the agent (or observation logged).
   * @returns {any[]} The updated memory array.
   */
  apply(action: Action) {
    // Simple append for v0
    const entry = {
      timestamp: new Date().toISOString(),
      ...action
    };
    this.data.push(entry);
    fs.appendFileSync(MEMORY_FILE, JSON.stringify(entry) + '\n');
    return this.data;
  }

  /**
   * Retrieves the $n$ most recent memory entries.
   * Used to populate the agent's immediate context window.
   *
   * @param {number} n - The number of recent items to retrieve (default: 5).
   * @returns {any[]} Array of recent memory items.
   */
  getRecent(n: number = 5): any[] {
    return this.data.slice(-n);
  }
}

