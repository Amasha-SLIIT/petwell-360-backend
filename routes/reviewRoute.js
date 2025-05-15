const express = require("express");
const router = express.Router();
//const review = require("../models/reviewModel");
const reviewController = require("../controllers/reviewController");  
const authMiddleware = require("../middleware/authMiddleware");
  

router.post("/", authMiddleware, reviewController.addReview);  // Protected Route
router.get("/", reviewController.getAllReviews);
router.put("/:id", authMiddleware, reviewController.updateReview);
router.delete("/:id", authMiddleware, reviewController.deleteReview);

module.exports = router;

