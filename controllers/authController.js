const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const PetOwner = require("../models/petOwnerModel");

//register user 
exports.registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, address, phoneNumber } = req.body;

        // Check if user already exists
        const existingUser = await PetOwner.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        // Create new user
        const newPetowner = new PetOwner({
            firstName,
            lastName,
            email,
            password,
            address,
            phoneNumber,
           
        });

        await newPetowner.save();
        
        return res.status(201).json({ 
            message: "User registered successfully",
            user: {
                id: newPetowner._id,
                firstName: newPetowner.firstName,
                lastName: newPetowner.lastName,
                email: newPetowner.email,
                password:newPetowner.password,
                address:newPetowner.address,
                phoneNumber:newPetowner.phoneNumber
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

        // Find user by email
        const user = await PetOwner.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email" });
        }

        console.log(" User found in DB:", user);
        console.log("Entered password:", password);
        console.log(" Stored hashed password from DB:", user.password);

        // Compare entered password with stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(" bcrypt.compare() result:", isMatch);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        return res.json({ token, user: { id: user._id, email: user.email } });

    } catch (error) {
        console.error(" Login error:", error);
        return res.status(500).json({ message: "Server Error", error });
    }
};



exports.getUserInfo = async (req, res) => {
    try {
        // Fetch the user from the database using the user ID from the decoded token
        
        
        const user = await PetOwner.findById(req.user.id);  // req.user.id contains the user ID from the JWT
        console.log("req.user.id : ", req.user.id);
        console.log("Fetched User:", user);

        console.log("User ID Type:", typeof req.user.id);



        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return the user's information (excluding sensitive data)
        return res.json({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            // You can add any other fields you want to include
        });

    } catch (error) {
        console.error(" Error fetching user info:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};
