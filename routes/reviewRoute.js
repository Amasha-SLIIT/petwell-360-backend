const express = require("express");
const router = express.Router();
const review = require("../models/reviewModel");
const reviewController = require("../controllers/reviewController");  
const { verifyToken } = require("../middleware/authMiddleware");


  
router.post("/", verifyToken, reviewController.addReview);
router.get("/", reviewController.getAllReviews);
router.put("/:id", verifyToken, reviewController.updateReview);
router.delete("/:id", verifyToken, reviewController.deleteReview);
router.post("/:id/reply", verifyToken, reviewController.replyToReview);



module.exports = router;

