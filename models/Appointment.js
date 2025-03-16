const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  pets: [
    {
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["Dog", "Cat"],
        required: true,
      },
      services: {
        type: [String],
        enum: ["OPD", "Surgery", "Vaccination", "Grooming"],
        required: true,
      },
    },
  ],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  appointmentFrom: {
    type: Date,
    required: true,
  },
  appointmentTo: {
    type: Date,
    required: true,
  },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
