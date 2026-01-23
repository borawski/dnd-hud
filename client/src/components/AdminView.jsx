import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import MonsterSearch from './admin/MonsterSearch';
import AddPlayer from './admin/AddPlayer';
import InitiativeTracker from './admin/InitiativeTracker';
import LogPanel from './admin/LogPanel';

const AdminView = () => {
    const { gameState, updateState, encounterId } = useGame();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleBackToDashboard = () => {
        navigate('/dm/dashboard');
    };

    const handleLogout = () => {
        logout();
        navigate('/dm/login');
    };

    return (
        <div className="flex flex-col h-screen">
            <Navbar backLink="/dm/dashboard" backText="Back to Dashboard" onLogout={handleLogout} />

            {/* Main Content */}
            <div className="flex flex-col md:flex-row flex-1 p-4 gap-4 overflow-y-auto">
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
        </div>
    );
};

export default AdminView;
