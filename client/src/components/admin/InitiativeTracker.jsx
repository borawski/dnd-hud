import React from 'react';
import { Play, RotateCcw, Sword } from 'lucide-react';
import InitiativeTrackerDetail from './InitiativeTrackerDetail';
import { API_URL } from '../../config';

const InitiativeTracker = ({ gameState, updateState }) => {
    const [expandedId, setExpandedId] = React.useState(null);
    const [roundChanged, setRoundChanged] = React.useState(false);
    const prevRoundRef = React.useRef(gameState.current_round);

    const [isProcessing, setIsProcessing] = React.useState(false);

    // Detect round changes and trigger animation
    React.useEffect(() => {
        if (prevRoundRef.current !== gameState.current_round) {
            setRoundChanged(true);
            prevRoundRef.current = gameState.current_round;

            // Remove animation class after animation completes
            const timer = setTimeout(() => setRoundChanged(false), 600);
            return () => clearTimeout(timer);
        }
    }, [gameState.current_round]);

    // Helper function to clean up numbering when monsters are removed
    const cleanupNumbering = (order) => {
        const monsterGroups = {};

        // Group monsters by baseName to count them
        order.forEach(c => {
            if (c.type === 'monster' && c.baseName) {
                if (!monsterGroups[c.baseName]) {
                    monsterGroups[c.baseName] = [];
                }
                monsterGroups[c.baseName].push(c);
            }
        });

        // Only action: remove numbers if only one monster of that type remains
        return order.map(c => {
            if (c.type === 'monster' && c.baseName && monsterGroups[c.baseName]) {
                const group = monsterGroups[c.baseName];
                if (group.length === 1 && c.monsterNumber) {
                    // Remove number if only one left
                    const { monsterNumber, ...rest } = c;
                    return rest;
                }
            }
            // CRITICAL: Return combatant as-is, preserving ALL existing data including numbers
            return c;
        });
    };

    // Clean up numbering (initiative_order is now always kept sorted)
    const sortedOrder = cleanupNumbering([...gameState.initiative_order]);

    // Check if combat has started from gameState
    const combatStarted = gameState.combat_started;

    const nextTurn = async () => {
        if (gameState.initiative_order.length === 0 || isProcessing) return;

        setIsProcessing(true);
        try {
            // Check if this is the first turn (Begin Combat)
            if (!combatStarted) {
                // First time clicking "Begin Combat" - just mark combat as started
                const turnStartTime = new Date().toISOString();
                const firstCombatant = sortedOrder[0];
                const timestamp = new Date().toLocaleTimeString();
                const logEntry = `${timestamp} - Combat started! ${firstCombatant.name}'s turn`;

                console.log('Setting turn_start_time on combat start:', turnStartTime);

                // Sync first combatant if they have sync enabled
                if (firstCombatant.type === 'player' && firstCombatant.syncEnabled && firstCombatant.importMode === 'dndbeyond') {
                    try {
                        await fetch(`${API_URL}/api/sync-player/${firstCombatant.id}`, {
                            method: 'POST'
                        });
                        console.log(`Synced ${firstCombatant.name} from D&D Beyond`);
                    } catch (err) {
                        console.error('Failed to sync player:', err);
                    }
                }

                await updateState({
                    combat_started: true,
                    turn_start_time: turnStartTime,
                    log: [...(gameState.log || []), logEntry]
                    // Keep current_turn_index at 0
                });
                return;
            }

            // Normal turn progression (after combat has started)
            const currentCombatant = sortedOrder[gameState.current_turn_index];
            const currentTime = new Date();
            const timestamp = currentTime.toLocaleTimeString();

            // Calculate turn duration if we have a start time
            let turnEndLog = '';
            if (gameState.turn_start_time && currentCombatant) {
                const duration = Math.floor((currentTime - new Date(gameState.turn_start_time)) / 1000);
                turnEndLog = `${timestamp} - ${currentCombatant.name}'s turn ended (${duration}s)`;
            }

            // Mark current combatant as done, THEN move to next
            const updatedOrder = gameState.initiative_order.map((c, idx) => {
                if (idx === gameState.current_turn_index) {
                    return { ...c, has_acted: true };
                }
                return c;
            });

            const nextIndex = (gameState.current_turn_index + 1) % gameState.initiative_order.length;
            const newTurnStartTime = new Date().toISOString();
            const nextCombatant = sortedOrder[nextIndex];

            // Build log entries
            const newLogEntries = [...(gameState.log || [])];
            if (turnEndLog) newLogEntries.push(turnEndLog);

            // Check if we're starting a new round
            if (nextIndex === 0) {
                const newRound = (gameState.current_round || 1) + 1;
                newLogEntries.push(`${timestamp} - Round ${newRound} begins!`);
            }

            newLogEntries.push(`${timestamp} - ${nextCombatant.name}'s turn started`);

            // Sync next combatant if they have sync enabled
            if (nextCombatant.type === 'player' && nextCombatant.syncEnabled && nextCombatant.importMode === 'dndbeyond') {
                try {
                    await fetch(`${API_URL}/api/sync-player/${nextCombatant.id}`, {
                        method: 'POST'
                    });
                    console.log(`Synced ${nextCombatant.name} from D&D Beyond`);
                    newLogEntries.push(`${timestamp} - ${nextCombatant.name} synced from D&D Beyond`);
                } catch (err) {
                    console.error('Failed to sync player:', err);
                }
            }

            // If we're cycling back to the first combatant, increment round and reset all has_acted flags
            const updates = {
                current_turn_index: nextIndex,
                turn_start_time: newTurnStartTime,
                log: newLogEntries,
                initiative_order: nextIndex === 0
                    ? updatedOrder.map(c => ({ ...c, has_acted: false }))
                    : updatedOrder
            };

            if (nextIndex === 0) {
                updates.current_round = (gameState.current_round || 1) + 1;
            }

            await updateState(updates);
        } finally {
            setIsProcessing(false);
        }
    };

    const updateCombatant = (id, field, value) => {
        const newOrder = gameState.initiative_order.map(c =>
            c.id === id ? { ...c, [field]: value } : c
        );

        // Only sort and reset index if initiative is being changed
        if (field === 'initiative') {
            // Always sort by initiative
            const sorted = newOrder.sort((a, b) => b.initiative - a.initiative);

            // Before combat starts, always point to #1
            // During combat, initiative is locked (shouldn't be called)
            const newIndex = 0;  // Always point to highest initiative

            updateState({
                initiative_order: sorted,
                current_turn_index: newIndex
            });
        } else {
            // For HP or other field changes, just update without sorting or resetting index
            updateState({
                initiative_order: newOrder
            });
        }
    };

    const removeCombatant = (id) => {
        const currentCombatantId = gameState.initiative_order[gameState.current_turn_index]?.id;
        const newOrder = gameState.initiative_order.filter(c => c.id !== id);

        // Keep sorted after removal
        const sorted = newOrder.sort((a, b) => b.initiative - a.initiative);

        // Update index to track the same combatant, or 0 if it was removed
        let newIndex = 0;
        if (currentCombatantId !== id) {
            newIndex = sorted.findIndex(c => c.id === currentCombatantId);
            if (newIndex < 0) newIndex = 0;
        }

        updateState({
            initiative_order: sorted,
            current_turn_index: newIndex
        });

        if (expandedId === id) {
            setExpandedId(null);
        }
    };

    const toggleExpanded = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const logDamage = (attackerName, targetName, damage) => {
        const timestamp = new Date().toLocaleTimeString();
        let logEntry;

        if (attackerName) {
            // Specific attacker was selected
            logEntry = `${timestamp} - ${attackerName} damaged ${targetName} for ${damage} HP`;
        } else {
            // Generic damage (no attacker selected)
            logEntry = `${timestamp} - ${targetName} was hit for ${damage} HP`;
        }

        // Add to local log (you might want to send this to server)
        const currentLog = gameState.log || [];
        updateState({
            log: [...currentLog, logEntry]
        });
    };

    return (
        <div className="flex-1 flex flex-col bg-dnd-card rounded-xl border border-dnd-muted/20 overflow-hidden">
            <div className="p-3 border-b border-dnd-muted/20 bg-dnd-dark/30">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-serif flex items-center gap-2">
                            <Sword size={18} className="text-dnd-accent" />
                            Initiative
                        </h2>
                        <div className={`px-2 py-1 rounded text-xs font-bold bg-dnd-accent/10 text-dnd-accent border border-dnd-accent/30 transition-all ${roundChanged ? 'animate-pulse-glow' : ''
                            }`}>
                            Round {gameState.current_round || 1}
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end sm:justify-start">
                        <button
                            onClick={nextTurn}
                            disabled={isProcessing}
                            className={`flex items-center gap-2 px-2 py-1 bg-dnd-accent text-white rounded transition-colors text-xs font-bold ${isProcessing ? 'opacity-70 cursor-not-allowed animate-pulse' : 'hover:bg-red-700'}`}
                        >
                            <Play size={12} /> {combatStarted ? 'Next' : 'Begin Combat'}
                        </button>
                        <button onClick={() => updateState({ initiative_order: [], current_turn_index: 0, current_round: 1, combat_started: false })} className="p-1 text-dnd-muted hover:text-red-400">
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                {sortedOrder.length > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-dnd-dark rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-dnd-accent to-red-400 transition-all duration-300 ease-out"
                                style={{ width: `${(sortedOrder.filter(c => c.has_acted).length / sortedOrder.length) * 100}%` }}
                            />
                        </div>
                        <div className="text-xs text-dnd-muted font-mono whitespace-nowrap">
                            {sortedOrder.filter(c => c.has_acted).length} / {sortedOrder.length}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sortedOrder.map((combatant, idx) => (
                    <div key={combatant.id} className="transition-all duration-500 ease-in-out">
                        <InitiativeTrackerDetail
                            combatant={combatant}
                            position={idx + 1}
                            isCurrentTurn={idx === gameState.current_turn_index}
                            turnStartTime={idx === gameState.current_turn_index ? gameState.turn_start_time : null}
                            isExpanded={expandedId === combatant.id}
                            onToggle={() => toggleExpanded(combatant.id)}
                            onUpdate={updateCombatant}
                            onRemove={removeCombatant}
                            combatStarted={combatStarted}
                            currentAttacker={sortedOrder[gameState.current_turn_index]}
                            allCombatants={sortedOrder}
                            onLogDamage={logDamage}
                        />
                    </div>
                ))}

                {sortedOrder.length === 0 && (
                    <div className="text-center text-dnd-muted py-10 italic text-sm">
                        No combatants. Add monsters or players.
                    </div>
                )}
            </div>
        </div>
    );
};

export default InitiativeTracker;
