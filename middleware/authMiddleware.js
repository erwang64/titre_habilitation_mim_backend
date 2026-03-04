const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_mim_habilitation_2026';

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token invalide ou expiré.' });
    }
};

exports.verifyAdmin = (req, res, next) => {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'Admin')) {
        return res.status(403).json({ message: 'Accès réservé aux administrateurs.' });
    }
    next();
};

// Optional auth — sets req.user if token present, but doesn't block
exports.optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch {
            req.user = null;
        }
    } else {
        req.user = null;
    }
    next();
};
