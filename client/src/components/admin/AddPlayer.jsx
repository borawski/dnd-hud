import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Minus } from 'lucide-react';
import { API_URL } from '../../config';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';

const AddPlayer = () => {
    const { gameState, updateState, campaignId } = useGame();
    const { token } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [importMode, setImportMode] = useState('dndbeyond'); // 'dndbeyond' or 'manual'

    // Manual player form state
    const [manualPlayer, setManualPlayer] = useState({
        name: '',
        stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        hp: 10,
        maxHp: 10,
        ac: 10,
        level: 1
    });

    const adjustStat = (stat, delta) => {
        setManualPlayer(prev => ({
            ...prev,
            stats: {
                ...prev.stats,
                [stat]: Math.max(1, Math.min(20, prev.stats[stat] + delta))
            }
        }));
    };

    const handleCreateManualPlayer = async () => {
        if (!manualPlayer.name.trim()) {
            alert('Please enter a player name');
            return;
        }

        try {
            // Calculate derived stats
            const getMod = (score) => Math.floor((score - 10) / 2);
            const profBonus = Math.ceil(1 + (manualPlayer.level || 1) / 4);

            const newCharacter = {
                id: `player-manual-${Date.now()}`,
                name: manualPlayer.name,
                initiative: 0,
                type: 'player',
                hp: manualPlayer.hp,
                maxHp: manualPlayer.maxHp,
                ac: manualPlayer.ac,
                stats: manualPlayer.stats,
                level: manualPlayer.level || 1,
                proficiencyBonus: profBonus,
                passivePerception: 10 + getMod(manualPlayer.stats.wis),
                actions: [],
                equipment: [],
                has_acted: false,
                importMode: 'manual',
                dndbeyondId: null,
                syncEnabled: false
            };

            // Add to current game state
            const newOrder = [...gameState.initiative_order, newCharacter];
            await updateState({
                initiative_order: newOrder,
                log: [...gameState.log, `${new Date().toLocaleTimeString()} - Added ${manualPlayer.name} to initiative.`]
            });

            // Reset form
            setManualPlayer({
                name: '',
                stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
                hp: 10,
                maxHp: 10,
                ac: 10,
                level: 1
            });
        } catch (err) {
            alert(`Failed to create player: ${err.message}`);
        }
    };

    const getModifier = (stat) => {
        return Math.floor((stat - 10) / 2);
    };

    const formatModifier = (mod) => {
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    return (
        <div className="bg-dnd-card p-4 rounded-xl border border-dnd-muted/20">
            <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <h3 className="text-lg font-serif text-dnd-accent">Add Player</h3>
                <button className="p-1 hover:bg-dnd-dark/50 rounded transition-colors">
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            {!isCollapsed && (
                <>
                    {/* Mode Selector */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => setImportMode('dndbeyond')}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${importMode === 'dndbeyond'
                                ? 'bg-dnd-accent text-dnd-dark'
                                : 'bg-dnd-dark border border-dnd-muted/30 text-dnd-muted hover:text-dnd-text'
                                }`}
                        >
                            D&D Beyond Import
                        </button>
                        <button
                            onClick={() => setImportMode('manual')}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${importMode === 'manual'
                                ? 'bg-dnd-accent text-dnd-dark'
                                : 'bg-dnd-dark border border-dnd-muted/30 text-dnd-muted hover:text-dnd-text'
                                }`}
                        >
                            Manual Builder
                        </button>
                    </div>

                    {/* D&D Beyond Import Mode */}
                    {importMode === 'dndbeyond' && (
                        <>
                            <div className="flex gap-2">
                                <input
                                    placeholder="D&D Beyond URL or ID"
                                    className="flex-1 bg-dnd-dark border border-dnd-muted/30 rounded px-2 py-1 text-sm"
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.target.value.trim();

                                            // Extract character ID from URL or use as-is if it's just an ID
                                            let characterId = val;
                                            const urlMatch = val.match(/\/characters\/(\d+)/);
                                            if (urlMatch) {
                                                characterId = urlMatch[1];
                                            }

                                            e.target.value = 'Importing...';
                                            e.target.disabled = true;
                                            try {
                                                // Use campaign-aware import endpoint
                                                const response = await fetch(`${API_URL}/api/encounters/${campaignId}/import-character`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({ characterId })
                                                });

                                                if (!response.ok) {
                                                    const errorData = await response.json();
                                                    throw new Error(errorData.error || 'Failed to import');
                                                }

                                                const data = await response.json();
                                                const newCharacter = data.character;

                                                // Add to game state
                                                const newOrder = [...gameState.initiative_order, newCharacter];
                                                await updateState({
                                                    initiative_order: newOrder,
                                                    log: [...gameState.log, `${new Date().toLocaleTimeString()} - Imported ${newCharacter.name} from D&D Beyond.`]
                                                });

                                                e.target.value = '';
                                            } catch (err) {
                                                alert(`Failed to import: ${err.message}`);
                                                e.target.value = val;
                                            }
                                            e.target.disabled = false;
                                        }
                                    }}
                                />
                            </div>
                            <p className="text-xs text-dnd-muted mt-1">Paste URL and hit Enter</p>
                        </>
                    )}

                    {/* Manual Builder Mode */}
                    {importMode === 'manual' && (
                        <div className="space-y-3">
                            {/* Name Input */}
                            <div>
                                <label className="text-xs text-dnd-muted uppercase tracking-wide block mb-1">Name</label>
                                <input
                                    type="text"
                                    value={manualPlayer.name}
                                    onChange={(e) => setManualPlayer(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Player Name"
                                    className="w-full bg-dnd-dark border border-dnd-muted/30 rounded px-2 py-1 text-sm"
                                />
                            </div>

                            {/* Ability Scores */}
                            <div>
                                <label className="text-xs text-dnd-muted uppercase tracking-wide block mb-2">Ability Scores</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(stat => {
                                        const mod = getModifier(manualPlayer.stats[stat]);
                                        return (
                                            <div key={stat} className="flex items-center justify-between bg-dnd-dark/50 rounded p-2">
                                                <span className="text-xs uppercase font-medium text-dnd-accent">{stat}</span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => adjustStat(stat, -1)}
                                                        className="w-6 h-6 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded flex items-center justify-center transition-all active:scale-90"
                                                    >
                                                        <Minus size={12} className="text-red-400" />
                                                    </button>
                                                    <div className="flex flex-col items-center justify-center min-w-[40px]">
                                                        <input
                                                            type="number"
                                                            value={manualPlayer.stats[stat]}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (!isNaN(val)) {
                                                                    setManualPlayer(prev => ({
                                                                        ...prev,
                                                                        stats: { ...prev.stats, [stat]: Math.max(1, Math.min(20, val)) }
                                                                    }));
                                                                }
                                                            }}
                                                            className="w-12 bg-dnd-dark border border-dnd-muted/30 rounded px-1 text-center text-sm font-mono"
                                                        />
                                                        <span className="text-[10px] text-dnd-accent mt-0.5">{formatModifier(mod)}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => adjustStat(stat, 1)}
                                                        className="w-6 h-6 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded flex items-center justify-center transition-all active:scale-90"
                                                    >
                                                        <Plus size={12} className="text-green-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Combat Stats */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-dnd-muted uppercase tracking-wide block mb-1">HP</label>
                                    <input
                                        type="number"
                                        value={manualPlayer.hp}
                                        onChange={(e) => setManualPlayer(prev => ({ ...prev, hp: parseInt(e.target.value) || 0 }))}
                                        className="w-full bg-dnd-dark border border-dnd-muted/30 rounded px-2 py-1 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-dnd-muted uppercase tracking-wide block mb-1">Max HP</label>
                                    <input
                                        type="number"
                                        value={manualPlayer.maxHp}
                                        onChange={(e) => setManualPlayer(prev => ({ ...prev, maxHp: parseInt(e.target.value) || 0 }))}
                                        className="w-full bg-dnd-dark border border-dnd-muted/30 rounded px-2 py-1 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-dnd-muted uppercase tracking-wide block mb-1">AC</label>
                                    <input
                                        type="number"
                                        value={manualPlayer.ac}
                                        onChange={(e) => setManualPlayer(prev => ({ ...prev, ac: parseInt(e.target.value) || 0 }))}
                                        className="w-full bg-dnd-dark border border-dnd-muted/30 rounded px-2 py-1 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-dnd-muted uppercase tracking-wide block mb-1">Level</label>
                                    <input
                                        type="number"
                                        value={manualPlayer.level}
                                        onChange={(e) => setManualPlayer(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                                        className="w-full bg-dnd-dark border border-dnd-muted/30 rounded px-2 py-1 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Create Button */}
                            <button
                                onClick={handleCreateManualPlayer}
                                className="w-full bg-dnd-accent hover:bg-dnd-accent/80 text-dnd-dark font-medium py-2 px-4 rounded transition-colors"
                            >
                                Create Player
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AddPlayer;
