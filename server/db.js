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
`);


// Note: game_state table schema is now managed by migrations
// See server/migrations/ directory

module.exports = db;
