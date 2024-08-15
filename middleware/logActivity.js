const Activity = require('../models/loginActivitySchema');

const logActivity = (success, message) => {
    return async (req, res, next) => {
        try {
            const activity = new Activity({
                email: req.body.email || req.user?.email,
                role: req.user?.isAdmin,
                success,
                message: message || `${req.method} request to ${req.originalUrl}`,
                endpoint: req.originalUrl,
                requestDetails: JSON.stringify(req.body),
                timestamp: new Date()
            });

            await activity.save();
        } catch (err) {
            console.error("Error logging activity: ", err);
        } finally {
            next();
        }
    }
};

module.exports = logActivity;
