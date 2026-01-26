import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';
import { useAuth } from './AuthContext';
// import io from 'socket.io-client'; // REPLACED BY CDN

const GameContext = createContext();

export const GameProvider = ({ children }) => {
    console.log('MinimalGameProvider init');
    const { token } = useAuth();
    console.log('Auth Token available:', !!token);
    console.log('API_URL available:', !!API_URL);

    const [gameState, setGameState] = useState({ simple: true });

    useEffect(() => {
        try {
            console.log('Attempting socket init (CDN)...');
            if (typeof window.io === 'undefined') {
                console.warn('Socket.io CDN not loaded yet. Waiting...');
                return;
            }
            const newSocket = window.io('http://localhost:3000');
            console.log('Socket initialized:', newSocket);
        } catch (err) {
            console.error('Socket init failed:', err);
        }
    }, []);

    return (
        <GameContext.Provider value={{ gameState }}>
            <div style={{ border: '2px solid yellow', padding: '10px' }}>
                Minimal Game Provider Wrapper
                {children}
            </div>
        </GameContext.Provider>
    );
};

export const useGame = () => {
    return useContext(GameContext);
};
