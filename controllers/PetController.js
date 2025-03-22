const Pet = require("../models/Pet");

const getPetById = async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet)
            return res.status(404).json({ message: "Pet not found" });

        res.status(200).json(pet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deletePetById = async (req, res) => {
    try {
        const pet = await Pet.findOneAndDelete(req.params.id);
        if (!pet)
            return res.status(404).json({ message: "Pet not found" });

        res.status(200).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updatePet = async (req, res) => {
    try {
        const { name } = req.body;
        const pet = await Pet.findOneAndUpdate({ _id: req.params.id }, { name }, { new: true });
        res.status(200).json(pet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createPet = async (req, res) => {
    try {
        const { name, type, userId } = req.body;
        const pet = new Pet({
            name,
            type,
            userId
        });
        await pet.save();
        res.status(201).json(pet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPetById,
    deletePetById,
    createPet,
    updatePet
};