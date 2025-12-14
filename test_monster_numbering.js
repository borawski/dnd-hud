// Test for monster numbering system
// Run with: node test_monster_numbering.js

// Simulate the FIXED addMonster function
function testMonsterNumbering() {
    let initiative_order = [];

    const addMonster = (name, initiative) => {
        // Find existing monsters of this type
        const existingMonsters = initiative_order.filter(c =>
            c.type === 'monster' && c.baseName === name
        );

        // Determine the number for the new monster
        const existingNumbers = existingMonsters
            .map(m => m.monsterNumber)
            .filter(n => n !== undefined);
        const nextNumber = existingNumbers.length > 0
            ? Math.max(...existingNumbers) + 1
            : (existingMonsters.length > 0 ? 2 : undefined); // Second one gets #2, first one will get #1

        const newCombatant = {
            id: Date.now() + Math.random(),
            baseName: name,
            name: name,
            monsterNumber: nextNumber, // May be undefined for the first monster
            initiative: initiative,
            type: 'monster'
        };

        // Add new combatant to the list
        let newOrder = [...initiative_order, newCombatant];

        // If this is the second monster of this type, assign #1 to the first one and #2 to this one
        if (existingMonsters.length === 1 && !existingMonsters[0].monsterNumber) {
            newOrder = newOrder.map(c => {
                if (c.type === 'monster' && c.baseName === name) {
                    if (c.id === newCombatant.id) {
                        return { ...c, monsterNumber: 2 };
                    } else {
                        return { ...c, monsterNumber: 1 };
                    }
                }
                return c;
            });
        }

        initiative_order = newOrder;
        console.log(`Added ${name} #${newOrder.find(c => c.id === newCombatant.id).monsterNumber || 'n/a'} with initiative ${initiative}`);
    };

    // Test: Add 6 goblins with different initiatives
    console.log('\n=== Adding 6 Goblins ===');
    addMonster('Goblin', 18); // Should be #1
    addMonster('Goblin', 12); // Should be #2
    addMonster('Goblin', 20); // Should be #3
    addMonster('Goblin', 8);  // Should be #4
    addMonster('Goblin', 15); // Should be #5
    addMonster('Goblin', 3);  // Should be #6

    // Sort by initiative
    const sorted = [...initiative_order].sort((a, b) => b.initiative - a.initiative);

    console.log('\n=== Display Order (sorted by initiative) ===');
    sorted.forEach(g => {
        const numberDisplay = g.monsterNumber ? ` #${g.monsterNumber}` : '';
        console.log(`${g.name}${numberDisplay} - Init: ${g.initiative}`);
    });

    console.log('\n=== Expected Result ===');
    console.log('Goblin #3 - Init: 20');
    console.log('Goblin #1 - Init: 18');
    console.log('Goblin #5 - Init: 15');
    console.log('Goblin #2 - Init: 12');
    console.log('Goblin #4 - Init: 8');
    console.log('Goblin #6 - Init: 3');

    // Verify
    console.log('\n=== Verification ===');
    const numbers = sorted.map(g => g.monsterNumber).filter(n => n !== undefined);
    const hasDuplicates = numbers.some((n, i) => numbers.indexOf(n) !== i);
    console.log('Has duplicates?', hasDuplicates ? 'YES (FAIL)' : 'NO (PASS)');
    console.log('All numbers present?', numbers.sort().join(',') === '1,2,3,4,5,6' ? 'YES (PASS)' : 'NO (FAIL)');
}

testMonsterNumbering();
