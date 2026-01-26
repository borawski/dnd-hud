import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
// import io from 'socket.io-client'; // DISABLED FOR DEBUGGING
import { API_URL } from '../config';
import { useAuth } from './AuthContext';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const { encounterId } = useParams();
    const { token } = useAuth();

    console.log('SafeGameProvider init');

    const [gameState, setGameState] = useState({
        active_map: '',
        initiative_order: [],
        current_turn_index: 0,
        current_round: 1,
        turns_completed: 0,
        combat_started: false,
        turn_start_time: null,
        log: []
    });

    // MOCK SOCKET
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(true); // Pretend we are connected

    const isDM = !!token;

    // Disabled real socket for now
    useEffect(() => {
        console.log('Socket disabled in debug mode');
    }, []);

    // Fetch initial state
    useEffect(() => {
        if (!encounterId) return;

        const fetchInitialState = async () => {
            try {
                const response = await fetch(`${API_URL}/api/encounters/${encounterId}/gamestate`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Loaded encounter state:', data);
                    setGameState({
                        ...data,
                        combat_started: data.combat_started ?? false
                    });
                }
            } catch (err) {
                console.error('Failed to fetch encounter state:', err);
            }
        };

        fetchInitialState();
    }, [encounterId]);

    const updateState = async (updates) => {
        console.log('Mock updateState:', updates);
        setGameState(prev => ({ ...prev, ...updates }));
    };

    return (
        <GameContext.Provider value={{
            gameState,
            updateState,
            encounterId,
            isDM,
            isConnected
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
