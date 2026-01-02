const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

module.exports = async (req, res, next) => {
    const token = req.header('x-auth-token') ||
        (req.header('Authorization') && req.header('Authorization').replace('Bearer ', ''));

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const adminId = decoded.id;

        if (!adminId) {
            return res.status(401).json({ msg: 'Invalid token structure' });
        }

        const admin = await Admin.findOne({ id: adminId }).select('-password');
        if (!admin) {
            return res.status(401).json({ msg: 'Admin not found' });
        }

        if (!admin.isActive) {
            return res.status(403).json({ msg: 'Admin account is deactivated' });
        }

        req.admin = admin;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Invalid token' });
        } else if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired' });
        }
        res.status(401).json({ msg: 'Token verification failed' });
    }
};

