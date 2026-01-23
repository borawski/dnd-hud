const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dnd.db');
const db = new Database(dbPath);

console.log('Running migration: 002_add_campaign_id_to_existing_tables.js');

try {
    // Check which tables exist and add campaign_id column to them
    const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT IN ('dm_users', 'campaigns', 'sqlite_sequence')
    `).all();

    for (const table of tables) {
        const tableName = table.name;

        // Check if column already exists
        const columns = db.pragma(`table_info(${tableName})`);
        const hasCampaignId = columns.some(col => col.name === 'campaign_id');

        if (!hasCampaignId) {
            db.exec(`ALTER TABLE ${tableName} ADD COLUMN campaign_id TEXT`);
            console.log(`✓ Added campaign_id to ${tableName}`);
        } else {
            console.log(`- ${tableName} already has campaign_id column`);
        }
    }

    console.log('Migration completed successfully!');
} catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
}

db.close();
