const express = require("express");
const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  deleteAppointment,
  getAvailableSlots,
  updateAppointment,
  generateReport,
  initiatePayment,
  verifyPayment,
} = require("../controllers/AppointmentController");

const router = express.Router();

// Appointment routes
router.get("/", getAppointments);
router.get("/generate-report", generateReport);
router.get("/available-slots", getAvailableSlots);
router.get("/:id", getAppointmentById);
router.post("/", createAppointment);
router.delete("/:id", deleteAppointment);
router.put("/:id", updateAppointment);

// Payment routes
router.post("/:id/payment/initiate", initiatePayment);
router.post("/:id/payment/verify", verifyPayment);

module.exports = router;
