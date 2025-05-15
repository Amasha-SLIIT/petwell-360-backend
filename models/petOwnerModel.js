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
    address: String,
    email: { 
        type: String, 
        unique: true, 
        required: true 
    },
    phoneNumber: String,
    password: { 
        type: String, 
        required: true
    },
    role: {
        type: String,
        enum: ['petowner', 'doctor'],
        default: 'petowner'
    }
});

userSchema.pre("save", async function (next) {
    console.log("🚨 Running pre-save middleware for:", this.email);
    
    if (!this.isModified("password")) {
        console.log("✅ Password NOT modified, skipping hashing.");
        return next();
    }
    
    console.log("🔑 Password before hashing:", this.password);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("🛠️ Hashed password before saving:", this.password);

    next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
