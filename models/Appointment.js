const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pet",
    required: true,
  },
  petName: {
    type: String,
    required: true,
  },
  petType: {
    type: String,
    required: true,
  },
  services: {
    type: [String],
    enum: ["OPD", "Surgery", "Vaccination", "Grooming"],
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  appointmentFrom: {
    type: Date,
    required: true,
  },
  appointmentTo: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending",
  },
  payment: {
    amount: {
      type: Number,
      default: 500,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paymentId: {
      type: String,
    },
    paymentDate: {
      type: Date,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
