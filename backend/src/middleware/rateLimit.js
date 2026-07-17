function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 100, message = 'Demasiadas solicitudes' } = {}) {
    const hits = new Map();

    return (req, res, next) => {
        const key = req.ip || req.connection?.remoteAddress || 'unknown';
        const now = Date.now();
        const entry = hits.get(key);

        if (!entry || now > entry.resetAt) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        entry.count += 1;
        if (entry.count > max) {
            return res.status(429).json({ success: false, message });
        }

        return next();
    };
}

module.exports = { createRateLimiter };
