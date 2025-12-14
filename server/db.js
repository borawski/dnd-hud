const Database = require('better-sqlite3');
const path = require('path');

const db = new Database('dnd.db', { verbose: console.log });

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS monsters (
    index_name TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    size TEXT,
    alignment TEXT,
    armor_class INTEGER,
    hit_points INTEGER,
    speed TEXT,
    stats TEXT -- JSON string of str, dex, etc.
  );

  CREATE TABLE IF NOT EXISTS game_state (\r
    id INTEGER PRIMARY KEY CHECK (id = 1),
    active_map TEXT,
    initiative_order TEXT, -- JSON array of combatants
    current_turn_index INTEGER DEFAULT 0,
    current_round INTEGER DEFAULT 1,
    turns_completed INTEGER DEFAULT 0,
    combat_started INTEGER DEFAULT 0,
    turn_start_time TEXT,
    log TEXT -- JSON array of recent actions/rolls
  );
  
  INSERT OR IGNORE INTO game_state (id, active_map, initiative_order, current_turn_index, current_round, turns_completed, combat_started, turn_start_time, log)
  VALUES (1, '', '[]', 0, 1, 0, 0, NULL, '[]');
`);

// Migration: Add missing columns if they don't exist
try {
  db.exec(`ALTER TABLE game_state ADD COLUMN turns_completed INTEGER DEFAULT 0`);
  console.log('✓ Added turns_completed column');
} catch (err) {
  // Column already exists
}

try {
  db.exec(`ALTER TABLE game_state ADD COLUMN combat_started INTEGER DEFAULT 0`);
  console.log('✓ Added combat_started column');
} catch (err) {
  // Column already exists
}

try {
  db.exec(`ALTER TABLE game_state ADD COLUMN turn_start_time TEXT`);
  console.log('✓ Added turn_start_time column');
} catch (err) {
  // Column already exists
}

module.exports = db;
