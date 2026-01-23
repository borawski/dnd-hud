const crypto = require('crypto');

// Simple JWT implementation (for MVP - consider using jsonwebtoken package for production)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash password using PBKDF2
 */
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

/**
 * Verify password against stored hash
 */
function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
}

/**
 * Generate JWT token
 */
function generateToken(payload) {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const now = Date.now();
    const tokenPayload = {
        ...payload,
        iat: now,
        exp: now + JWT_EXPIRES_IN
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');

    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
    try {
        const [encodedHeader, encodedPayload, signature] = token.split('.');

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest('base64url');

        if (signature !== expectedSignature) {
            throw new Error('Invalid signature');
        }

        // Decode payload
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());

        // Check expiration
        if (payload.exp && Date.now() > payload.exp) {
            throw new Error('Token expired');
        }

        return payload;
    } catch (err) {
        throw new Error('Invalid token');
    }
}

/**
 * Express middleware to authenticate DM requests
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const user = verifyToken(token);
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Generate random encounter ID (UUID-like)
 */
function generateEncounterId() {
    return crypto.randomBytes(16).toString('hex');
}

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    authenticateToken,
    generateEncounterId
};
