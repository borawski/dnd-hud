import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { API_URL, SOCKET_URL } from '../config';
import { useAuth } from './AuthContext';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const { campaignId } = useParams(); // Get campaign ID from URL
    const location = useLocation();
    const { token } = useAuth();

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

        const newSocket = io(SOCKET_URL || window.location.origin, socketConfig);

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

    // Join campaign room when campaignId changes
    useEffect(() => {
        if (socket && campaignId && isConnected) {
            console.log(`Joining campaign: ${campaignId}`);
            socket.emit('join_encounter', campaignId);
        }
    }, [socket, campaignId, isConnected]);

    // Fetch initial state when campaign ID is available
    useEffect(() => {
        if (!campaignId) {
            // No campaign ID in URL - might be on landing page or dashboard
            return;
        }

        const fetchInitialState = async () => {
            try {
                // Public endpoint - no auth required
                const response = await fetch(`${API_URL}/api/encounters/${campaignId}/gamestate`);

                if (!response.ok) {
                    if (response.status === 404) {
                        console.error('Campaign not found');
                        return;
                    }
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                if (data) {
                    console.log('Loaded campaign state:', data);
                    setGameState({
                        ...data,
                        combat_started: data.combat_started ?? false
                    });
                }
            } catch (err) {
                console.error('Failed to fetch campaign state:', err);
            }
        };

        fetchInitialState();
    }, [campaignId]);

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

        if (!campaignId) {
            console.error('No campaign ID available');
            return;
        }

        // Optimistic update
        setGameState(prev => ({ ...prev, ...updates }));

        try {
            const response = await fetch(`${API_URL}/api/encounters/${campaignId}/gamestate`, {
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

    return (
        <GameContext.Provider value={{
            gameState,
            updateState,
            campaignId,
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
