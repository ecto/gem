import * as fs from 'fs';
import * as path from 'path';
import { Action } from './types';

const MEMORY_DIR = path.join(__dirname, '../memory');
const MEMORY_FILE = path.join(MEMORY_DIR, 'episodes.jsonl');

export class Memory {
  private data: any[] = [];

  constructor() {
    this.load();
  }

  load() {
    if (fs.existsSync(MEMORY_FILE)) {
      const content = fs.readFileSync(MEMORY_FILE, 'utf-8');
      this.data = content.trim().split('\n').map(line => {
          try { return JSON.parse(line); } catch (e) { return null; }
      }).filter(x => x);
    }
  }

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

  getRecent(n: number = 5): any[] {
    return this.data.slice(-n);
  }
}

