import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
// import io from 'socket.io-client'; // Using CDN
import { API_URL, SOCKET_URL } from '../config';
import { useAuth } from './AuthContext';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const { encounterId } = useParams(); // Get encounter ID from URL
    const location = useLocation();
    const { token } = useAuth();

    console.log('GameProvider init:', { encounterId, hasToken: !!token });

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

    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // Determine if user is DM (has token) or player (no token)
    const isDM = !!token;

    // Initialize Socket.IO connection
    useEffect(() => {
        const socketConfig = isDM
            ? { auth: { token } }  // DM authenticates with token
            : {};  // Player doesn't need auth

        // Check for CDN
        if (typeof window.io === 'undefined') {
            console.error('Socket.io not loaded');
            return;
        }

        const newSocket = window.io(SOCKET_URL || window.location.origin, socketConfig);

        newSocket.on('connect', () => {
            console.log('Socket connected as', isDM ? 'DM' : 'Player');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        newSocket.on('joined_encounter', ({ encounterId, isDM }) => {
            console.log(`Joined encounter ${encounterId} as ${isDM ? 'DM' : 'Player'}`);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [token, isDM]);

    // Join encounter room when encounterId changes
    useEffect(() => {
        if (socket && encounterId && isConnected) {
            console.log(`Joining encounter: ${encounterId}`);
            socket.emit('join_encounter', encounterId);
        }
    }, [socket, encounterId, isConnected]);

    // Fetch initial state when encounter ID is available
    useEffect(() => {
        if (!encounterId) {
            // No encounter ID in URL - might be on landing page or dashboard
            return;
        }

        const fetchInitialState = async () => {
            try {
                // Public endpoint - no auth required
                const response = await fetch(`${API_URL}/api/encounters/${encounterId}/gamestate`);

                if (!response.ok) {
                    if (response.status === 404) {
                        console.error('Encounter not found');
                        return;
                    }
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                if (data) {
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

    // Listen for state updates via Socket.IO
    useEffect(() => {
        if (!socket) return;

        const handleStateUpdate = (newState) => {
            console.log('Received state update via socket:', newState);
            setGameState({
                ...newState,
                combat_started: newState.combat_started ?? false
            });
        };

        socket.on('state_update', handleStateUpdate);

        return () => {
            socket.off('state_update', handleStateUpdate);
        };
    }, [socket]);

    // Update state (DM only)
    const updateState = async (updates) => {
        if (!isDM) {
            console.error('Players cannot update state');
            return;
        }

        if (!encounterId) {
            console.error('No encounter ID available');
            return;
        }

        // Optimistic update
        setGameState(prev => ({ ...prev, ...updates }));

        try {
            const response = await fetch(`${API_URL}/api/encounters/${encounterId}/gamestate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error('Failed to update state');
            }

            const newState = await response.json();
            console.log('State updated successfully');

            // The server will broadcast via Socket.IO, but update locally too
            setGameState({
                ...newState,
                combat_started: newState.combat_started ?? false
            });
        } catch (err) {
            console.error('Failed to update state:', err);
            // Revert optimistic update by refetching
            // In production, you might want more sophisticated error handling
        }
    };

    console.log('GameProvider rendering children');
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
