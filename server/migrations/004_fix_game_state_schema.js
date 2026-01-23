const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dnd.db');
const db = new Database(dbPath);

console.log('Running migration: 004_fix_game_state_schema.js');

try {
    // SQLite doesn't support dropping constraints, so we need to recreate the table

    // 1. Create new table without the CHECK constraint
    db.exec(`
        CREATE TABLE IF NOT EXISTS game_state_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            campaign_id TEXT NOT NULL,
            active_map TEXT DEFAULT '',
            initiative_order TEXT DEFAULT '[]',
            current_turn_index INTEGER DEFAULT 0,
            current_round INTEGER DEFAULT 1,
            turns_completed INTEGER DEFAULT 0,
            combat_started INTEGER DEFAULT 0,
            turn_start_time TEXT,
            log TEXT DEFAULT '[]',
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
        );
    `);
    console.log('✓ Created new game_state table without CHECK constraint');

    // 2. Copy existing data
    db.exec(`
        INSERT INTO game_state_new (campaign_id, active_map, initiative_order, current_turn_index, current_round, turns_completed, combat_started, turn_start_time, log)
        SELECT campaign_id, active_map, initiative_order, current_turn_index, current_round, turns_completed, combat_started, turn_start_time, log
        FROM game_state
        WHERE campaign_id IS NOT NULL;
    `);
    console.log('✓ Copied existing data');

    // 3. Drop old table
    db.exec(`DROP TABLE game_state;`);
    console.log('✓ Dropped old table');

    // 4. Rename new table
    db.exec(`ALTER TABLE game_state_new RENAME TO game_state;`);
    console.log('✓ Renamed new table to game_state');

    // 5. Create index for faster campaign lookups
    db.exec(`CREATE INDEX IF NOT EXISTS idx_game_state_campaign ON game_state(campaign_id);`);
    console.log('✓ Created index on campaign_id');

    console.log('Migration completed successfully!');
} catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
}

db.close();
