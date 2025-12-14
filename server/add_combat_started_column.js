const db = require('./db');

try {
    // Add combat_started column if it doesn't exist
    db.prepare('ALTER TABLE game_state ADD COLUMN combat_started INTEGER DEFAULT 0').run();
    console.log('Successfully added combat_started column');
} catch (err) {
    if (err.message.includes('duplicate column name')) {
        console.log('Column combat_started already exists');
    } else {
        console.error('Error adding column:', err);
    }
}

process.exit(0);
