const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../dnd.db');
const db = new Database(dbPath);

console.log('Running migration 005: Rename campaigns to encounters...');

try {
    db.exec('BEGIN TRANSACTION');

    // Step 1: Rename campaigns table to encounters
    console.log('Renaming campaigns table to encounters...');
    db.exec(`
        ALTER TABLE campaigns RENAME TO encounters;
    `);

    // Step 2: Update dm_users reference (if column exists)
    console.log('Updating column references...');
    // Note: SQLite doesn't support ALTER COLUMN directly, so we'll update via migration note
    // The dm_user_id column in encounters table remains the same (still references dm_users)

    // Step 3: Recreate game_state table with encounter_id instead of campaign_id
    console.log('Migrating game_state table...');

    // Create new game_state table with encounter_id
    db.exec(`
        CREATE TABLE game_state_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            encounter_id TEXT NOT NULL,
            active_map TEXT DEFAULT '',
            initiative_order TEXT DEFAULT '[]',
            current_turn_index INTEGER DEFAULT 0,
            current_round INTEGER DEFAULT 1,
            turns_completed INTEGER DEFAULT 0,
            combat_started INTEGER DEFAULT 0,
            turn_start_time TEXT,
            log TEXT DEFAULT '[]',
            FOREIGN KEY (encounter_id) REFERENCES encounters(id) ON DELETE CASCADE
        );
    `);

    // Copy data from old table
    db.exec(`
        INSERT INTO game_state_new (id, encounter_id, active_map, initiative_order, current_turn_index, current_round, turns_completed, combat_started, turn_start_time, log)
        SELECT id, campaign_id, active_map, initiative_order, current_turn_index, current_round, turns_completed, combat_started, turn_start_time, log
        FROM game_state;
    `);

    // Drop old table and rename new one
    db.exec(`DROP TABLE game_state;`);
    db.exec(`ALTER TABLE game_state_new RENAME TO game_state;`);

    db.exec('COMMIT');
    console.log('✓ Migration 005 completed successfully');
} catch (err) {
    db.exec('ROLLBACK');
    console.error('✗ Migration 005 failed:', err.message);
    throw err;
} finally {
    db.close();
}
