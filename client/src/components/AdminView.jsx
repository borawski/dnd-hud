import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import MonsterSearch from './admin/MonsterSearch';
import AddPlayer from './admin/AddPlayer';
import InitiativeTracker from './admin/InitiativeTracker';
import LogPanel from './admin/LogPanel';

const AdminView = () => {
    const { gameState, updateState, campaignId } = useGame();
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
            {/* Navigation Header */}
            <div className="bg-dnd-card border-b border-dnd-muted/20 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <button
                    onClick={handleBackToDashboard}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dnd-dark/50 transition-colors text-dnd-accent whitespace-nowrap"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium hidden sm:inline">Back to Dashboard</span>
                    <span className="font-medium sm:hidden">Dashboard</span>
                </button>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-xs sm:text-sm text-dnd-muted truncate">ID: {campaignId?.slice(0, 8)}...</span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-red-400 whitespace-nowrap"
                    >
                        <LogOut size={18} />
                        <span className="font-medium hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>

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
