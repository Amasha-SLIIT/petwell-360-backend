const Pet = require('../models/petModel');

exports.getPets = async (req, res) => {
    try {
        const pets = await Pet.find({ owner: req.user.id });
        res.json(pets);
    } catch (err) {
        res.status(500).json({ message: "Error fetching pets", error: err });
    }
};

exports.getPet = async (req, res) => {
    try {
        const pet = await Pet.findOne({ 
            _id: req.params.id, 
            owner: req.user.id 
        });
        if (!pet) return res.status(404).json({ message: "Pet not found" });
        res.json(pet);
    } catch (err) {
        res.status(500).json({ message: "Error fetching pet", error: err });
    }
};

exports.createPet = async (req, res) => {
    try {
        const pet = await Pet.create({ 
            ...req.body,
            owner: req.user.id 
        });
        res.status(201).json(pet);
    } catch (err) {
        res.status(400).json({ message: "Error creating pet", error: err });
    }
};

exports.updatePet = async (req, res) => {
    try {
        const pet = await Pet.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            req.body,
            { new: true }
        );
        if (!pet) return res.status(404).json({ message: "Pet not found" });
        res.json(pet);
    } catch (err) {
        res.status(400).json({ message: "Error updating pet", error: err });
    }
};

exports.deletePet = async (req, res) => {
    try {
        const pet = await Pet.findOneAndDelete({ 
            _id: req.params.id, 
            owner: req.user.id 
        });
        if (!pet) return res.status(404).json({ message: "Pet not found" });
        res.json({ message: "Pet deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting pet", error: err });
    }
};