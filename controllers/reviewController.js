
const Review = require("../models/reviewModel");
const PetOwner = require("../models/petOwnerModel");   //import the actual one after github pull


// Get all reviews with owner details
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find().populate("ownerID", "firstName lastName");

        if (!reviews.length) {
            return res.status(404).json({ message: "No reviews found" });
        }

        // Modify response to handle anonymous cases
        const formattedReviews = reviews.map((r) => ({
            _id: r._id,
            description: r.description,
            rating: r.rating,
            createdAt: r.createdAt,
            ownerName: r.ownerID ? `${r.ownerID.firstName} ${r.ownerID.lastName}` : "Anonymous",
        }));

        res.status(200).json(formattedReviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



const addReview = async (req, res) => {
    const { ownerID, description, rating } = req.body;

    // Validate required fields
    if (!ownerID || !description || rating === undefined) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        const owner = await PetOwner.findById(ownerID);
        if (!owner) return res.status(404).json({ message: "Owner not found" });
        
        const newReview = new Review({   //check required fields from schema here
            ownerID,
            description,
            rating
        });
        await newReview.save();
        res.status(201).json({...newReview.toObject(), ownerName : `${owner.firstName} ${owner.lastName}`});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/*
// temporary add a new review function ---- delete this affter getting the above done
const addReview = async (req, res) => {
    const { ownerID, title, description, rating } = req.body;

    // Check if all required fields are provided
    if (!ownerID || !title || !description || rating === undefined) {
        return res.status(400).json({ message: "All fields (ownerID, title, description, rating) are required." });
    }

    try {
        const newReview = new Review({
            ownerID,
            title,
            description,
            rating
        });

        await newReview.save();
        res.status(201).json(newReview);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};*/

//----------------------


// Update a review
const updateReview = async (req, res) => {
    const { id } = req.params;
    const { description, rating } = req.body;
    try {
        const updatedReview = await Review.findByIdAndUpdate(id, { description, rating }, { new: true });
        if (!updatedReview) return res.status(404).json({ message: "Review not found" });
        res.status(200).json(updatedReview);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a review
const deleteReview = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedReview = await Review.findByIdAndDelete(id);
        if (!deletedReview) return res.status(404).json({ message: "Review not found" });
        res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllReviews, addReview, updateReview, deleteReview };
