const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const PetOwner = require("./petOwnerModel"); //import the actual one later

// Review Schema
const reviewSchema = new Schema({
    ownerID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "PetOwner",
        required: true 
    },
    
    description: { 
        type: String, 
        required: true 
    },
    rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date 
    },
    reply: {
        type: String,
        default: null
      },
      
});


// Middleware to update `updatedAt` field on modification
reviewSchema.pre("findOneAndUpdate", function (next) {
    this.set({ updatedAt: new Date() });
    next();
});


const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
