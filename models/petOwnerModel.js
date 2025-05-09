const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//insert the actual model later
const petOwnerSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    address:String,
    email: { 
        type: String, 
        unique: true, 
        required: true 
    },
    phoneNumber: String,
    password: { 
        type: String, 
        required: true,
        match: [/^\d{10}$/, "📞 Please enter a valid 10-digit phone number"],
    }, 
});

petOwnerSchema.pre("save", async function (next) {
    // Log before hashing
    console.log("🚨 Running pre-save middleware for:", this.email);
    
    if (!this.isModified("password")) {
        console.log("✅ Password NOT modified, skipping hashing.");
        return next();
    }
    
    console.log("🔑 Password before hashing:", this.password);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("🛠 Hashed password before saving:", this.password);

    next();
});


const PetOwner = mongoose.model("PetOwner", petOwnerSchema);
module.exports = PetOwner;
