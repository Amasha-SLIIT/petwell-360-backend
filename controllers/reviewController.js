
const Review = require("../models/reviewModel");
const PetOwner = require("../models/petOwnerModel");   //import the actual one after github pull



const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find().populate("ownerID", "firstName lastName");


        if (!reviews.length) {
            return res.status(404).json({ message: "No reviews found" });
        }

        const formattedReviews = reviews.map((r) => ({
            _id: r._id,
            description: r.description,
            rating: r.rating,
            createdAt: r.createdAt,
            ownerName: r.ownerID ? `${r.ownerID.firstName} ${r.ownerID.lastName}` : "Anonymous",
            ownerID: r.ownerID?._id || null, // Include owner ID for permission checks
            reply: r.reply || null
        }));
        

        res.status(200).json(formattedReviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



const addReview = async (req, res) => {

    const { ownerID, description, rating } = req.body;
    

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

        Review.find().populate("ownerID", "firstName lastName");

        await newReview.save();
        res.status(201).json({...newReview.toObject(), ownerName : `${owner.firstName} ${owner.lastName}`});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



const updateReview = async (req, res) => {
    const { id } = req.params; // Move this FIRST
    const { description, rating } = req.body;

    try {
        const review = await Review.findById(id);
        if (!review) return res.status(404).json({ message: "Review not found" });
        
        // Check ownership
        if (String(review.ownerID) !== String(req.user.id)) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const updatedReview = await Review.findByIdAndUpdate(
            id, 
            { description, rating, updatedAt: new Date() }, 
            { new: true }
        );
        res.status(200).json(updatedReview);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteReview = async (req, res) => {
    const { id } = req.params; // Move this FIRST
    
    try {
        const review = await Review.findById(id);
        if (!review) return res.status(404).json({ message: "Review not found" });

        // Check ownership
        if (String(review.ownerID) !== String(req.user.id)) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await Review.findByIdAndDelete(id);
        res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const replyToReview = async (req, res) => {

    const { id } = req.params;
    const { reply } = req.body;
  
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Only admins can reply to reviews." });
      }
  
      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
  
      review.reply = reply;
      //review.updatedAt = new Date();
      await review.save();
  
      res.status(200).json({ message: "Reply added successfully", review });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  

module.exports = { getAllReviews, addReview, updateReview, deleteReview, replyToReview };
