import React, { useState } from 'react';
import { Search, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { API_URL } from '../../config';

const MonsterSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { gameState, updateState } = useGame();

    const searchMonsters = async (e) => {
        const q = e.target.value;
        setQuery(q);

        if (q.length === 0) {
            setResults([]);
            return;
        }

        if (q.length < 2) return;

        try {
            const res = await fetch(`${API_URL}/api/monsters?q=${q}`);
            const data = await res.json();
            setResults(data);
        } catch (err) {
            console.error(err);
        }
    };

    const addMonster = async (monster) => {
        console.log('Adding monster:', monster.name);
        console.log('Monster URL:', monster.url);

        // Fetch full monster details from D&D 5e API
        let fullMonsterData = null;
        try {
            const apiUrl = `https://www.dnd5eapi.co${monster.url}`;
            console.log('Fetching from:', apiUrl);
            const detailRes = await fetch(apiUrl);
            fullMonsterData = await detailRes.json();
            console.log('Fetched full data:', fullMonsterData);
        } catch (err) {
            console.error('Failed to fetch full monster data:', err);
        }

        // Use full data if available, otherwise use basic monster from search
        const monsterData = fullMonsterData || monster;

        // Get dexterity with fallback
        const dexterity = monsterData.dexterity || 10;
        const dexMod = Math.floor((dexterity - 10) / 2);
        const initiativeRoll = Math.floor(Math.random() * 20) + 1 + dexMod;

        console.log('DEX:', dexterity, 'Modifier:', dexMod, 'Initiative:', initiativeRoll);

        // Find existing monsters of this type
        const existingMonsters = gameState.initiative_order.filter(c =>
            c.type === 'monster' && c.baseName === monster.name
        );

        // Determine the number for the new monster
        const existingNumbers = existingMonsters
            .map(m => m.monsterNumber)
            .filter(n => n !== undefined);
        const nextNumber = existingNumbers.length > 0
            ? Math.max(...existingNumbers) + 1
            : (existingMonsters.length > 0 ? 2 : undefined);

        const newCombatant = {
            id: Date.now(),
            baseName: monster.name,
            name: monster.name,
            monsterNumber: nextNumber,
            hp: monsterData.hit_points,
            maxHp: monsterData.hit_points,
            ac: typeof monsterData.armor_class === 'number'
                ? monsterData.armor_class
                : (monsterData.armor_class?.[0]?.value || 10),
            initiative: initiativeRoll,
            type: 'monster',
            // Store full stats with defaults
            stats: {
                str: monsterData.strength || 10,
                dex: monsterData.dexterity || 10,
                con: monsterData.constitution || 10,
                int: monsterData.intelligence || 10,
                wis: monsterData.wisdom || 10,
                cha: monsterData.charisma || 10
            },
            speed: monsterData.speed,
            actions: monsterData.actions || [],
            special_abilities: monsterData.special_abilities || [],
            legendary_actions: monsterData.legendary_actions || [],
            size: monsterData.size,
            creature_type: monsterData.type,
            cr: monsterData.challenge_rating
        };

        console.log('Created combatant:', newCombatant);

        // Add new combatant to the list
        let newOrder = [...gameState.initiative_order, newCombatant];

        // If this is the second monster of this type, assign #1 to the first one and #2 to this one
        if (existingMonsters.length === 1 && !existingMonsters[0].monsterNumber) {
            newOrder = newOrder.map(c => {
                if (c.type === 'monster' && c.baseName === monster.name) {
                    if (c.id === newCombatant.id) {
                        return { ...c, monsterNumber: 2 };
                    } else {
                        return { ...c, monsterNumber: 1 };
                    }
                }
                return c;
            });
        }

        // Sort by initiative
        newOrder.sort((a, b) => b.initiative - a.initiative);

        updateState({
            initiative_order: newOrder,
            log: [...gameState.log, `Added ${monster.name} to initiative.`]
        });
    };

    return (
        <div className="bg-dnd-card p-4 rounded-xl border border-dnd-muted/20 flex flex-col">
            <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <h2 className="text-xl font-serif">Bestiary</h2>
                <button className="p-1 hover:bg-dnd-dark/50 rounded transition-colors">
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            {!isCollapsed && (
                <>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-3 text-dnd-muted" size={18} />
                        <input
                            type="text"
                            value={query}
                            onChange={searchMonsters}
                            placeholder="Search monsters..."
                            className="w-full bg-dnd-dark border border-dnd-muted/30 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-dnd-accent"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 max-h-96">
                        {results.map(m => (
                            <div key={m.index_name} className="flex items-center justify-between p-3 bg-dnd-dark/50 rounded-lg hover:bg-dnd-dark transition-colors group">
                                <div className="flex-1">
                                    <div className="font-bold">{m.name}</div>
                                    <div className="text-xs text-dnd-muted capitalize font-serif">
                                        {m.size} {m.type} • CR {m.challenge_rating || '?'} • HP {m.hit_points || '?'} • AC {m.armor_class || '?'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => addMonster(m)}
                                    className="p-2 bg-dnd-accent/10 text-dnd-accent rounded hover:bg-dnd-accent hover:text-white transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default MonsterSearch;
