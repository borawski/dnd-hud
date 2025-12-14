import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const LogPanel = ({ gameState }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex-1 bg-dnd-card p-4 rounded-xl border border-dnd-muted/20 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <h2 className="text-xl font-serif">Log</h2>
                <button className="p-1 hover:bg-dnd-dark/50 rounded transition-colors">
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto text-sm space-y-1 font-mono text-dnd-muted">
                    {gameState.log.slice().reverse().map((entry, i) => (
                        <div key={i} className="border-b border-dnd-muted/10 pb-1">{entry}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LogPanel;
