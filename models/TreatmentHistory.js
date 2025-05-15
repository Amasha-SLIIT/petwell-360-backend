const mongoose = require("mongoose");

const treatmentHistorySchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true
  },
  diagnosis: {
    type: String,
    required: true
  },
  treatment: {
    type: String,
    required: true
  },
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TreatmentHistory = mongoose.model("TreatmentHistory", treatmentHistorySchema);

module.exports = TreatmentHistory;
