const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET not set in environment!");
        return "invalid_token"; // prevent full crash
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

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
            role: role || 'petowner'
        });

        await newUser.save();

        const token = generateToken(newUser._id);

        return res.status(201).json({
            token,
            message: "User registered successfully",
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                address: newUser.address,
                phoneNumber: newUser.phoneNumber,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error(" Registration error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

        return res.json({ token, user: { id: user._id, email: user.email, role: user.role } });

    } catch (error) {
        console.error(" Login error:", error);
        return res.status(500).json({ message: "Server Error", error });
    }
};

// Get User Info
exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phoneNumber: user.phoneNumber,
            address: user.address,
        });

    } catch (error) {
        console.error(" Error fetching user info:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
