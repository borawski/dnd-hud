import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('dnd_hud_token'));

    // Check if user is logged in on mount
    useEffect(() => {
        if (token) {
            // Token exists, assume user is logged in
            // In a production app, you'd validate the token with the server
            const storedUser = localStorage.getItem('dnd_hud_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
        setIsLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/api/dm/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }

            const data = await response.json();
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('dnd_hud_token', data.token);
            localStorage.setItem('dnd_hud_user', JSON.stringify(data.user));

            return data;
        } catch (err) {
            throw err;
        }
    };

    const signup = async (email, password, displayName) => {
        try {
            const response = await fetch(`${API_URL}/api/dm/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, displayName })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Signup failed');
            }

            const data = await response.json();
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('dnd_hud_token', data.token);
            localStorage.setItem('dnd_hud_user', JSON.stringify(data.user));

            return data;
        } catch (err) {
            throw err;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('dnd_hud_token');
        localStorage.removeItem('dnd_hud_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
