// Middleware to check if the user ID in params matches the authenticated user
module.exports = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ msg: 'middleware: Authentication required' });
    }

    const userId = Number(req.params.id);

    if (isNaN(userId)) {
        return res.status(400).json({ msg: 'middleware: Invalid user ID' });
    }

    if (req.user.id !== userId) {
        return res.status(403).json({ msg: 'middleware: Unauthorized: user ID mismatch' });
    }

    next();
};

