const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dnd.db');
const db = new Database(dbPath);

console.log('Running migration: 006_add_google_id.js (v2)');

try {
    // Add google_id column to dm_users
    try {
        db.exec(`ALTER TABLE dm_users ADD COLUMN google_id TEXT;`);
        console.log('✓ Added google_id column to dm_users');
    } catch (err) {
        if (err.message.includes('duplicate column')) {
            console.log('ℹ google_id column already exists');
        } else {
            throw err;
        }
    }

    // Add unique index
    try {
        db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_dm_users_google_id ON dm_users(google_id);`);
        console.log('✓ Created unique index on google_id');
    } catch (err) {
        console.log('ℹ Index creation note:', err.message);
    }

    console.log('Migration completed successfully!');
} catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
}

db.close();
