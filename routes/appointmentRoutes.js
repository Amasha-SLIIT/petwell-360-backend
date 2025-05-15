const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");

// Appointment routes - removed auth middleware
router.post("/", appointmentController.createAppointment);
router.get("/available-slots", appointmentController.getAvailableTimeSlots);
router.get("/user", appointmentController.getUserAppointments);
router.get("/doctor", appointmentController.getDoctorAppointments);
router.get("/:id", appointmentController.getAppointmentDetails);
router.put("/:id/status", appointmentController.updateAppointmentStatus);
router.put("/:id/cancel", appointmentController.cancelAppointment);
router.put("/:id", appointmentController.editAppointment); 

// Treatment history routes - removed auth middleware
router.post("/:appointmentId/treatment", appointmentController.addTreatmentHistory);
router.get("/:appointmentId/treatment", appointmentController.getTreatmentHistory);

// Pet routes - removed auth middleware
router.get("/pets/user", appointmentController.getUserPets);
router.post("/pets", appointmentController.createPet);

module.exports = router;
