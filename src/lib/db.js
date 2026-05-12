import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data.json');

// Initialize DB file if it doesn't exist
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ lostItems: [], foundItems: [], matches: [] }, null, 2));
  }
}

export function readDB() {
  initDB();
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

export function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}
