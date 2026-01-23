import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, ChevronDown, ChevronRight, Trash2, Sword, Shield, Zap, X, Scroll, Dice5 } from 'lucide-react';
import { API_URL } from '../../config';

const InitiativeTrackerDetail = ({ combatant, position, isCurrentTurn, turnStartTime, isExpanded, onToggle, onUpdate, onRemove, combatStarted, allCombatants, onLogDamage }) => {
    const [localInitiative, setLocalInitiative] = useState(combatant.initiative);
    const [localHp, setLocalHp] = useState(combatant.hp);
    const [showLogButton, setShowLogButton] = useState(false);
    const [showAttackerPopover, setShowAttackerPopover] = useState(false);
    const [pendingDamage, setPendingDamage] = useState(null);
    const damageDebounceTimeout = useRef(null);
    const initiativeTimeout = useRef(null);
    const hpTimeout = useRef(null);

    // Timer state for active turn
    const [turnDuration, setTurnDuration] = useState(0);

    // State to track which actions are expanded
    const [expandedActions, setExpandedActions] = useState({});

    // State for manual player stats (local edits before debounce)
    const [localStats, setLocalStats] = useState(combatant.stats || {});
    const statsTimeout = useRef(null);

    // State for monster nickname
    const [localNickname, setLocalNickname] = useState(combatant.nickname || '');
    const nicknameTimeout = useRef(null);

    // Sync local state when combatant changes
    useEffect(() => {
        setLocalInitiative(combatant.initiative);
        setLocalHp(combatant.hp);
        setLocalNickname(combatant.nickname || '');
    }, [combatant.id]);

    // Update timer every second when this is the current turn and combat has started
    useEffect(() => {
        if (!isCurrentTurn || !turnStartTime || !combatStarted) {
            setTurnDuration(0);
            return;
        }

        const updateTimer = () => {
            const now = new Date();
            const start = new Date(turnStartTime);
            const elapsed = Math.floor((now - start) / 1000);
            setTurnDuration(elapsed);
        };

        updateTimer(); // Initial update
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [isCurrentTurn, turnStartTime, combatStarted, combatant.name]);

    const updateField = (field, value) => {
        onUpdate(combatant.id, field, value);
    };

    const debouncedInitiativeUpdate = (value) => {
        // Clear existing timeout
        if (initiativeTimeout.current) {
            clearTimeout(initiativeTimeout.current);
        }

        // Update local state immediately for responsive UI
        setLocalInitiative(value);

        // Debounce the actual update to prevent page jumping (1.5 seconds)
        // This gives users time to click +/- multiple times before the list re-sorts
        initiativeTimeout.current = setTimeout(() => {
            updateField('initiative', value);
        }, 1500);
    };

    const debouncedHpUpdate = (value) => {
        // Clear existing timeout
        if (hpTimeout.current) {
            clearTimeout(hpTimeout.current);
        }

        // Update local state immediately
        setLocalHp(value);

        // Check if HP decreased (damage taken)
        const oldHp = combatant.hp;
        if (value < oldHp) {
            // Clear any existing damage debounce timeout
            if (damageDebounceTimeout.current) {
                clearTimeout(damageDebounceTimeout.current);
            }

            const damage = oldHp - value;
            setPendingDamage({ target: combatant.name, amount: damage });

            // Wait 1 second after last HP change before showing Log button
            damageDebounceTimeout.current = setTimeout(() => {
                setShowLogButton(true);
            }, 1000);
        } else {
            // HP increased (healing), hide button and clear pending damage
            setShowLogButton(false);
            setShowAttackerPopover(false);
            setPendingDamage(null);
        }

        // Debounce to reduce server calls
        hpTimeout.current = setTimeout(() => {
            updateField('hp', value);
        }, 300);
    };

    // Helper to get display name with number badge for logs
    const getDisplayName = (combatant) => {
        let name = combatant.name;
        if (combatant.type === 'monster' && combatant.monsterNumber) {
            name += ` #${combatant.monsterNumber}`;
        }
        if (combatant.nickname) {
            name += ` (${combatant.nickname})`;
        }
        return name;
    };

    const handleAttackerSelect = (attacker) => {
        if (onLogDamage && pendingDamage) {
            onLogDamage(attacker, combatant, pendingDamage.amount, localHp, combatant.maxHp);
        }
        setShowLogButton(false);
        setShowAttackerPopover(false);
        setPendingDamage(null);
    };

    const dismissLog = () => {
        setShowLogButton(false);
        setShowAttackerPopover(false);
        // Keep pending damage so it can be logged at turn end
    };

    // Handle sync toggle for D&D Beyond players
    const handleSyncToggle = async (enabled) => {
        try {
            // Update via parent's onUpdate callback
            onUpdate(combatant.id, 'syncEnabled', enabled);
        } catch (err) {
            console.error('Error updating sync:', err);
            alert('Failed to update sync setting');
        }
    };

    // Handle stat adjustment for manual players
    const adjustStat = (stat, delta) => {
        const newStats = {
            ...localStats,
            [stat]: Math.max(1, Math.min(20, (localStats[stat] || 10) + delta))
        };
        setLocalStats(newStats);

        // Debounce stat updates
        if (statsTimeout.current) {
            clearTimeout(statsTimeout.current);
        }

        statsTimeout.current = setTimeout(async () => {
            try {
                const response = await fetch(`${API_URL}/api/update-player-stats/${combatant.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stats: newStats })
                });

                if (!response.ok) {
                    throw new Error('Failed to update stats');
                }
            } catch (err) {
                console.error('Error updating stats:', err);
            }
        }, 500);
    };


    const adjustValue = (field, delta) => {
        if (field === 'initiative') {
            const current = localInitiative;
            const newValue = Math.max(0, Math.min(99, current + delta));
            debouncedInitiativeUpdate(newValue);
        } else if (field === 'hp') {
            const current = localHp;
            const max = combatant.maxHp;
            const newValue = Math.max(0, Math.min(max, current + delta));
            debouncedHpUpdate(newValue);
        }
    };

    const handleInitiativeInput = (e) => {
        const val = e.target.value;
        // Allow empty string for clearing
        if (val === '') {
            setLocalInitiative('');
            return;
        }
        const parsed = parseInt(val);
        if (!isNaN(parsed)) {
            const clamped = Math.max(0, Math.min(99, parsed));
            debouncedInitiativeUpdate(clamped);
        }
    };

    const handleHpInput = (e) => {
        const val = e.target.value;
        // Allow empty string for clearing
        if (val === '') {
            setLocalHp('');
            return;
        }
        const parsed = parseInt(val);
        if (!isNaN(parsed)) {
            const clamped = Math.max(0, Math.min(combatant.maxHp, parsed));
            debouncedHpUpdate(clamped);
        }
    };

    const getModifier = (stat) => {
        return Math.floor((stat - 10) / 2);
    };

    const formatModifier = (mod) => {
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    const handleNicknameChange = (e) => {
        const value = e.target.value;
        setLocalNickname(value);

        // Clear existing timeout
        if (nicknameTimeout.current) {
            clearTimeout(nicknameTimeout.current);
        }

        // Debounce the update
        nicknameTimeout.current = setTimeout(() => {
            updateField('nickname', value);
        }, 500);
    };

    return (
        <div className={`rounded border transition-all duration-500 ease-in-out ${isCurrentTurn && combatStarted
            ? 'bg-dnd-accent/10 border-dnd-accent shadow-lg shadow-dnd-accent/20'
            : 'bg-dnd-dark/50 border-transparent'
            }`}>
            {/* Collapsed Row */}
            <div className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-dnd-dark/30" onClick={onToggle}>
                {/* Position Number */}
                <div className="hidden sm:block w-6 text-center font-mono font-bold text-dnd-muted/50 text-xs">
                    {position}
                </div>

                <button className="p-1 hover:bg-dnd-dark/50 rounded transition-colors">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className="font-mono font-bold w-6 text-center text-dnd-accent">
                    {combatant.initiative}
                </div>

                <div className="flex-1 min-w-0 flex items-center gap-2">
                    <div className="font-bold truncate">{combatant.name}</div>
                    {combatant.type === 'monster' && combatant.monsterNumber && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-dnd-muted/20 text-dnd-muted border border-dnd-muted/30">
                            #{combatant.monsterNumber}
                        </span>
                    )}
                    <div className="text-xs text-dnd-muted whitespace-nowrap">AC {combatant.ac}</div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Currently Attacking Badge - only show when combat has started */}
                    {isCurrentTurn && combatStarted && (
                        <>
                            <div className="hidden sm:block px-2 py-1 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                Active
                            </div>
                            <div className="px-2 py-1 rounded text-xs font-mono font-bold bg-slate-700/50 text-slate-300 border border-slate-600/50">
                                {Math.floor(turnDuration / 60)}:{String(turnDuration % 60).padStart(2, '0')}
                            </div>
                        </>
                    )}

                    <div className={`px-2 py-1 rounded text-xs font-bold ${combatant.hp <= 0 ? 'text-red-500 bg-red-500/10' :
                        combatant.hp < combatant.maxHp / 2 ? 'text-yellow-500 bg-yellow-500/10' :
                            'text-green-500 bg-green-500/10'
                        }`}>
                        {combatant.hp}/{combatant.maxHp}
                    </div>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(combatant.id); }}
                    className="text-dnd-muted hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Expanded Detail */}
            {isExpanded && (
                <div className="p-4 border-t border-dnd-muted/20 bg-dnd-dark/20 space-y-4" onClick={(e) => e.stopPropagation()}>
                    {/* Initiative Control */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-dnd-muted uppercase tracking-wide">Initiative</label>
                        <div className="flex items-center gap-2">
                            {/* D20 Roll Button */}
                            {!combatStarted && (
                                <button
                                    onClick={() => {
                                        const roll = Math.floor(Math.random() * 20) + 1;
                                        const dex = combatant.stats?.dexterity || 10;
                                        const mod = Math.floor((dex - 10) / 2);
                                        const total = Math.max(0, roll + mod);
                                        debouncedInitiativeUpdate(total);
                                    }}
                                    className="p-1 hover:bg-dnd-accent/10 rounded-full transition-colors group relative flex items-center justify-center ml-3"
                                    title={`Roll Initiative (1d20 + DEX Mod)`}
                                >
                                    <img
                                        src="/dice-icon.png"
                                        alt="Roll"
                                        className="w-8 h-8 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                </button>
                            )}
                            <button
                                onClick={() => adjustValue('initiative', -1)}
                                disabled={combatStarted}
                                className={`w-7 h-7 rounded flex items-center justify-center transition-all ${combatStarted
                                    ? 'bg-dnd-muted/10 text-dnd-muted/30 cursor-not-allowed border border-dnd-muted/20'
                                    : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 active:scale-90 active:bg-red-500/40'
                                    }`}
                            >
                                <Minus size={14} className={combatStarted ? 'text-dnd-muted/30' : 'text-red-400'} />
                            </button>
                            <input
                                type="number"
                                value={localInitiative}
                                onChange={handleInitiativeInput}
                                disabled={combatStarted}
                                className={`w-16 bg-dnd-dark border rounded px-2 py-1 text-center text-sm font-mono font-bold focus:outline-none transition-colors ${combatStarted
                                    ? 'border-dnd-muted/20 text-dnd-muted/50 cursor-not-allowed'
                                    : 'border-dnd-muted/30 focus:border-dnd-accent'
                                    }`}
                            />
                            <button
                                onClick={() => adjustValue('initiative', 1)}
                                disabled={combatStarted}
                                className={`w-7 h-7 rounded flex items-center justify-center transition-all ${combatStarted
                                    ? 'bg-dnd-muted/10 text-dnd-muted/30 cursor-not-allowed border border-dnd-muted/20'
                                    : 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 active:scale-90 active:bg-green-500/40'
                                    }`}
                            >
                                <Plus size={14} className={combatStarted ? 'text-dnd-muted/30' : 'text-green-400'} />
                            </button>
                        </div>
                    </div>

                    {/* Nickname Control (Monsters Only) */}
                    {combatant.type === 'monster' && (
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-dnd-muted uppercase tracking-wide">Nickname</label>
                            <input
                                type="text"
                                value={localNickname}
                                onChange={handleNicknameChange}
                                placeholder="Optional"
                                className="w-48 bg-dnd-dark border border-dnd-muted/30 rounded px-2 py-1 text-sm focus:outline-none focus:border-dnd-accent transition-colors"
                            />
                        </div>
                    )}

                    {/* HP Control */}
                    <div className="flex items-center justify-between relative">
                        <label className="text-sm font-medium text-dnd-muted uppercase tracking-wide">Hit Points</label>
                        <div className="flex items-center gap-2">
                            {/* Log button - appears after HP decrease */}
                            {showLogButton && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dismissLog();
                                        }}
                                        className="w-5 h-5 hover:bg-slate-700 rounded flex items-center justify-center transition-all"
                                        title="Dismiss (will log generically at turn end)"
                                    >
                                        <X size={10} className="text-slate-400" />
                                    </button>
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowAttackerPopover(!showAttackerPopover);
                                            }}
                                            className="w-7 h-7 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded flex items-center justify-center transition-all"
                                            title="Log damage attacker"
                                        >
                                            <Scroll size={14} className="text-slate-200" />
                                        </button>
                                        {showAttackerPopover && (
                                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 bg-[#09090b]/60 backdrop-blur-sm border border-zinc-800 rounded shadow-lg z-10 w-64">
                                                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#09090b]/60 border-t border-l border-zinc-800 transform rotate-45"></div>
                                                <div className="px-3 py-2 flex items-center justify-between border-b border-zinc-800/50">
                                                    <span className="text-xs font-medium text-dnd-muted/80">Log Attacker</span>
                                                    {/* Intentionally removed click handler on header as requested */}
                                                </div>

                                                {allCombatants && (
                                                    <div className="max-h-48 overflow-y-auto">
                                                        {allCombatants
                                                            .filter(c => c.id !== combatant.id)
                                                            .map(attacker => (
                                                                <button
                                                                    key={attacker.id}
                                                                    onClick={() => handleAttackerSelect(attacker)}
                                                                    className="w-full px-3 py-1.5 text-left hover:bg-dnd-accent/10 transition-colors flex items-center justify-between group"
                                                                >
                                                                    <span className="text-xs text-dnd-text">{getDisplayName(attacker)}</span>
                                                                    <span className="text-[10px] text-dnd-muted opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                                                                </button>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                            <button
                                onClick={() => adjustValue('hp', -1)}
                                className="w-7 h-7 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded flex items-center justify-center transition-all active:scale-90 active:bg-red-500/40"
                            >
                                <Minus size={14} className="text-red-400" />
                            </button>
                            <input
                                type="number"
                                value={localHp}
                                onChange={handleHpInput}
                                className="w-16 bg-dnd-dark border border-dnd-muted/30 rounded px-2 py-1 text-center text-sm font-mono font-bold focus:outline-none focus:border-dnd-accent transition-colors"
                            />
                            <span className="text-sm text-dnd-muted">/ {combatant.maxHp}</span>
                            <button
                                onClick={() => adjustValue('hp', 1)}
                                className="w-7 h-7 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded flex items-center justify-center transition-all active:scale-90 active:bg-green-500/40"
                            >
                                <Plus size={14} className="text-green-400" />
                            </button>
                        </div>


                    </div>

                    {/* D&D Beyond Sync Checkbox (for D&D Beyond imports only) */}
                    {combatant.type === 'player' && combatant.importMode === 'dndbeyond' && (
                        <div className="border-t border-dnd-muted/10 pt-3">
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-dnd-dark/30 p-2 rounded transition-colors">
                                <input
                                    type="checkbox"
                                    checked={combatant.syncEnabled || false}
                                    onChange={(e) => handleSyncToggle(e.target.checked)}
                                    className="w-4 h-4 bg-dnd-dark border border-dnd-muted/30 rounded accent-dnd-accent"
                                />
                                <span className="text-sm text-dnd-text">Auto-Sync on Turn Start</span>
                                <span className="text-xs text-dnd-muted ml-auto">D&D Beyond</span>
                            </label>
                            <p className="text-xs text-dnd-muted mt-1 ml-6">
                                Automatically fetch HP from D&D Beyond at the start of each turn
                            </p>
                        </div>
                    )}

                    {/* Stats */}
                    {combatant.stats && (
                        <div className="border-t border-dnd-muted/10 pt-3">
                            <div className="text-xs text-dnd-muted uppercase tracking-wide mb-2 font-medium">
                                Ability Scores
                                {combatant.importMode === 'manual' && (
                                    <span className="ml-2 text-[10px] text-dnd-accent normal-case">(Editable)</span>
                                )}
                            </div>
                            {combatant.importMode === 'manual' ? (
                                // Manual player: Editable stats with adjustors
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(localStats).map(([stat, val]) => {
                                        const mod = getModifier(val);
                                        return (
                                            <div key={stat} className="bg-dnd-dark/50 rounded p-2">
                                                <div className="text-[10px] text-dnd-muted uppercase font-medium text-center mb-1">{stat}</div>
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => adjustStat(stat, -1)}
                                                        className="w-5 h-5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded flex items-center justify-center transition-all active:scale-90"
                                                    >
                                                        <Minus size={10} className="text-red-400" />
                                                    </button>
                                                    <div className="flex flex-col items-center justify-center min-w-[32px]">
                                                        <div className="text-sm font-bold">{val}</div>
                                                        <div className="text-[10px] text-dnd-accent">{formatModifier(mod)}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => adjustStat(stat, 1)}
                                                        className="w-5 h-5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded flex items-center justify-center transition-all active:scale-90"
                                                    >
                                                        <Plus size={10} className="text-green-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                // D&D Beyond import / Monster: Read-only stats
                                <div className="grid grid-cols-6 gap-2">
                                    {Object.entries(combatant.stats).map(([stat, val]) => {
                                        const mod = getModifier(val);
                                        return (
                                            <div key={stat} className="bg-dnd-dark/50 rounded p-2 text-center">
                                                <div className="text-[10px] text-dnd-muted uppercase font-medium">{stat}</div>
                                                <div className="text-sm font-bold">{val}</div>
                                                <div className="text-xs text-dnd-accent">{formatModifier(mod)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Monster-specific details */}
                    {combatant.type === 'monster' && (
                        <>
                            {/* Actions */}
                            {combatant.actions && combatant.actions.length > 0 && (
                                <div className="border-t border-dnd-muted/10 pt-3">
                                    <div className="text-xs text-dnd-muted uppercase tracking-wide mb-2 font-medium flex items-center gap-1">
                                        <Sword size={12} /> Actions
                                    </div>
                                    <div className="space-y-2">
                                        {combatant.actions.map((action, idx) => (
                                            <div key={idx} className="bg-dnd-dark/50 rounded p-2">
                                                <div className="font-bold text-sm text-dnd-accent">{action.name}</div>
                                                <div className="text-xs text-dnd-muted mt-1 font-serif">{action.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Special Abilities */}
                            {combatant.special_abilities && combatant.special_abilities.length > 0 && (
                                <div className="border-t border-dnd-muted/10 pt-3">
                                    <div className="text-xs text-dnd-muted uppercase tracking-wide mb-2 font-medium flex items-center gap-1">
                                        <Zap size={12} /> Special Abilities
                                    </div>
                                    <div className="space-y-2">
                                        {combatant.special_abilities.map((ability, idx) => (
                                            <div key={idx} className="bg-dnd-dark/50 rounded p-2">
                                                <div className="font-bold text-sm text-green-400">{ability.name}</div>
                                                <div className="text-xs text-dnd-muted mt-1 font-serif">{ability.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Player-specific details */}
                    {combatant.type === 'player' && (
                        <>
                            {/* Actions */}
                            {combatant.actions && combatant.actions.length > 0 && (
                                <div className="border-t border-dnd-muted/10 pt-3">
                                    <div className="text-xs text-dnd-muted uppercase tracking-wide mb-2 font-medium flex items-center gap-1">
                                        <Sword size={12} /> Actions ({combatant.actions.length})
                                    </div>
                                    <div className="space-y-1">
                                        {combatant.actions.map((action, idx) => (
                                            <div key={idx} className="bg-dnd-dark/50 rounded border border-dnd-muted/10">
                                                <div
                                                    className="flex items-center justify-between p-2 cursor-pointer hover:bg-dnd-dark/70"
                                                    onClick={() => setExpandedActions(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                                >
                                                    <div className="font-bold text-sm text-dnd-accent flex items-center gap-2">
                                                        {action.name}
                                                        {action.equipped && <span className="text-xs text-green-400">⚡</span>}
                                                        {action.prepared && <span className="text-xs text-blue-400">📖</span>}
                                                    </div>
                                                    {expandedActions[idx] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </div>
                                                {expandedActions[idx] && (
                                                    <div className="px-2 pb-2 text-xs text-dnd-muted font-serif">{action.desc}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Equipment */}
                            {combatant.equipment && combatant.equipment.length > 0 && (
                                <div className="border-t border-dnd-muted/10 pt-3">
                                    <div className="text-xs text-dnd-muted uppercase tracking-wide mb-2 font-medium flex items-center gap-1">
                                        <Shield size={12} /> Equipment
                                    </div>
                                    <div className="space-y-1">
                                        {combatant.equipment.map((item, idx) => (
                                            <div key={idx} className="bg-dnd-dark/50 rounded px-2 py-1 text-xs">
                                                {item.name} {item.equipped && <span className="text-green-400">⚡</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default InitiativeTrackerDetail;
