const { supabase } = require('../config/config');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header is required' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error) throw error;

        if (!user) {
            return res.status(401).json({ error: 'Invalid authentication token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = authMiddleware;