import { API_URL } from '../config';

/**
 * Decode JWT token to check expiration
 * Returns { valid: boolean, expired: boolean, payload: object | null }
 */
export function decodeJWT(token) {
    try {
        if (!token) return { valid: false, expired: false, payload: null };

        const parts = token.split('.');
        if (parts.length !== 3) return { valid: false, expired: false, payload: null };

        const payload = JSON.parse(atob(parts[1]));
        const isExpired = payload.exp && Date.now() > payload.exp;

        return {
            valid: !isExpired,
            expired: isExpired,
            payload: isExpired ? null : payload
        };
    } catch (err) {
        return { valid: false, expired: false, payload: null };
    }
}

/**
 * Custom fetch wrapper with authentication and error handling
 * Automatically adds auth token and handles expired token errors
 */
export async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('dnd_hud_token');

    // Add authorization header if token exists
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
        const data = await response.json().catch(() => ({}));

        // If token is expired, trigger logout
        if (data.expired || response.status === 401) {
            // Dispatch custom event for AuthContext to handle
            window.dispatchEvent(new CustomEvent('auth:expired'));
            throw new Error('Your session has expired. Please log in again.');
        }

        throw new Error(data.error || 'Authentication failed');
    }

    return response;
}

/**
 * Helper to make authenticated API calls
 */
export const api = {
    get: async (endpoint) => {
        const response = await authenticatedFetch(`${API_URL}${endpoint}`);
        return response.json();
    },

    post: async (endpoint, data) => {
        const response = await authenticatedFetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.json();
    },

    delete: async (endpoint) => {
        const response = await authenticatedFetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
        });
        return response.json();
    },
};
