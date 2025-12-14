const fs = require('fs');

// Load the player mock JSON
const response = JSON.parse(fs.readFileSync('client/player_mock.json', 'utf8'));
const playerData = response.data; // Data is nested!

console.log('=== MODIFIERS STRUCTURE ===');
console.log('Keys in modifiers:', Object.keys(playerData.modifiers || {}));

if (playerData.modifiers?.class) {
    console.log('\n=== CLASS MODIFIERS COUNT:', playerData.modifiers.class.length);

    // Look at first few modifiers
    console.log('\nFirst 3 class modifiers:');
    playerData.modifiers.class.slice(0, 3).forEach((mod, idx) => {
        console.log(`\nModifier ${idx}:`, JSON.stringify(mod, null, 2));
    });

    // Find damage-related modifiers
    const damageMods = playerData.modifiers.class.filter(mod =>
        mod.type === 'damage' || mod.friendlyTypeName?.toLowerCase().includes('damage')
    );

    console.log(`\n\n=== DAMAGE MODIFIERS (${damageMods.length}) ===`);
    damageMods.forEach((mod, idx) => {
        console.log(`\nDamage Mod ${idx}:`);
        console.log('  Type:', mod.type);
        console.log('  friendlyTypeName:', mod.friendlyTypeName);
        console.log('  friendlySubtypeName:', mod.friendlySubtypeName);
        console.log('  entityId:', mod.entityId);
        console.log('  entityTypeId:', mod.entityTypeId);
        console.log('  value:', mod.value);
        console.log('  componentId:', mod.componentId);
    });
}

console.log('\n\n=== SPELLS STRUCTURE ===');
if (playerData.spells?.class) {
    console.log('Class spells count:', playerData.spells.class.length);
    const spell = playerData.spells.class[0];
    if (spell) {
        console.log('\nFirst spell:', spell.definition?.name);
        console.log('Spell ID:', spell.definition?.id);
        console.log('Spell keys:', Object.keys(spell));
    }
}
