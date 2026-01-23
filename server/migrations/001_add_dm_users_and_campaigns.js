const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dnd.db');
const db = new Database(dbPath);

console.log('Running migration: 001_add_dm_users_and_campaigns.js');

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS dm_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('✓ Created dm_users table');

    db.exec(`
        CREATE TABLE IF NOT EXISTS campaigns (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            dm_user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_active_at DATETIME,
            FOREIGN KEY (dm_user_id) REFERENCES dm_users(id)
        );
    `);
    console.log('✓ Created campaigns table');

    console.log('Migration completed successfully!');
} catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
}

db.close();
