
const AuditLog = require('../models/auditLogSchema');

const logActivity = async (userId, action, ipAddress, details, productId = null) => {
    try {
        const auditLog = new AuditLog({ userId, action, ipAddress, details, productId });
        await auditLog.save();
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};

// Controller method to log activities
const logUserAction = async (req, res, next) => {
    const userId = req.user.id; // Assuming user ID is available in req.user
    const action = `${req.method} ${req.originalUrl}`;
    const ipAddress = req.ip;
    const details = { body: req.body, query: req.query }; // Customize as needed
    const productId = req.body.productId; // Optional, for tracking product-related actions

    try {
        await logActivity(userId, action, ipAddress, details, productId);
        next();
    } catch (error) {
        next(error);
    }
};

// Method to get audit logs (optional)
const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find().populate('userId', 'fullName').populate('productId', 'title');
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    logUserAction,
    getAuditLogs
};
