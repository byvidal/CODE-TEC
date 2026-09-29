const AppError = require('../utils/errors');
const requestCounts = {};
setInterval(() => { for(let k in requestCounts) delete requestCounts[k]; }, 60000);

exports.telemetryRateLimit = (req, res, next) => {
    const limit = parseInt(process.env.TELEMETRY_RATE_LIMIT_PER_MINUTE) || 120;
    const ip = req.ip;
    requestCounts[ip] = (requestCounts[ip] || 0) + 1;
    if (requestCounts[ip] > limit) {
        return next(new AppError("Too many requests", "RATE_LIMIT_EXCEEDED", 429));
    }
    next();
};
