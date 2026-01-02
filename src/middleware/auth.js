const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async (req, res, next) => {
    const token = req.header('x-auth-token') ||
        (req.header('Authorization') && req.header('Authorization').replace('Bearer ', ''));

    if (!token) {
        return res.status(401).json({ msg: 'middleware: No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userId = decoded.user ? decoded.user.id : decoded.id;

        if (!userId) {
            return res.status(401).json({ msg: 'middleware: Invalid token structure' });
        }

        const user = await User.findOne({ id: userId }).select('-password');
        if (!user) {
            return res.status(401).json({ msg: 'middleware: User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'middleware: Invalid token' });
        } else if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'middleware: Token expired' });
        }
        res.status(401).json({ msg: 'middleware: Token verification failed' });
    }
};
