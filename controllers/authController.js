const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail, validatePassword } = require('../models/User');
const { ObjectId } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

function generateToken(user) {
    return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res, next) {
    try {
        const { name, email, password, phone = '', dateOfBirth = '' } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }
        const db = req.app.locals.db;
        const existing = await findUserByEmail(db, email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered.' });
        }
        const user = await createUser(db, { name, email, password, phone, dateOfBirth });
        const token = generateToken(user);
        res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, dateOfBirth: user.dateOfBirth, address: user.address || null } });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        const db = req.app.locals.db;
        const user = await findUserByEmail(db, email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        const valid = await validatePassword(user, password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        const token = generateToken(user);
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, dateOfBirth: user.dateOfBirth, address: user.address || null } });
    } catch (err) {
        next(err);
    }
}

async function updateProfile(req, res, next) {
    try {
        const userId = req.user.id;
        const { name, phone, dateOfBirth, address } = req.body;
        const db = req.app.locals.db;
        const update = {};
        if (name) update.name = name;
        if (phone) update.phone = phone;
        if (dateOfBirth) update.dateOfBirth = dateOfBirth;
        if (address) update.address = address;
        await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: update });
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, dateOfBirth: user.dateOfBirth, address: user.address || null } });
    } catch (err) {
        next(err);
    }
}

async function getAllUsers(req, res, next) {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const db = req.app.locals.db;
        const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
        res.json(users.map(u => ({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            phone: u.phone,
            dateOfBirth: u.dateOfBirth,
            address: u.address || null
        })));
    } catch (err) {
        next(err);
    }
}

async function deleteUser(req, res, next) {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const db = req.app.locals.db;
        const userId = req.params.id;
        await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}

async function updateUserRole(req, res, next) {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const db = req.app.locals.db;
        const userId = req.params.id;
        const { role } = req.body;
        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { role } });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
}

module.exports = { register, login, updateProfile, getAllUsers, deleteUser, updateUserRole };