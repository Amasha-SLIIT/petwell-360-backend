const mongoose = require('mongoose');

const PetSchema = new mongoose.Schema({
    petName: { type: String, required: true },
    species: { type: String, required: true },
    age: { type: Number, required: true },
    medicalHistory: String,
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'PetOwner',
        required: true 
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Pet", PetSchema);