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
    }
});
/*
// Auto-populate ownerName before saving
reviewSchema.pre("save", async function (next) {
    if (this.isNew) {
        const owner = await PetOwner.findById(this.ownerID); //update after adding the petOwner model accordingly
        if (owner) {
            this.ownerName = `${owner.firstName} ${owner.lastName}`;
        } else {
            this.ownerName = "Unknown Owner";
        }
    next();
    }
});
*/

// Middleware to update `updatedAt` field on modification
reviewSchema.pre("findOneAndUpdate", function (next) {
    this.set({ updatedAt: new Date() });
    next();
});


const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
