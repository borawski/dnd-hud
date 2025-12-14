import React from 'react';
import { useGame } from '../context/GameContext';
import { Shield, Heart, Eye, Activity } from 'lucide-react';

const PlayerView = () => {
    const { gameState } = useGame();

    // Filter out monsters if we only want to show players, or show all?
    // User asked for "integrate as much of this data as you can for the admin and player view"
    // Usually Player View shows everyone in initiative.

    const sortedCombatants = [...gameState.initiative_order].sort((a, b) => {
        return b.initiative - a.initiative;
    });

    return (
        <div className="min-h-screen bg-black p-4 text-dnd-text font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
                {sortedCombatants.map((c, idx) => {
                    const isCurrentTurn = idx === gameState.current_turn_index;
                    const isPlayer = c.type === 'player';

                    return (
                        <div
                            key={c.id}
                            className={`
                                relative overflow-hidden rounded-xl border-2 transition-all duration-500
                                ${isCurrentTurn
                                    ? 'border-dnd-accent shadow-[0_0_30px_rgba(225,29,72,0.4)] scale-105 z-10'
                                    : 'border-dnd-muted/20 bg-dnd-card/50 opacity-90'
                                }
                            `}
                        >
                            {/* Background Image / Avatar Blur */}
                            {isPlayer && c.avatar && (
                                <div
                                    className="absolute inset-0 bg-cover bg-center opacity-20 blur-sm"
                                    style={{ backgroundImage: `url(${c.avatar})` }}
                                />
                            )}

                            <div className="relative p-4 flex flex-col gap-3 bg-gradient-to-b from-black/40 to-black/80 h-full">

                                {/* Header */}
                                <div className="flex items-center gap-3">
                                    {isPlayer && c.avatar ? (
                                        <img src={c.avatar} alt={c.name} className="w-16 h-16 rounded-full border-2 border-dnd-accent object-cover shadow-lg" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-dnd-muted/20 flex items-center justify-center border-2 border-dnd-muted/40">
                                            <span className="text-2xl font-serif font-bold">{c.name[0]}</span>
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-bold truncate text-white leading-tight">{c.name}</h2>
                                        {isPlayer && (
                                            <p className="text-xs text-dnd-accent font-medium uppercase tracking-wider truncate">
                                                {c.classes}
                                            </p>
                                        )}
                                        {!isPlayer && (
                                            <p className="text-xs text-dnd-muted uppercase tracking-wider">Monster</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-center justify-center bg-dnd-dark/80 rounded-lg p-2 min-w-[3rem] border border-dnd-muted/30">
                                        <span className="text-xs text-dnd-muted uppercase">Init</span>
                                        <span className="text-xl font-mono font-bold text-white">{c.initiative}</span>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {/* HP */}
                                    <div className="bg-dnd-dark/60 rounded p-2 flex flex-col items-center border border-dnd-muted/10">
                                        <Heart size={16} className="text-red-500 mb-1" />
                                        <span className="text-lg font-bold text-white">
                                            {c.hp} <span className="text-xs text-dnd-muted font-normal">/ {c.maxHp}</span>
                                        </span>
                                        <span className="text-[10px] text-dnd-muted uppercase">HP</span>
                                    </div>

                                    {/* AC */}
                                    <div className="bg-dnd-dark/60 rounded p-2 flex flex-col items-center border border-dnd-muted/10">
                                        <Shield size={16} className="text-blue-400 mb-1" />
                                        <span className="text-lg font-bold text-white">{c.ac}</span>
                                        <span className="text-[10px] text-dnd-muted uppercase">AC</span>
                                    </div>

                                    {/* Passive Perception (Players Only) */}
                                    {isPlayer ? (
                                        <div className="bg-dnd-dark/60 rounded p-2 flex flex-col items-center border border-dnd-muted/10">
                                            <Eye size={16} className="text-green-400 mb-1" />
                                            <span className="text-lg font-bold text-white">{c.passivePerception}</span>
                                            <span className="text-[10px] text-dnd-muted uppercase">P. Perc</span>
                                        </div>
                                    ) : (
                                        <div className="bg-dnd-dark/60 rounded p-2 flex flex-col items-center border border-dnd-muted/10 opacity-50">
                                            <Activity size={16} className="text-dnd-muted mb-1" />
                                            <span className="text-lg font-bold text-dnd-muted">-</span>
                                            <span className="text-[10px] text-dnd-muted uppercase">Stats</span>
                                        </div>
                                    )}
                                </div>

                                {/* Ability Scores (Players Only, Small) */}
                                {isPlayer && c.stats && (
                                    <div className="grid grid-cols-6 gap-1 mt-1 text-center">
                                        {Object.entries(c.stats).map(([stat, val]) => (
                                            <div key={stat} className="bg-black/40 rounded py-1">
                                                <div className="text-[9px] text-dnd-muted uppercase">{stat}</div>
                                                <div className="text-xs font-bold text-dnd-text">{val}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PlayerView;
