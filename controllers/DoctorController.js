const Doctor = require("../models/Doctor");

const getDoctorById = async (req, res) => {
    try {
        const user = await Doctor.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Doctor not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {getDoctorById};