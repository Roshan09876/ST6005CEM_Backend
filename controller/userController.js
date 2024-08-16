const User = require("../models/userModel");
const cloudinary = require("cloudinary");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../middleware/sendMail");
const bcrypt = require("bcrypt");
const LoginActivity = require("../models/loginActivitySchema");


// Email validation function using regex
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to generate random password
const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8);
}

const validatePassword = (password) => {
    const minLength = 8;
    const maxLength = 12;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;

    if (password.length < minLength || password.length > maxLength) {
        return `Password should be between ${minLength} to ${maxLength} characters long.`;
    }

    if (!passwordRegex.test(password)) {
        return 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.';
    }

    return null;
};


const register = async (req, res) => {
    const { firstName, lastName, email, password, image } = req.body;

    if (!firstName || !lastName || !email) {
        return res.status(400).send('Please enter all required fields');
    }
    if (!validateEmail(email)) {
        return res.status(400).send('Please enter a valid email address');
    }
    const passwordError = validatePassword(password || generateRandomPassword());
    if (passwordError) {
        return res.status(400).send(passwordError);
    }

    try {
        let imageUrl = '';
        if (image) {
            const uploadedImage = await cloudinary.uploader.upload(image.path, {
                folder: "user",
                crop: "scale"
            });
            imageUrl = uploadedImage.secure_url;
        }

        const userExist = await User.findOne({ email: email });
        if (userExist) {
            return res.status(400).send("User Already Exists");
        }

        const randomPassword = password || generateRandomPassword();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        const userData = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            image: imageUrl
        });
        await userData.save();
        const token = jwt.sign({ email: userData.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send verification email with the random password
        const emailOptions = {
            to: userData.email,
            subject: 'Account Verification & Password',
            html: `
                <h2>Hello ${firstName},</h2>
                <p>Your account has been created successfully. Here is your temporary password: <strong>${randomPassword}</strong></p>
                <p>Please use this password to log in and update it after logging in.</p>
            `
        };
        await sendEmail(emailOptions);

        return res.status(200).json({
            success: true,
            message: "Registered Successfully. Please check your email for verification and password."
        });

    } catch (error) {
        console.error(`Error while Registering: ${error}`);
        res.status(500).send("Internal Server Error");
    }
};
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Please enter all fields"
        });
    }

    try {
        const userData = await User.findOne({ email: email });
        if (!userData) {
            await new LoginActivity({
                email,
                role: "user", 
                success: false,
                message: "User not found",
                endpoint: req.originalUrl,
                requestDetails: JSON.stringify(req.body)
            }).save();

            return res.status(400).json({ success: false, message: "User not found" });
        }

        // Check if the account is locked
        if (userData.isLocked()) {
            const lockTimeRemaining = (userData.lockUntil - Date.now()) / 1000; // in seconds

            await new LoginActivity({
                email: userData.email,
                role: userData.isAdmin ? "admin" : "user",
                success: false,
                message: "Account is locked due to too many failed login attempts. Please try again later.",
                endpoint: req.originalUrl,
                requestDetails: JSON.stringify(req.body)
            }).save();

            return res.status(403).json({
                success: false,
                message: `Account is locked due to too many failed login attempts. Please try again in ${Math.ceil(lockTimeRemaining)} seconds.`,
            });
        }

        const isMatched = await bcrypt.compare(password, userData.password);
        if (!isMatched) {
            userData.failedLoginAttempts += 1;

            if (userData.failedLoginAttempts >= 5) {
                userData.lockUntil = Date.now() + (1 * 60 * 1000);  // Lock the account for 1 minute
                userData.failedLoginAttempts = 0;
            }

            await userData.save();

            const remainingAttempts = 5 - userData.failedLoginAttempts;

            await new LoginActivity({
                email: userData.email,
                role: userData.isAdmin ? "admin" : "user",
                success: false,
                message: "Incorrect password.",
                endpoint: req.originalUrl,
                requestDetails: JSON.stringify(req.body)
            }).save();

            return res.status(400).json({
                success: false,
                message: `Incorrect password. ${remainingAttempts} attempts remaining. After ${remainingAttempts === 0 ? "this" : "the next"} attempt, your account will be locked.`,
            });
        }
        userData.failedLoginAttempts = 0;
        userData.lockUntil = null;
        await userData.save();

        const payload = {
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            image: userData.image,
            isAdmin: userData.isAdmin
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "6hr" });

        // Log the successful login activity
        await new LoginActivity({
            email: userData.email,
            role: userData.isAdmin ? "admin" : "user",
            success: true,
            message: "Login successful",
            endpoint: req.originalUrl,
            requestDetails: JSON.stringify(req.body)
        }).save();

        return res.status(200).json({
            success: true,
            token: token,
            userData,
            message: "Login successful"
        });

    } catch (error) {
        console.error(`Error while Login ${error}`);
        return res.status(500).send("Internal Server Error");
    }
};


const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(400).send("User Not Found")
        }
        return res.status(200).json({
            success: true,
            user,
            message: "Profile Fetched Successfully"
        })
    } catch (error) {
        console.log(`Error in Get Profile ${error}`)
        return res.status(500).send("Internal Server Error")
    }
}

const allUser = async (req, res) => {
    try {
        const users = await User.find()
        return res.status(200).json({
            success: true,
            users,
            message: "ALl User Fetched Successfully"
        })
    } catch (error) {
        console.log(`Error in all Users  ${error}`)
        return res.status(500).send("Internal Server Error")

    }
}


const getLoginActivities = async (req, res) => {
    try {
        const activities = await LoginActivity.find().sort({ timestamp: -1 });
        res.status(200).json({ success: true, activities });
    } catch (error) {
        console.error("Error fetching login activities:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const deleteLoginActivity = async (req, res) => {
    try {
        const { id } = req.params;

        const activity = await LoginActivity.findByIdAndDelete(id);

        if (!activity) {
            return res.status(404).json({ error: "Login activity not found." });
        }

        res.status(200).json({ success: true, message: "Login activity deleted successfully." });
    } catch (error) {
        console.error("Error deleting login activity:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const updateProfile = async (req, res) => {
    const userId = req.params.id;
    const { firstName, lastName, email, password } = req.body;
    const image = req.file; 

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }

        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) {
            if (!validateEmail(email)) {
                return res.status(400).send('Please enter a valid email address');
            }
            user.email = email;
        }

        if (password) {
            const passwordError = validatePassword(password);
            if (passwordError) {
                return res.status(400).send(passwordError);
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        if (image) {
            const uploadedImage = await cloudinary.uploader.upload(image.path, {
                folder: "user",
                crop: "scale"
            });
            user.image = uploadedImage.secure_url;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user
        });

    } catch (error) {
        console.error(`Error while updating profile: ${error}`);
        return res.status(500).send("Internal Server Error");
    }
};

const changePassword = async (req, res) => {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Please enter both current and new passwords."
        });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Check if current password matches
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        // Check if the new password matches any in the password history
        const isInHistory = await user.isPasswordInHistory(newPassword);
        if (isInHistory) {
            return res.status(400).json({
                success: false,
                message: "New password cannot be the same as any previously used password."
            });
        }

        // Validate new password
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password and password history
        user.passwordHistory.push(user.password);  // Add the current password to history
        if (user.passwordHistory.length > 5) {  // Limit password history to 5
            user.passwordHistory.shift();  // Remove the oldest password
        }
        user.password = hashedNewPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            user,
            message: "Password changed successfully."
        });
    } catch (error) {
        console.error(`Error while changing password: ${error}`);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


module.exports = {
    register,
    login,
    getProfile,
    allUser,
    getLoginActivities,
    deleteLoginActivity,
    updateProfile,
    changePassword
}