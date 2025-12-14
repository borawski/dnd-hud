import React, { useState } from 'react';
import { Map as MapIcon, ChevronDown, ChevronRight } from 'lucide-react';

const MapPanel = ({ gameState, updateState }) => {
    const [mapUrl, setMapUrl] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    const setMap = () => {
        updateState({ active_map: mapUrl });
    };

    return (
        <div className="bg-dnd-card p-4 rounded-xl border border-dnd-muted/20">
            <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <h2 className="text-xl font-serif flex items-center gap-2">
                    <MapIcon size={20} /> Map
                </h2>
                <button className="p-1 hover:bg-dnd-dark/50 rounded transition-colors">
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            {!isCollapsed && (
                <>
                    <div className="flex gap-2 mb-4">
                        <input
                            value={mapUrl}
                            onChange={(e) => setMapUrl(e.target.value)}
                            placeholder="Image URL..."
                            className="flex-1 bg-dnd-dark border border-dnd-muted/30 rounded px-3 py-2 text-sm"
                        />
                        <button onClick={setMap} className="px-3 bg-dnd-dark border border-dnd-muted/30 rounded hover:bg-dnd-accent hover:border-dnd-accent transition-colors">
                            Set
                        </button>
                    </div>
                    <div className="aspect-video bg-dnd-dark rounded overflow-hidden border border-dnd-muted/20 relative">
                        {gameState.active_map ? (
                            <img src={gameState.active_map} alt="Map" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-dnd-muted text-sm">No Map Active</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default MapPanel;
