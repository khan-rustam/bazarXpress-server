const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const COLLECTION = 'users';

async function createUser(db, { name, email, password, role = 'user', phone = '', dateOfBirth = '', address = null }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        dateOfBirth,
        createdAt: new Date(),
    };
    if (address) user.address = address;
    const result = await db.collection(COLLECTION).insertOne(user);
    return {...user, _id: result.insertedId };
}

async function findUserByEmail(db, email) {
    return db.collection(COLLECTION).findOne({ email });
}

async function validatePassword(user, password) {
    return bcrypt.compare(password, user.password);
}

module.exports = {
    createUser,
    findUserByEmail,
    validatePassword,
};