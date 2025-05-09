const express = require("express");
const {
    createPet,
    getPetById,
    deletePetById,
    updatePet
} = require("../controllers/PetController");

const router = express.Router();

router.post("/", createPet);
router.put("/:id", updatePet);
router.get("/:id", getPetById);
router.delete("/:id", deletePetById);

module.exports = router;
