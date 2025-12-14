const axios = require('axios');
const db = require('./db');

const BASE_URL = 'https://www.dnd5eapi.co';

async function indexMonsters() {
    console.log('Starting monster indexing...');
    try {
        // 1. Fetch list
        const { data } = await axios.get(`${BASE_URL}/api/monsters`);
        const monsters = data.results;

        console.log(`Found ${monsters.length} monsters. Checking database...`);

        const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO monsters (index_name, name, type, size, alignment, armor_class, hit_points, speed, stats)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        // 2. Process each monster
        // We'll do this in batches to be nice to the API
        for (const monsterRef of monsters) {
            const exists = db.prepare('SELECT 1 FROM monsters WHERE index_name = ?').get(monsterRef.index);
            if (exists) continue;

            console.log(`Fetching details for ${monsterRef.name}...`);
            try {
                const { data: m } = await axios.get(`${BASE_URL}${monsterRef.url}`);

                // Extract stats
                const stats = JSON.stringify({
                    strength: m.strength,
                    dexterity: m.dexterity,
                    constitution: m.constitution,
                    intelligence: m.intelligence,
                    wisdom: m.wisdom,
                    charisma: m.charisma,
                });

                const ac = m.armor_class && m.armor_class.length > 0 ? m.armor_class[0].value : 10;
                const speed = JSON.stringify(m.speed);

                insertStmt.run(
                    m.index,
                    m.name,
                    m.type,
                    m.size,
                    m.alignment,
                    ac,
                    m.hit_points,
                    speed,
                    stats
                );

                // Small delay
                await new Promise(r => setTimeout(r, 100));
            } catch (err) {
                console.error(`Failed to fetch ${monsterRef.name}:`, err.message);
            }
        }
        console.log('Monster indexing complete.');
    } catch (error) {
        console.error('Error indexing monsters:', error.message);
    }
}

module.exports = indexMonsters;
