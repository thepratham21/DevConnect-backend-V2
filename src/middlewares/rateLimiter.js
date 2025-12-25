
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, 
    message: {
        success: false,
        message: 'Too many uploads from this IP, please try again after an hour'
    }
});

module.exports = { uploadLimiter };