const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.get("/profile/:id", authController.getUserProfile);
router.put("/profile/:id", authController.updateUserProfile);
router.delete("/profile/:id", authController.deleteUserAccount);

module.exports = router;
