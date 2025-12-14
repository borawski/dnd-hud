import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const InitiativeModal = ({ initiativeModal, setInitiativeModal, gameState, updateCombatant }) => {
    const [initiativeValue, setInitiativeValue] = useState(initiativeModal?.currentInit || 0);

    React.useEffect(() => {
        if (initiativeModal) {
            setInitiativeValue(initiativeModal.currentInit);
        }
    }, [initiativeModal]);

    const applyInitiative = () => {
        if (!initiativeModal) return;
        updateCombatant(initiativeModal.combatantId, 'initiative', initiativeValue);
        setInitiativeModal(null);
    };

    const increment = () => setInitiativeValue(prev => Math.min(99, prev + 1));
    const decrement = () => setInitiativeValue(prev => Math.max(0, prev - 1));

    if (!initiativeModal) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setInitiativeModal(null)}>
            <div className="bg-gradient-to-br from-dnd-card via-dnd-card to-dnd-dark rounded-2xl border border-dnd-accent/30 shadow-2xl p-8 max-w-md w-full transform transition-all" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-serif font-bold bg-gradient-to-r from-dnd-accent to-red-400 bg-clip-text text-transparent mb-2">
                        Set Initiative
                    </h3>
                    <div className="text-dnd-text font-medium text-lg">{initiativeModal.name}</div>
                </div>

                {/* Bumper Control */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <button
                        onClick={decrement}
                        className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-red-600/10 hover:from-red-500/30 hover:to-red-600/20 border border-red-500/30 hover:border-red-500/50 rounded-xl transition-all duration-200 shadow-lg hover:shadow-red-500/20 hover:scale-110 active:scale-95 flex items-center justify-center"
                    >
                        <Minus size={28} className="text-red-400" />
                    </button>

                    <div className="flex flex-col items-center">
                        <input
                            type="number"
                            value={initiativeValue}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setInitiativeValue(Math.max(0, Math.min(99, val)));
                            }}
                            className="w-32 bg-dnd-dark/50 border-2 border-dnd-muted/20 rounded-xl px-4 py-3 text-center text-5xl font-bold text-dnd-text focus:outline-none focus:border-dnd-accent/50 transition-colors shadow-inner"
                        />
                        <div className="text-xs text-dnd-muted mt-2 uppercase tracking-wide">Initiative</div>
                    </div>

                    <button
                        onClick={increment}
                        className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/10 hover:from-green-500/30 hover:to-green-600/20 border border-green-500/30 hover:border-green-500/50 rounded-xl transition-all duration-200 shadow-lg hover:shadow-green-500/20 hover:scale-110 active:scale-95 flex items-center justify-center"
                    >
                        <Plus size={28} className="text-green-400" />
                    </button>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-5 gap-2 mb-6">
                    {[1, 5, 10, 15, 20].map(preset => (
                        <button
                            key={preset}
                            onClick={() => setInitiativeValue(preset)}
                            className="py-2 bg-dnd-dark/50 hover:bg-dnd-accent/20 border border-dnd-muted/20 hover:border-dnd-accent/40 rounded-lg text-sm font-medium text-dnd-muted hover:text-dnd-text transition-all"
                        >
                            {preset}
                        </button>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setInitiativeModal(null)}
                        className="py-3 bg-dnd-dark/50 hover:bg-dnd-muted/20 border border-dnd-muted/20 rounded-xl text-sm font-medium text-dnd-muted hover:text-dnd-text transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={applyInitiative}
                        className="py-3 bg-gradient-to-r from-dnd-accent to-red-600 hover:from-dnd-accent/90 hover:to-red-600/90 rounded-xl text-sm font-bold text-white transition-all shadow-lg hover:shadow-dnd-accent/30 hover:scale-105 active:scale-95"
                    >
                        Set Initiative
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InitiativeModal;
