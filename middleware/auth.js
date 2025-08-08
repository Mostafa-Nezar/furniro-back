const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async (req, res, next) => {
    const token = req.header('x-auth-token') ||
        (req.header('Authorization') && req.header('Authorization').replace('Bearer ', ''));

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log('🔍 Decoded token:', decoded);
        const userId = decoded.user ? decoded.user.id : decoded.id;

        if (!userId) {
            console.error('❌ No user ID found in token');
            return res.status(401).json({ msg: 'Invalid token structure' });
        }

        console.log('🔍 Looking for user with ID:', userId);
        const user = await User.findOne({ id: userId }).select('-password');
        if (!user) {
            console.error('❌ User not found with ID:', userId);
            return res.status(401).json({ msg: 'User not found' });
        }

        console.log('✅ User found:', user.name);
        req.user = user;
        next();
    } catch (err) {
        console.error('❌ Auth middleware error:', err);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Invalid token' });
        } else if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired' });
        }
        res.status(401).json({ msg: 'Token verification failed' });
    }
};
