import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { API_URL, SOCKET_URL } from '../config';

const GameContext = createContext();

const socket = io(SOCKET_URL || window.location.origin);

export const GameProvider = ({ children }) => {
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

    // Fetch initial state from server
    useEffect(() => {
        const fetchInitialState = async () => {
            try {
                const response = await fetch(`${API_URL}/api/gamestate`);
                const data = await response.json();
                if (data) {
                    console.log('Loaded initial state from server:', data);
                    // Ensure combat_started exists in loaded state
                    setGameState({
                        ...data,
                        combat_started: data.combat_started ?? false
                    });
                }
            } catch (err) {
                console.error('Failed to fetch initial game state:', err);
            }
        };

        fetchInitialState();
    }, []);

    useEffect(() => {
        socket.on('state_update', (newState) => {
            console.log('Received state update:', newState);
            // Ensure combat_started exists in socket updates
            setGameState({
                ...newState,
                combat_started: newState.combat_started ?? false
            });
        });

        return () => {
            socket.off('state_update');
        };
    }, []);

    const updateState = async (updates) => {
        // Optimistic update
        setGameState(prev => ({ ...prev, ...updates }));

        try {
            await fetch(`${API_URL}/api/gamestate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
        } catch (err) {
            console.error('Failed to update state:', err);
        }
    };

    return (
        <GameContext.Provider value={{ gameState, updateState }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => useContext(GameContext);
