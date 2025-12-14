import React, { useState } from 'react';

const HpModifierModal = ({ hpModal, setHpModal, gameState, updateCombatant }) => {
    const [hpModifier, setHpModifier] = useState('');

    const applyHpModifier = () => {
        if (!hpModal || !hpModifier) return;
        const modifier = parseInt(hpModifier);
        const combatant = gameState.initiative_order.find(c => c.id === hpModal.combatantId);
        if (!combatant) return;
        const newHp = Math.max(0, Math.min(combatant.maxHp, combatant.hp + modifier));
        updateCombatant(hpModal.combatantId, 'hp', newHp);
        setHpModal(null);
        setHpModifier('');
    };

    const addToModifier = (digit) => {
        if (hpModifier.length < 4) {
            setHpModifier(hpModifier + digit);
        }
    };

    const clearModifier = () => setHpModifier('');
    const backspace = () => setHpModifier(hpModifier.slice(0, -1));

    if (!hpModal) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={() => setHpModal(null)}>
            <div className="bg-gradient-to-br from-dnd-card via-dnd-card to-dnd-dark rounded-2xl border border-dnd-accent/30 shadow-2xl p-8 max-w-sm w-full transform transition-all" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-serif font-bold bg-gradient-to-r from-dnd-accent to-red-400 bg-clip-text text-transparent mb-3">
                        Modify HP
                    </h3>
                    <div className="inline-block bg-dnd-dark/50 rounded-xl px-6 py-3 border border-dnd-muted/20">
                        <div className="text-xs text-dnd-muted uppercase tracking-wide mb-1">Current HP</div>
                        <div className="text-3xl font-bold text-dnd-text">{hpModal.currentHp}</div>
                    </div>
                </div>

                {/* Display */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={hpModifier}
                            readOnly
                            placeholder="+/- amount"
                            className="w-full bg-dnd-dark/50 border-2 border-dnd-muted/20 rounded-xl px-6 py-4 text-center text-4xl font-bold text-dnd-text placeholder-dnd-muted/30 focus:outline-none focus:border-dnd-accent/50 transition-colors shadow-inner"
                        />
                    </div>
                </div>

                {/* Numeric Keypad */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                        <button
                            key={num}
                            onClick={() => addToModifier(num.toString())}
                            className="aspect-square bg-gradient-to-br from-dnd-dark to-dnd-dark/70 hover:from-dnd-accent/20 hover:to-dnd-accent/10 border border-dnd-muted/20 hover:border-dnd-accent/40 rounded-xl text-2xl font-bold text-dnd-text transition-all duration-200 shadow-lg hover:shadow-dnd-accent/20 hover:scale-105 active:scale-95"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={() => addToModifier('-')}
                        className="aspect-square bg-gradient-to-br from-red-500/20 to-red-600/10 hover:from-red-500/30 hover:to-red-600/20 border border-red-500/30 hover:border-red-500/50 rounded-xl text-2xl font-bold text-red-400 transition-all duration-200 shadow-lg hover:shadow-red-500/20 hover:scale-105 active:scale-95"
                    >
                        -
                    </button>
                    <button
                        onClick={() => addToModifier('0')}
                        className="aspect-square bg-gradient-to-br from-dnd-dark to-dnd-dark/70 hover:from-dnd-accent/20 hover:to-dnd-accent/10 border border-dnd-muted/20 hover:border-dnd-accent/40 rounded-xl text-2xl font-bold text-dnd-text transition-all duration-200 shadow-lg hover:shadow-dnd-accent/20 hover:scale-105 active:scale-95"
                    >
                        0
                    </button>
                    <button
                        onClick={() => addToModifier('+')}
                        className="aspect-square bg-gradient-to-br from-green-500/20 to-green-600/10 hover:from-green-500/30 hover:to-green-600/20 border border-green-500/30 hover:border-green-500/50 rounded-xl text-2xl font-bold text-green-400 transition-all duration-200 shadow-lg hover:shadow-green-500/20 hover:scale-105 active:scale-95"
                    >
                        +
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={clearModifier}
                        className="py-3 bg-dnd-dark/50 hover:bg-dnd-muted/20 border border-dnd-muted/20 rounded-xl text-sm font-medium text-dnd-muted hover:text-dnd-text transition-all"
                    >
                        Clear
                    </button>
                    <button
                        onClick={backspace}
                        className="py-3 bg-dnd-dark/50 hover:bg-dnd-muted/20 border border-dnd-muted/20 rounded-xl text-sm font-medium text-dnd-muted hover:text-dnd-text transition-all"
                    >
                        ⌫
                    </button>
                    <button
                        onClick={applyHpModifier}
                        className="py-3 bg-gradient-to-r from-dnd-accent to-red-600 hover:from-dnd-accent/90 hover:to-red-600/90 rounded-xl text-sm font-bold text-white transition-all shadow-lg hover:shadow-dnd-accent/30 hover:scale-105 active:scale-95"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HpModifierModal;
