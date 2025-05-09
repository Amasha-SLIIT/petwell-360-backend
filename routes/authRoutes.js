const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

// Authentication routes
router.post("/login", authController.loginUser);
router.get("/user", verifyToken, authController.getUserInfo);
router.post("/register", authController.registerUser);

module.exports = router;