const Appointment = require("../models/Appointment");
const Pet = require("../models/Pet");
const User = require("../models/User");

const moment = require("moment");
require("moment-timezone");

const timezone = "Asia/Colombo";

const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPetsByUserId = async (req, res) => {
    try {
        const pets = await Pet.find({ userId: req.params.id });

        res.status(200).json(pets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAppointmentsByUserId = async (req, res) => {
    try {
        const appointment = await Appointment.find({ userId: req.params.id }).populate(
            "petId"
        );
        if (!appointment)
            return res.status(404).json({ message: "Appointment not found" });

        const result = appointment.map((a) => ({
            ...a._doc,
            appointmentFrom: moment(a.appointmentFrom)
                .tz(timezone)
                .format(),
            appointmentTo: moment(a.appointmentTo).tz(timezone).format(),
        }))
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUsers,
    getUserById,
    getPetsByUserId,
    getAppointmentsByUserId
};