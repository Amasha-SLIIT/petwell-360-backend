const Pet = require("../models/Pet");

// Create a new pet
const createPet = async (req, res) => {
  try {
    const { petName, species, age, medicalHistory } = req.body;

    // Get userId from the authenticated user (from token)
    const userId = req.user.id;

    const pet = new Pet({ petName, species, age, medicalHistory, userId });
    await pet.save();
    res.status(201).json(pet);
  } catch (error) {
    console.error("Error creating pet:", error);
    res.status(500).json({
      message: "Error creating pet",
      error: error.message,
    });
  }
};

// Get pets for the logged-in user
const getPets = async (req, res) => {
  try {
    const pets = await Pet.find({ userId: req.user.id });
    res.status(200).json(pets);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching pets",
      error: error.message,
    });
  }
};

// Get a single pet (ensure it belongs to user)
const getPet = async (req, res) => {
  try {
    const pet = await Pet.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!pet) {
      return res.status(404).json({
        message: "Pet not found or not owned by user",
      });
    }

    res.status(200).json(pet);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching pet",
      error: error.message,
    });
  }
};

// Update a pet (ensure it belongs to user)
const updatePet = async (req, res) => {
  try {
    const { petName, species, age, medicalHistory } = req.body;

    const pet = await Pet.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
      },
      { petName, species, age, medicalHistory },
      { new: true }
    );

    if (!pet) {
      return res.status(404).json({
        message: "Pet not found or not owned by user",
      });
    }

    res.status(200).json(pet);
  } catch (error) {
    res.status(500).json({
      message: "Error updating pet",
      error: error.message,
    });
  }
};

// Delete a pet (ensure it belongs to user)
const deletePet = async (req, res) => {
  try {
    const pet = await Pet.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!pet) {
      return res.status(404).json({
        message: "Pet not found or not owned by user",
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      message: "Error deleting pet",
      error: error.message,
    });
  }
};

module.exports = {
  getPets,
  getPet,
  createPet,
  updatePet,
  deletePet,
};