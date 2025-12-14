import React from 'react';
import { useGame } from '../context/GameContext';
import MonsterSearch from './admin/MonsterSearch';
import AddPlayer from './admin/AddPlayer';
import InitiativeTracker from './admin/InitiativeTracker';
import LogPanel from './admin/LogPanel';

const AdminView = () => {
    const { gameState, updateState } = useGame();

    return (
        <div className="flex flex-col md:flex-row h-screen p-2 md:p-4 gap-2 md:gap-4 overflow-y-auto">
            {/* Left Sidebar: Player Import & Bestiary */}
            <div className="w-full md:w-1/4 md:min-w-[280px] flex flex-col gap-4">
                <AddPlayer />
                <MonsterSearch />
            </div>

            {/* Middle: Initiative Tracker */}
            <div className="flex-1 min-w-0">
                <InitiativeTracker
                    gameState={gameState}
                    updateState={updateState}
                />
            </div>

            {/* Right Sidebar: Log */}
            <div className="w-full md:w-1/4 md:min-w-[280px] flex flex-col gap-4">
                <LogPanel gameState={gameState} />
            </div>
        </div>
    );
};

export default AdminView;
