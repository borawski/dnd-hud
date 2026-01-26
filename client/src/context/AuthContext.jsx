import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';
import { decodeJWT } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('dnd_hud_token'));

    // Define logout function first so it can be used in useEffect hooks
    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('dnd_hud_token');
        localStorage.removeItem('dnd_hud_user');
    };

    // Check if user is logged in on mount
    useEffect(() => {
        if (token) {
            // Check if token is expired
            const decoded = decodeJWT(token);

            if (decoded.expired) {
                // Token is expired, logout immediately
                console.log('Token expired on mount, logging out');
                logout();
                setIsLoading(false);
                return;
            }

            // Token is valid, restore user session
            const storedUser = localStorage.getItem('dnd_hud_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
        setIsLoading(false);
    }, [token]);

    // Listen for auth:expired events from API calls
    useEffect(() => {
        const handleAuthExpired = () => {
            console.log('Auth expired event received, logging out');
            toast.error('Your session has expired. Please log in again.', {
                duration: 5000,
            });
            logout();
        };

        window.addEventListener('auth:expired', handleAuthExpired);
        return () => window.removeEventListener('auth:expired', handleAuthExpired);
    }, []);

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

    const handleAuthResponse = (data) => {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('dnd_hud_token', data.token);
        localStorage.setItem('dnd_hud_user', JSON.stringify(data.user));
        return data;
    };

    const loginWithGoogle = async (data) => {
        try {
            const payload = {
                clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "220866471456-t2odbshu8c63pb767dtn8armo9dsesnu.apps.googleusercontent.com"
            };

            if (data.credential) payload.credential = data.credential;
            if (data.access_token) payload.accessToken = data.access_token; // Map access_token (from hook) to accessToken (expected by backend)

            const response = await fetch(`${API_URL}/api/dm/google-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Google login failed');
            }

            const responseData = await response.json();
            return handleAuthResponse(responseData);
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

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, loginWithGoogle }}>
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
