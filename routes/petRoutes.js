const express = require("express");
const router = express.Router();
const petController = require("../controllers/petController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get('/', verifyToken, petController.getPets);
router.get('/:id', verifyToken, petController.getPet);
router.post('/', verifyToken, petController.createPet);
router.put('/:id', verifyToken, petController.updatePet);
router.delete('/:id', verifyToken, petController.deletePet);

module.exports = router;