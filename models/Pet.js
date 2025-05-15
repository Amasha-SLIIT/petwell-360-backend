const mongoose = require("mongoose");

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  breed: {
    type: String,
  },
  age: {
    type: Number,
  },
  weight: {
    type: Number,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  medicalHistory: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Pet = mongoose.model("Pet", petSchema);

module.exports = Pet;
