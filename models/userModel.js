const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    passwordHistory: [{
        type: String,
        required: true
    }],
    image: {
        type: String,
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    }
}, { timestamps: true });

userSchema.methods.isLocked = function () {
    return this.lockUntil && this.lockUntil > Date.now();
};

// Method to compare passwords in the password history
userSchema.methods.isPasswordInHistory = async function (newPassword) {
    for (let oldPassword of this.passwordHistory) {
        const isMatched = await bcrypt.compare(newPassword, oldPassword);
        if (isMatched) return true;
    }
    return false;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
