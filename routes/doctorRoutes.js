const express = require("express");
const { getDoctorById } = require("../controllers/DoctorController");
const { getAppointmentsByDoctor } = require("../controllers/DoctorController");

const router = express.Router();

router.get("doctors/:id/appointments", getAppointmentsByDoctor);
router.get("doctors/:id", getDoctorById);

module.exports = router;