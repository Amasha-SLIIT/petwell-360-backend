const mongoose = require("mongoose");

const petSchema = new mongoose.Schema({
  petName: {
    type: String,
    required: true,
  },
  species: {
    type: String,
    enum: ["Dog", "Cat", "Other"],
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  medicalHistory: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PetOwner", 
    required: true,
  },
});

const Pet = mongoose.model("Pet", petSchema);

module.exports = Pet;