const Database = require('better-sqlite3');
const path = require('path');
const { hashPassword, generateCampaignId } = require('../auth');

const dbPath = path.join(__dirname, '..', 'dnd.db');
const db = new Database(dbPath);

console.log('Running migration: 003_migrate_existing_data.js');

try {
    // Check if demo user already exists
    const existingUser = db.prepare('SELECT * FROM dm_users WHERE email = ?').get('demo@dnd-hud.com');

    let demoUserId;
    if (existingUser) {
        console.log('- Demo user already exists');
        demoUserId = existingUser.id;
    } else {
        // Create demo DM user
        const demoPassword = hashPassword('changeme123');
        const result = db.prepare(`
            INSERT INTO dm_users (email, password_hash, display_name)
            VALUES (?, ?, ?)
        `).run('demo@dnd-hud.com', demoPassword, 'Demo DM');

        demoUserId = result.lastInsertRowid;
        console.log('✓ Created demo DM user (email: demo@dnd-hud.com, password: changeme123)');
    }

    // Check if default campaign exists
    const existingCampaign = db.prepare('SELECT * FROM campaigns WHERE name = ?').get('Legacy Campaign');

    let campaignId;
    if (existingCampaign) {
        console.log('- Default campaign already exists');
        campaignId = existingCampaign.id;
    } else {
        // Create default campaign
        campaignId = generateCampaignId();
        db.prepare(`
            INSERT INTO campaigns (id, name, dm_user_id)
            VALUES (?, ?, ?)
        `).run(campaignId, 'Legacy Campaign', demoUserId);

        console.log(`✓ Created default campaign (ID: ${campaignId})`);
    }

    // Assign all existing data to default campaign
    const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT IN ('dm_users', 'campaigns', 'sqlite_sequence')
    `).all();

    for (const table of tables) {
        const tableName = table.name;

        // Check if table has campaign_id column
        const columns = db.pragma(`table_info(${tableName})`);
        const hasCampaignId = columns.some(col => col.name === 'campaign_id');

        if (hasCampaignId) {
            // Update rows where campaign_id is NULL
            const result = db.prepare(`
                UPDATE ${tableName} 
                SET campaign_id = ? 
                WHERE campaign_id IS NULL
            `).run(campaignId);

            if (result.changes > 0) {
                console.log(`✓ Assigned ${result.changes} rows in ${tableName} to default campaign`);
            }
        }
    }

    console.log('\nMigration completed successfully!');
    console.log('─────────────────────────────────────');
    console.log('Demo DM Login Credentials:');
    console.log('  Email: demo@dnd-hud.com');
    console.log('  Password: changeme123');
    console.log(`  Campaign ID: ${campaignId}`);
    console.log('─────────────────────────────────────');
} catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
}

db.close();
