const bcrypt = require("bcryptjs");
const User = require("../models/petOwnerModel");

// Register User
exports.registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, address, phoneNumber, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        // Create new user
        const newUser = new User({
            firstName,
            lastName,
            email,
            password,
            address,
            phoneNumber,
            role
        });

        await newUser.save();
        
        return res.status(201).json({ 
            message: "User registered successfully",
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error("❌ Registration error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email" });
        }

        console.log("✅ User found in DB:", user);

        // Compare entered password with stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("⚖️ bcrypt.compare() result:", isMatch);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Return user data (without password)
        const userData = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            address: user.address,
            phoneNumber: user.phoneNumber
        };

        return res.json({ 
            message: "Login successful",
            user: userData
        });

    } catch (error) {
        console.error("❌ Login error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        return res.json(user);
    } catch (error) {
        console.error("❌ Get profile error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const { firstName, lastName, email, address, phoneNumber } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { firstName, lastName, email, address, phoneNumber },
            { new: true }
        ).select('-password');
        
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        
        return res.json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("❌ Update profile error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Delete user account
exports.deleteUserAccount = async (req, res) => {
    try {
        const userId = req.params.id;
        
        const deletedUser = await User.findByIdAndDelete(userId);
        
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        
        return res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("❌ Delete account error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};
