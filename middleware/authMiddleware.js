const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or malformed.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Look up the user in the DB to get the full user object (including role)
        const db = req.app.locals.db;
        const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.id) });
        if (!user) return res.status(401).json({ error: 'User not found' });
        req.user = user; // Attach full user object, including role
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = authMiddleware;