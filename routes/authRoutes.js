const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware"); 
const petController = require('../controllers/petController');

//lenoras routes
router.post("/login", authController.loginUser);
router.get("/user", verifyToken, authController.getUserInfo);
router.post("/register", authController.registerUser);


// najiths routes 
router.get('/pets', verifyToken, petController.getPets);
router.get('/pets/:id', verifyToken, petController.getPet);
router.post('/pets', verifyToken, petController.createPet);
router.put('/pets/:id', verifyToken, petController.updatePet);
router.delete('/pets/:id', verifyToken, petController.deletePet);

module.exports = router;
