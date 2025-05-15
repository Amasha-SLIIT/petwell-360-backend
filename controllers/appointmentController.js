const Appointment = require("../models/Appointment");
const TreatmentHistory = require("../models/TreatmentHistory");
const User = require("../models/petOwnerModel");
const Pet = require("../models/Pet");

// Create a new appointment
exports.createAppointment = async (req, res) => {
  try {
    const { petId, petName, petType, services, appointmentFrom, appointmentTo, userId } = req.body;
    
    // Check if userId was provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if pet exists
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ message: "Pet not found" });
    }

    // Check for overlapping appointments
    const overlappingAppointments = await Appointment.find({
      appointmentFrom: { $lt: new Date(appointmentTo) },
      appointmentTo: { $gt: new Date(appointmentFrom) },
      status: { $nin: ["cancelled"] }
    });

    if (overlappingAppointments.length > 0) {
      return res.status(400).json({ 
        message: "This time slot is already booked",
        availableSlots: await generateAvailableTimeSlots(new Date(appointmentFrom))
      });
    }

    // Create new appointment
    const newAppointment = new Appointment({
      petId,
      petName,
      petType,
      services,
      userId,
      appointmentFrom: new Date(appointmentFrom),
      appointmentTo: new Date(appointmentTo),
    });

    await newAppointment.save();

    res.status(201).json({
      success: true,
      appointment: newAppointment
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get available time slots
exports.getAvailableTimeSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Date parameter is required" });
    }

    const slots = await generateAvailableTimeSlots(new Date(date));
    res.status(200).json(slots);
  } catch (error) {
    console.error("Error fetching time slots:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to get available time slots
async function generateAvailableTimeSlots(date) {
  // Create time slots (30-minute intervals from 8AM to 6PM)
  const startTime = new Date(date);
  startTime.setHours(8, 0, 0, 0); // 8:00 AM

  const endTime = new Date(date);
  endTime.setHours(18, 0, 0, 0); // 6:00 PM

  const allSlots = [];
  const slotDuration = 30; // minutes
  
  // Generate all possible slots
  for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + slotDuration)) {
    const slotEnd = new Date(time);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
    
    allSlots.push({
      from: new Date(time),
      to: new Date(slotEnd),
      available: true
    });
  }
  
  // Get booked appointments for the date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const bookedAppointments = await Appointment.find({
    appointmentFrom: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ["cancelled"] }
  });
  
  // Mark booked slots as unavailable
  bookedAppointments.forEach(booking => {
    const bookingStart = new Date(booking.appointmentFrom);
    const bookingEnd = new Date(booking.appointmentTo);
    
    allSlots.forEach(slot => {
      if (
        (bookingStart <= slot.from && bookingEnd > slot.from) ||
        (bookingStart < slot.to && bookingEnd >= slot.to) ||
        (bookingStart >= slot.from && bookingEnd <= slot.to)
      ) {
        slot.available = false;
      }
    });
  });
  
  return allSlots;
}

// Get user's appointments
exports.getUserAppointments = async (req, res) => {
  try {
    // Get userId from query params instead of auth middleware
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const appointments = await Appointment.find({ userId })
      .sort({ appointmentFrom: -1 })
      .populate("petId", "name type")
      .populate("doctorId", "firstName lastName");
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get doctor's appointments
exports.getDoctorAppointments = async (req, res) => {
  try {
    // Get doctorId from query params instead of auth middleware
    const { doctorId } = req.query;
    
    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required" });
    }
    
    const appointments = await Appointment.find({ 
      $or: [
        { doctorId },
        { doctorId: { $exists: false } } // Also include unassigned appointments
      ],
      status: { $nin: ["cancelled"] }
    })
    .sort({ appointmentFrom: 1 })
    .populate("userId", "firstName lastName email phoneNumber")
    .populate("petId", "name type breed age");
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Edit an existing appointment
exports.editAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { petId, petName, petType, services, appointmentFrom, appointmentTo, userId } = req.body;
    
    // Check if appointment exists
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    // Check if user owns this appointment
    if (appointment.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to edit this appointment" });
    }
    
    // Only allow editing if appointment is still pending
    if (appointment.status !== "pending") {
      return res.status(400).json({ message: "Cannot edit an appointment that is not pending" });
    }
    
    // Check for overlapping appointments (excluding the current one being edited)
    const overlappingAppointments = await Appointment.find({
      _id: { $ne: id }, // Exclude the current appointment
      appointmentFrom: { $lt: new Date(appointmentTo) },
      appointmentTo: { $gt: new Date(appointmentFrom) },
      status: { $nin: ["cancelled"] }
    });

    if (overlappingAppointments.length > 0) {
      return res.status(400).json({ 
        message: "This time slot is already booked",
        availableSlots: await generateAvailableTimeSlots(new Date(appointmentFrom))
      });
    }
    
    // Update appointment fields
    appointment.petId = petId || appointment.petId;
    appointment.petName = petName || appointment.petName;
    appointment.petType = petType || appointment.petType;
    appointment.services = services || appointment.services;
    appointment.appointmentFrom = appointmentFrom ? new Date(appointmentFrom) : appointment.appointmentFrom;
    appointment.appointmentTo = appointmentTo ? new Date(appointmentTo) : appointment.appointmentTo;
    
    await appointment.save();
    
    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error("Error editing appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, doctorId } = req.body;
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    // Only allow updates if appointment is not cancelled
    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "Cannot update a cancelled appointment" });
    }
    
    // Update fields
    appointment.status = status || appointment.status;
    if (doctorId) {
      appointment.doctorId = doctorId;
    }
    
    await appointment.save();
    
    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    // Only the owner can cancel their appointment
    if (appointment.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to cancel this appointment" });
    }
    
    // Only allow cancellation if not already cancelled or completed
    if (["cancelled", "completed"].includes(appointment.status)) {
      return res.status(400).json({ message: `Cannot cancel an appointment that is ${appointment.status}` });
    }
    
    appointment.status = "cancelled";
    await appointment.save();
    
    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get appointment details
exports.getAppointmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findById(id)
      .populate("userId", "firstName lastName email phoneNumber")
      .populate("petId", "name type breed age")
      .populate("doctorId", "firstName lastName");
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    res.status(200).json(appointment);
  } catch (error) {
    console.error("Error fetching appointment details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add treatment history
exports.addTreatmentHistory = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { diagnosis, treatment, medications, notes, createdBy } = req.body;
    
    if (!createdBy) {
      return res.status(400).json({ message: "Doctor ID is required" });
    }
    
    // Check if appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    // Check if doctor is assigned to this appointment
    if (appointment.doctorId && appointment.doctorId.toString() !== createdBy) {
      return res.status(403).json({ message: "Not authorized to add treatment history to this appointment" });
    }
    
    const newTreatmentHistory = new TreatmentHistory({
      appointmentId,
      diagnosis,
      treatment,
      medications: medications || [],
      notes,
      createdBy
    });
    
    await newTreatmentHistory.save();
    
    // Update appointment status to completed
    appointment.status = "completed";
    await appointment.save();
    
    res.status(201).json({
      success: true,
      treatmentHistory: newTreatmentHistory
    });
  } catch (error) {
    console.error("Error adding treatment history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get treatment history for an appointment
exports.getTreatmentHistory = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const treatmentHistory = await TreatmentHistory.find({ appointmentId })
      .sort({ createdAt: -1 })
      .populate("createdBy", "firstName lastName");
    
    res.status(200).json(treatmentHistory);
  } catch (error) {
    console.error("Error fetching treatment history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all pets for a user
exports.getUserPets = async (req, res) => {
  try {
    // Get userId from query params instead of auth middleware
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const pets = await Pet.find({ ownerId: userId });
    
    res.status(200).json(pets);
  } catch (error) {
    console.error("Error fetching user pets:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new pet
exports.createPet = async (req, res) => {
  try {
    const { name, type, breed, age, weight, medicalHistory, ownerId } = req.body;
    
    if (!ownerId) {
      return res.status(400).json({ message: "Owner ID is required" });
    }
    
    const newPet = new Pet({
      name,
      type,
      breed,
      age,
      weight,
      ownerId,
      medicalHistory
    });
    
    await newPet.save();
    
    res.status(201).json({
      success: true,
      pet: newPet
    });
  } catch (error) {
    console.error("Error creating pet:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
