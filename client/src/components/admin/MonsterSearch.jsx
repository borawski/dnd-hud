import React, { useState } from 'react';
import { Search, Plus, ChevronDown, ChevronRight, Minus, Check } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { API_URL } from '../../config';

const MonsterSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [addingId, setAddingId] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('search'); // 'search' or 'manual'
    const { gameState, updateState } = useGame();

    // Manual Monster State
    const [manualMonster, setManualMonster] = useState({
        name: '',
        hp: 10,
        ac: 10,
        stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    });

    const getModifier = (stat) => {
        return Math.floor((stat - 10) / 2);
    };

    const formatModifier = (mod) => {
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    const adjustStat = (stat, delta) => {
        setManualMonster(prev => ({
            ...prev,
            stats: {
                ...prev.stats,
                [stat]: Math.max(1, Math.min(30, prev.stats[stat] + delta)) // Monsters can go up to 30
            }
        }));
    };

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

    const createManualMonster = () => {
        if (!manualMonster.name.trim()) return;

        // Calculate initiative from DEX
        const dexMod = getModifier(manualMonster.stats.dex);
        const roll = Math.floor(Math.random() * 20) + 1;
        const totalInit = roll + dexMod;

        const newCombatant = {
            id: Date.now(),
            baseName: manualMonster.name,
            name: manualMonster.name,
            hp: manualMonster.hp,
            maxHp: manualMonster.hp,
            ac: manualMonster.ac,
            initiative: totalInit,
            type: 'monster',
            stats: manualMonster.stats,
            monsterNumber: undefined // Let the sorting logic handle numbering if we implement it for manual
        };

        // Add to game state
        addToInitiative(newCombatant);

        // Reset form
        setManualMonster({
            name: '',
            hp: 10,
            ac: 10,
            stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
        });
    };

    const addMonster = async (monster) => {
        if (addingId) return;
        setAddingId(monster.index_name);

        try {
            // Fetch full monster details from D&D 5e API
            let fullMonsterData = null;
            try {
                const apiUrl = `https://www.dnd5eapi.co${monster.url}`;
                const detailRes = await fetch(apiUrl);
                fullMonsterData = await detailRes.json();
            } catch (err) {
                console.error('Failed to fetch full monster data:', err);
            }

            // Use full data if available, otherwise use basic monster from search
            const monsterData = fullMonsterData || monster;

            // Get dexterity with fallback
            const dexterity = monsterData.dexterity || 10;
            const dexMod = Math.floor((dexterity - 10) / 2);
            const initiativeRoll = Math.floor(Math.random() * 20) + 1 + dexMod;

            const newCombatant = {
                id: Date.now(),
                baseName: monster.name,
                name: monster.name,
                monsterNumber: undefined, // Handled in addToInitiative
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

            addToInitiative(newCombatant);

            // Wait for visual feedback
            await new Promise(resolve => setTimeout(resolve, 500));

            // Clear search to close the results
            setQuery('');
            setResults([]);
        } finally {
            setAddingId(null);
        }
    };

    const addToInitiative = (combatant) => {
        // Find existing monsters of this type
        const existingMonsters = gameState.initiative_order.filter(c =>
            c.type === 'monster' && c.baseName === combatant.baseName
        );

        // Determine the number for the new monster
        const existingNumbers = existingMonsters
            .map(m => m.monsterNumber)
            .filter(n => n !== undefined);

        let nextNumber = existingNumbers.length > 0
            ? Math.max(...existingNumbers) + 1
            : (existingMonsters.length > 0 ? 2 : undefined);

        const newCombatant = { ...combatant, monsterNumber: nextNumber };

        // Add new combatant to the list
        let newOrder = [...gameState.initiative_order, newCombatant];

        // If this is the second monster of this type, assign #1 to the first one
        if (existingMonsters.length === 1 && !existingMonsters[0].monsterNumber) {
            newOrder = newOrder.map(c => {
                if (c.type === 'monster' && c.baseName === combatant.baseName) {
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
            log: [...gameState.log, `Added ${combatant.name} to initiative.`]
        });
    };

    return (
        <div className="bg-dnd-card p-3 rounded-xl border border-dnd-muted/20 flex flex-col">
            <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <h2 className="text-xl font-serif">Bestiary</h2>
                <button className="p-1 hover:bg-dnd-dark/50 rounded transition-colors">
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            {!isCollapsed && (
                <>
                    {/* Tabs */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => setActiveTab('search')}
                            className={`flex-1 flex items-center justify-center px-3 py-1.5 min-h-[36px] rounded text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === 'search'
                                ? 'bg-dnd-accent text-dnd-dark'
                                : 'bg-dnd-dark border border-dnd-muted/30 text-dnd-muted hover:text-dnd-text'
                                }`}
                        >
                            Search
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`flex-1 flex items-center justify-center px-3 py-1.5 min-h-[36px] rounded text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === 'manual'
                                ? 'bg-dnd-accent text-dnd-dark'
                                : 'bg-dnd-dark border border-dnd-muted/30 text-dnd-muted hover:text-dnd-text'
                                }`}
                        >
                            Manual Builder
                        </button>
                    </div>

                    {/* Search Mode */}
                    {activeTab === 'search' && (
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

                            <div className="flex-1 overflow-y-auto space-y-2 max-h-96 hide-scrollbar">
                                {results.map(m => {
                                    const isThisAdding = addingId === m.index_name;
                                    const isDisabled = addingId !== null && !isThisAdding;

                                    return (
                                        <div key={m.index_name} className="flex items-center justify-between p-3 bg-dnd-dark/50 rounded-lg hover:bg-dnd-dark transition-colors group">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="font-bold text-sm truncate">{m.name}</div>
                                                <div className="text-[10px] text-dnd-muted capitalize font-serif truncate">
                                                    {m.size} {m.type} • CR {m.challenge_rating || '?'} • HP {m.hit_points || '?'} • AC {m.armor_class || '?'}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => addMonster(m)}
                                                disabled={addingId !== null}
                                                className={`p-1.5 rounded transition-all flex-shrink-0 ${isThisAdding
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                                    : isDisabled
                                                        ? 'bg-dnd-muted/10 text-dnd-muted cursor-not-allowed opacity-30 shadow-none'
                                                        : 'bg-dnd-accent/10 text-dnd-accent hover:bg-dnd-accent hover:text-white'
                                                    }`}
                                            >
                                                {isThisAdding ? <Check size={14} /> : <Plus size={14} />}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Manual Mode */}
                    {activeTab === 'manual' && (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-dnd-muted uppercase tracking-wide block mb-1">Name</label>
                                <input
                                    type="text"
                                    value={manualMonster.name}
                                    onChange={(e) => setManualMonster(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Monster Name"
                                    className="w-full bg-dnd-dark border border-dnd-muted/30 rounded px-2 py-1 text-sm"
                                />
                            </div>

                            {/* Ability Scores */}
                            <div>
                                <label className="text-xs text-dnd-muted uppercase tracking-wide block mb-2">Ability Scores</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => {
                                        const mod = getModifier(manualMonster.stats[stat]);
                                        return (
                                            <div key={stat} className="flex flex-col items-center justify-center bg-dnd-dark/50 rounded p-2">
                                                <span className="text-xs uppercase font-medium text-dnd-accent mb-1">{stat}</span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => adjustStat(stat, -1)}
                                                        className="w-6 h-6 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded flex items-center justify-center transition-all active:scale-90"
                                                    >
                                                        <Minus size={12} className="text-red-400" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={manualMonster.stats[stat]}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (!isNaN(val)) {
                                                                setManualMonster(prev => ({
                                                                    ...prev,
                                                                    stats: { ...prev.stats, [stat]: Math.max(1, Math.min(30, val)) }
                                                                }));
                                                            }
                                                        }}
                                                        className="w-12 bg-dnd-dark border border-dnd-muted/30 rounded px-1 text-center text-sm font-mono h-6"
                                                    />
                                                    <button
                                                        onClick={() => adjustStat(stat, 1)}
                                                        className="w-6 h-6 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded flex items-center justify-center transition-all active:scale-90"
                                                    >
                                                        <Plus size={12} className="text-green-400" />
                                                    </button>
                                                </div>
                                                <span className="text-[10px] text-dnd-accent mt-1">{formatModifier(mod)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-dnd-muted uppercase tracking-wide block mb-1">HP</label>
                                    <input
                                        type="number"
                                        value={manualMonster.hp}
                                        onChange={(e) => setManualMonster(prev => ({ ...prev, hp: parseInt(e.target.value) || 0 }))}
                                        className="w-full bg-dnd-dark border border-dnd-muted/30 rounded px-2 py-1 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-dnd-muted uppercase tracking-wide block mb-1">AC</label>
                                    <input
                                        type="number"
                                        value={manualMonster.ac}
                                        onChange={(e) => setManualMonster(prev => ({ ...prev, ac: parseInt(e.target.value) || 0 }))}
                                        className="w-full bg-dnd-dark border border-dnd-muted/30 rounded px-2 py-1 text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={createManualMonster}
                                disabled={!manualMonster.name.trim()}
                                className="w-full bg-dnd-accent hover:bg-dnd-accent/80 text-dnd-dark font-bold text-xs uppercase tracking-wide py-1.5 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Monster
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MonsterSearch;
