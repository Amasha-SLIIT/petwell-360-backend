const express = require("express");
const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  deleteAppointment,
  getAvailableSlots,
} = require("../controllers/AppointmentController");

const router = express.Router();

router.get("/", getAppointments);
router.get("/available-slots", getAvailableSlots);
router.get("/:id", getAppointmentById);
router.post("/", createAppointment);
router.delete("/:id", deleteAppointment);

module.exports = router;
