const mongoose = require("mongoose");

const auditLogSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String },
    details: { type: Object, required: false },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: false } // Optional, for tracking product-related actions
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
module.exports = AuditLog;
