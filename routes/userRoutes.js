const express = require("express");
const { getUsers, getUserById, getPetsByUserId, getAppointmentsByUserId } = require("../controllers/UserController");

const router = express.Router();

router.get("/", getUsers);
router.get("/:id/pets", getPetsByUserId);
router.get("/:id/appointments", getAppointmentsByUserId);
router.get("/:id", getUserById);

module.exports = router;
