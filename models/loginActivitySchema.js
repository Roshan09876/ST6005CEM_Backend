const mongoose = require("mongoose");

const loginActivitySchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        required: true,
    },
    success: {
        type: Boolean,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    endpoint: {
        type: String,
        required: true,
    },
    requestDetails: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
    },
    
}, { timestamps: true });

const LoginActivity = mongoose.model("LoginActivity", loginActivitySchema);

module.exports = LoginActivity;
