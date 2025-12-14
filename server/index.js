const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Server } = require('socket.io');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
}

const server = require('http').createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Get game state
app.get('/api/gamestate', (req, res) => {
    const state = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
    console.log('SELECT * FROM game_state WHERE id = 1');
    state.initiative_order = JSON.parse(state.initiative_order);
    state.log = JSON.parse(state.log);
    state.combat_started = Boolean(state.combat_started);
    res.json(state);
});

// Update game state
app.post('/api/gamestate', (req, res) => {
    const { active_map, initiative_order, current_turn_index, current_round, combat_started, turn_start_time, log } = req.body;

    const stmt = db.prepare(`
    UPDATE game_state 
    SET active_map = COALESCE(?, active_map),
        initiative_order = COALESCE(?, initiative_order),
        current_turn_index = COALESCE(?, current_turn_index),
        current_round = COALESCE(?, current_round),
        combat_started = COALESCE(?, combat_started),
        turn_start_time = COALESCE(?, turn_start_time),
        log = COALESCE(?, log)
    WHERE id = 1
  `);

    stmt.run(
        active_map,
        initiative_order ? JSON.stringify(initiative_order) : null,
        current_turn_index,
        current_round,
        combat_started !== undefined ? (combat_started ? 1 : 0) : null,
        turn_start_time,
        log ? JSON.stringify(log) : null
    );

    const newState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
    newState.initiative_order = JSON.parse(newState.initiative_order);
    newState.log = JSON.parse(newState.log);
    newState.combat_started = Boolean(newState.combat_started);

    io.emit('state_update', newState);
    res.json(newState);
});

// Get all monsters (with optional search query)
app.get('/api/monsters', (req, res) => {
    const searchQuery = req.query.q;

    let monsters;
    if (searchQuery && searchQuery.trim().length > 0) {
        // Search monsters by name (case-insensitive)
        monsters = db.prepare('SELECT * FROM monsters WHERE name LIKE ? COLLATE NOCASE')
            .all(`%${searchQuery}%`);
    } else {
        // Return all monsters if no query
        monsters = db.prepare('SELECT * FROM monsters').all();
    }

    res.json(monsters.map(m => ({
        ...m,
        stats: JSON.parse(m.stats),
        speed: JSON.parse(m.speed),
        // Add url for compatibility with the frontend
        url: `/api/monsters/${m.index_name}`
    })));
});

//  ============================================
//  COMPREHENSIVE D&D BEYOND CHARACTER IMPORTER  
//  ============================================

app.post('/api/import-character', async (req, res) => {
    try {
        const { characterId } = req.body;

        // Validate characterId
        if (!characterId || characterId === 'undefined' || characterId === 'null') {
            return res.status(400).json({ error: 'Valid character ID is required' });
        }

        const response = await axios.get(`https://character-service.dndbeyond.com/character/v5/character/${characterId}`);
        const char = response.data.data;

        // === HELPER FUNCTIONS ===
        const getMod = (score) => Math.floor((score - 10) / 2);

        // Strip HTML tags from descriptions
        const stripHtml = (html) => {
            if (!html) return '';
            return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '—').replace(/&amp;/g, '&').replace(/&rsquo;/g, "'").replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"').trim();
        };

        // Get stat value
        const getStatValue = (statId) => {
            const stat = char.stats.find(s => s.id === statId);
            return stat ? stat.value : 10;
        };

        // === BASIC INFO ===
        const name = char.name;
        const level = char.classes[0]?.level || 1;
        const profBonus = Math.ceil(1 + (level / 4));

        // === STATS ===
        const stats = {
            str: getStatValue(1),
            dex: getStatValue(2),
            con: getStatValue(3),
            int: getStatValue(4),
            wis: getStatValue(5),
            cha: getStatValue(6)
        };

        // === HP ===
        const maxHp = char.baseHitPoints + (char.bonusHitPoints || 0);
        const hp = maxHp - (char.removedHitPoints || 0);

        // === AC ===
        let ac = 10 + getMod(stats.dex);
        const armor = char.inventory?.find(i => i.equipped && i.definition?.filterType === 'Armor');
        if (armor) ac = armor.definition.armorClass + (armor.definition.armorTypeId === 1 ? getMod(stats.dex) : 0);
        const shield = char.inventory?.find(i => i.equipped && i.definition?.name?.includes('Shield'));
        let shieldBonus = 0;
        if (shield) shieldBonus = 2;
        ac += shieldBonus;

        // === PASSIVE PERCEPTION ===
        const passivePerception = 10 + getMod(stats.wis);

        // === SPELLCASTING INFO ===
        const spellcastingAbility = char.classes[0]?.definition?.spellCastingAbilityId || 6; // Default CHA
        const spellcastingMod = getMod(getStatValue(spellcastingAbility));
        const spellSaveDC = 8 + profBonus + spellcastingMod;
        const spellAttackBonus = profBonus + spellcastingMod;

        // ============================================
        // COMPREHENSIVE ACTION PARSING
        // ============================================
        const actions = [];

        // Build spell damage modifier map from character modifiers
        const spellDamageMods = {};
        if (char.modifiers?.class) {
            console.log('\n=== CLASS MODIFIERS ===');
            console.log('Total class modifiers:', char.modifiers.class.length);

            const damageMods = char.modifiers.class.filter(m => m.type === 'damage');
            console.log('Damage modifiers found:', damageMods.length);
            damageMods.forEach(mod => {
                console.log('  -', mod.friendlyTypeName || mod.type, '|', mod.friendlySubtypeName || mod.subType);
                console.log('    entityId:', mod.entityId, 'value:', mod.value, 'statId:', mod.statId);
            });

            char.modifiers.class.forEach(mod => {
                if (mod.type === 'damage' && mod.entityId) {
                    if (!spellDamageMods[mod.entityId]) {
                        spellDamageMods[mod.entityId] = 0;
                    }
                    spellDamageMods[mod.entityId] += (mod.value || spellcastingMod);
                }
            });

            console.log('\nBuilt damage modifier map:', spellDamageMods);
        }

        // === 1. EQUIPPED WEAPONS ===
        if (char.inventory) {
            char.inventory.forEach(item => {
                if (item.equipped && item.definition?.filterType === 'Weapon') {
                    const weapon = item.definition;

                    // Determine if STR or DEX based attack
                    const isFinesse = weapon.properties?.some(p => p.name === 'Finesse');
                    const attackStat = isFinesse ? Math.max(stats.str, stats.dex) : stats.str;
                    const attackMod = getMod(attackStat);
                    const attackBonus = profBonus + attackMod;
                    const damageBonus = attackMod;

                    const properties = weapon.properties?.map(p => p.name).join(', ') || '';
                    const range = weapon.range ? `Range ${weapon.range}${weapon.longRange ? `/${weapon.longRange}` : ''} ft.` : 'Melee';

                    actions.push({
                        name: `${weapon.name}`,
                        type: 'weapon',
                        attackBonus: `+${attackBonus}`,
                        damage: `${weapon.damage?.diceString || '1d6'} + ${damageBonus}`,
                        damageType: weapon.damageType || 'slashing',
                        desc: `${range}. ${properties ? `Properties: ${properties}.` : ''}`,
                        equipped: true
                    });
                }
            });
        }

        // === 2. ALL SPELLS (CANTRIPS + LEVELED) ===
        if (char.spells?.class) {
            char.spells.class.forEach(spell => {
                const def = spell.definition;
                if (!def) return;

                const level = def.level === 0 ? 'Cantrip' : `Level ${def.level}`;
                const prepStatus = spell.prepared ? ' ⭐' : '';
                const ritual = def.ritual ? ' (Ritual)' : '';

                // Parse damage from description and apply modifiers
                let damageDisplay = null;
                let damageType = null;
                const descText = stripHtml(def.description || '');
                const damageMatch = descText.match(/(\d+d\d+)\s+(\w+)\s+damage/i);
                if (damageMatch) {
                    const baseDice = damageMatch[1];
                    damageType = damageMatch[2];
                    const damageBonus = spellDamageMods[def.id] || 0;
                    damageDisplay = damageBonus > 0 ? `${baseDice}+${damageBonus}` : baseDice;
                }

                // Determine if it's an attack spell or save spell
                let attackInfo = '';
                if (def.attackType === 1) { // Ranged spell attack
                    attackInfo = `Spell Attack: +${spellAttackBonus} to hit. `;
                } else if (def.saveDcAbilityId) {
                    const saveAbility = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'][def.saveDcAbilityId - 1];
                    attackInfo = `Save DC ${spellSaveDC} ${saveAbility}. `;
                }

                // Range and casting time
                const castTime = def.activation ? `${def.activation.activationTime} ${def.activation.activationType === 1 ? 'action' : 'bonus action'}` : '1 action';
                const range = def.range?.rangeValue ? `${def.range.rangeValue}ft` : (def.range?.origin || 'Touch');
                const duration = def.duration?.durationType || 'Instantaneous';

                // Components (1=V, 2=S, 3=M)
                const componentMap = { 1: 'V', 2: 'S', 3: 'M' };
                const components = (def.components || []).map(c => componentMap[c]).filter(Boolean).join(', ');

                actions.push({
                    name: `${def.name}${prepStatus}`,
                    type: 'spell',
                    level: level,
                    school: def.school,
                    attackBonus: def.attackType === 1 ? `+${spellAttackBonus}` : null,
                    saveDC: def.saveDcAbilityId ? spellSaveDC : null,
                    damage: damageDisplay,
                    damageType: damageType,
                    desc: `${attackInfo}Casting Time: ${castTime}. Range: ${range}. ${components ? `Components: ${components}. ` : ''}Duration: ${duration}. ${descText}${ritual}`,
                    prepared: spell.prepared
                });
            });
        }

        // === 3. RACIAL SPELLS (e.g., Tiefling cantrips) ===
        if (char.spells?.race) {
            char.spells.race.forEach(spell => {
                const def = spell.definition;
                if (!def) return;

                const level = def.level === 0 ? 'Cantrip' : `Level ${def.level}`;

                actions.push({
                    name: `${def.name} (Racial)`,
                    type: 'spell',
                    level: level,
                    desc: stripHtml(def.snippet || def.description || ''),
                    prepared: true
                });
            });
        }

        // === 4. CLASS FEATURES WITH ACTIONS ===
        if (char.options?.class) {
            char.options.class.forEach(feature => {
                const def = feature.definition;
                if (!def || !def.snippet) return;

                // Check if it has limited uses
                let usageInfo = '';
                if (feature.limitedUse) {
                    usageInfo = ` (${feature.limitedUse.numberUsed || 0}/${feature.limitedUse.maxUses} uses)`;
                }

                actions.push({
                    name: `${def.name}${usageInfo}`,
                    type: 'feature',
                    desc: stripHtml(def.snippet || def.description || '')
                });
            });
        }

        // === 5. RACIAL TRAITS ===
        if (char.race?.racialTraits) {
            char.race.racialTraits.forEach(trait => {
                const def = trait.definition;
                if (!def || !def.snippet || def.hideInSheet) return;

                actions.push({
                    name: def.name,
                    type: 'trait',
                    desc: stripHtml(def.snippet || def.description || '')
                });
            });
        }

        // === 6. FEAT ACTIONS ===
        if (char.options?.feat) {
            char.options.feat.forEach(feat => {
                const def = feat.definition;
                if (!def || !def.snippet) return;

                actions.push({
                    name: def.name,
                    type: 'feat',
                    desc: stripHtml(def.snippet || def.description || '')
                });
            });
        }

        // === EQUIPMENT (separate from actions) ===
        const equipment = [];
        if (char.inventory) {
            char.inventory
                .filter(item => item.equipped && item.definition)
                .forEach(item => {
                    equipment.push({
                        name: item.definition.name,
                        type: item.definition.filterType,
                        equipped: true
                    });
                });
        }

        // === CREATE CHARACTER OBJECT ===
        const newCharacter = {
            id: `player-${characterId}-${Date.now()}`,
            name,
            initiative: 0,
            type: 'player',
            hp,
            maxHp,
            ac,
            stats,
            level,
            proficiencyBonus: profBonus,
            spellSaveDC,
            spellAttackBonus,
            passivePerception,
            actions,           // Comprehensive actions array
            equipment,         // Equipment array
            has_acted: false,
            // Import mode metadata
            importMode: 'dndbeyond',
            dndbeyondId: characterId,
            syncEnabled: false
        };

        // === ADD TO GAME STATE ===
        const state = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
        const initiativeOrder = JSON.parse(state.initiative_order);
        initiativeOrder.push(newCharacter);

        db.prepare('UPDATE game_state SET initiative_order = ? WHERE id = 1').run(JSON.stringify(initiativeOrder));

        const newState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
        newState.initiative_order = JSON.parse(newState.initiative_order);
        newState.log = JSON.parse(newState.log);
        newState.combat_started = Boolean(newState.combat_started);

        io.emit('state_update', newState);
        res.json(newState);

    } catch (error) {
        console.error('Error importing character:', error);
        res.status(500).json({ error: 'Failed to import character' });
    }
});

// ============================================
// MANUAL PLAYER CREATION
// ============================================
app.post('/api/create-manual-player', async (req, res) => {
    try {
        const { name, stats, hp, maxHp, ac, level } = req.body;

        // Validate required fields
        if (!name || !stats || hp === undefined || maxHp === undefined || ac === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Calculate derived stats
        const getMod = (score) => Math.floor((score - 10) / 2);
        const profBonus = Math.ceil(1 + (level || 1) / 4);

        const newCharacter = {
            id: `player-manual-${Date.now()}`,
            name,
            initiative: 0,
            type: 'player',
            hp,
            maxHp,
            ac,
            stats,
            level: level || 1,
            proficiencyBonus: profBonus,
            passivePerception: 10 + getMod(stats.wis),
            actions: [],
            equipment: [],
            has_acted: false,
            // Import mode metadata
            importMode: 'manual',
            dndbeyondId: null,
            syncEnabled: false
        };

        // Add to game state
        const state = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
        const initiativeOrder = JSON.parse(state.initiative_order);
        initiativeOrder.push(newCharacter);

        db.prepare('UPDATE game_state SET initiative_order = ? WHERE id = 1').run(JSON.stringify(initiativeOrder));

        const newState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
        newState.initiative_order = JSON.parse(newState.initiative_order);
        newState.log = JSON.parse(newState.log);
        newState.combat_started = Boolean(newState.combat_started);

        io.emit('state_update', newState);
        res.json(newState);

    } catch (error) {
        console.error('Error creating manual player:', error);
        res.status(500).json({ error: 'Failed to create manual player' });
    }
});

// ============================================
// SYNC PLAYER FROM D&D BEYOND
// ============================================
app.post('/api/sync-player/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;

        // Get current game state
        const state = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
        const initiativeOrder = JSON.parse(state.initiative_order);

        // Find the player
        const playerIndex = initiativeOrder.findIndex(c => c.id === playerId);
        if (playerIndex === -1) {
            return res.status(404).json({ error: 'Player not found' });
        }

        const player = initiativeOrder[playerIndex];

        // Check if player is a D&D Beyond import
        if (player.importMode !== 'dndbeyond' || !player.dndbeyondId) {
            return res.status(400).json({ error: 'Player is not a D&D Beyond import' });
        }

        // Fetch fresh data from D&D Beyond
        const response = await axios.get(`https://character-service.dndbeyond.com/character/v5/character/${player.dndbeyondId}`);
        const char = response.data.data;

        // Update HP (main sync target)
        const maxHp = char.baseHitPoints + (char.bonusHitPoints || 0);
        const hp = maxHp - (char.removedHitPoints || 0);

        // Update player in initiative order
        initiativeOrder[playerIndex] = {
            ...player,
            hp,
            maxHp
        };

        // Save updated state
        db.prepare('UPDATE game_state SET initiative_order = ? WHERE id = 1').run(JSON.stringify(initiativeOrder));

        const newState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
        newState.initiative_order = JSON.parse(newState.initiative_order);
        newState.log = JSON.parse(newState.log);
        newState.combat_started = Boolean(newState.combat_started);

        io.emit('state_update', newState);
        res.json({
            success: true,
            syncedData: { hp, maxHp },
            state: newState
        });

    } catch (error) {
        console.error('Error syncing player:', error);
        res.status(500).json({ error: 'Failed to sync player from D&D Beyond' });
    }
});

// ============================================
// UPDATE PLAYER SYNC TOGGLE
// ============================================
app.post('/api/update-player-sync/:playerId', (req, res) => {
    try {
        const { playerId } = req.params;
        const { syncEnabled } = req.body;

        // Get current game state
        const state = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
        const initiativeOrder = JSON.parse(state.initiative_order);

        // Find and update player
        const playerIndex = initiativeOrder.findIndex(c => c.id === playerId);
        if (playerIndex === -1) {
            return res.status(404).json({ error: 'Player not found' });
        }

        initiativeOrder[playerIndex].syncEnabled = syncEnabled;

        // Save updated state
        db.prepare('UPDATE game_state SET initiative_order = ? WHERE id = 1').run(JSON.stringify(initiativeOrder));

        const newState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
        newState.initiative_order = JSON.parse(newState.initiative_order);
        newState.log = JSON.parse(newState.log);
        newState.combat_started = Boolean(newState.combat_started);

        io.emit('state_update', newState);
        res.json(newState);

    } catch (error) {
        console.error('Error updating player sync:', error);
        res.status(500).json({ error: 'Failed to update player sync setting' });
    }
});

// ============================================
// UPDATE MANUAL PLAYER STATS
// ============================================
app.post('/api/update-player-stats/:playerId', (req, res) => {
    try {
        const { playerId } = req.params;
        const { stats } = req.body;

        // Get current game state
        const state = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
        const initiativeOrder = JSON.parse(state.initiative_order);

        // Find and update player
        const playerIndex = initiativeOrder.findIndex(c => c.id === playerId);
        if (playerIndex === -1) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Update stats
        initiativeOrder[playerIndex].stats = stats;

        // Recalculate passive perception
        const getMod = (score) => Math.floor((score - 10) / 2);
        initiativeOrder[playerIndex].passivePerception = 10 + getMod(stats.wis);

        // Save updated state
        db.prepare('UPDATE game_state SET initiative_order = ? WHERE id = 1').run(JSON.stringify(initiativeOrder));

        const newState = db.prepare('SELECT * FROM game_state WHERE id = 1').get();
        newState.initiative_order = JSON.parse(newState.initiative_order);
        newState.log = JSON.parse(newState.log);
        newState.combat_started = Boolean(newState.combat_started);

        io.emit('state_update', newState);
        res.json(newState);

    } catch (error) {
        console.error('Error updating player stats:', error);
        res.status(500).json({ error: 'Failed to update player stats' });
    }
});

// Serve React app for all other routes (must be after API routes)
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
}

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
