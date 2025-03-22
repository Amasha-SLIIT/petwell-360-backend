const moment = require("moment");
require("moment-timezone");

const Appointment = require("../models/Appointment");

const timezone = "Asia/Colombo";

const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find();
    const result = appointments.map((appointment) => ({
      ...appointment._doc,
      appointmentFrom: moment(appointment.appointmentFrom)
        .tz(timezone)
        .format(),
      appointmentTo: moment(appointment.appointmentTo).tz(timezone).format(),
    }));
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(
      "userId",
      "petId"
    );
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    const result = {
      ...appointment._doc,
      appointmentFrom: moment(appointment.appointmentFrom)
        .tz(timezone)
        .format(),
      appointmentTo: moment(appointment.appointmentTo).tz(timezone).format(),
    };
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createAppointment = async (req, res) => {
  try {
    const { petId, services, userId, appointmentFrom, appointmentTo } = req.body;
    const newAppointment = new Appointment({
      petId,
      services,
      userId,
      appointmentFrom: moment
        .tz(appointmentFrom, timezone)
        .utc()
        .seconds(0)
        .format(),
      appointmentTo: moment
        .tz(appointmentTo, timezone)
        .utc()
        .seconds(0)
        .format(),
    });
    await newAppointment.save();
    const result = {
      ...newAppointment._doc,
      appointmentFrom: moment(newAppointment.appointmentFrom)
        .tz(timezone)
        .format(),
      appointmentTo: moment(newAppointment.appointmentTo).tz(timezone).format(),
    };
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });
    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAvailableSlots = async (req, res) => {
  try {
    const todayStart = moment.utc().startOf("day");
    const xDaysFromToday = moment.utc().add(14, "days").endOf("day");

    const intervalMinutes = 15; // 15 mins
    const intervals = [];
    let currentTime = todayStart.clone();

    let pairCount = 0;
    while (
      currentTime.isBefore(xDaysFromToday) ||
      currentTime.isSame(xDaysFromToday)
    ) {
      const hour = currentTime.hour();
      // Check if the current time is within working hours (8 AM - 5 PM)
      if (hour >= 8 && hour < 23) {
        //  8 - 17
        const from = currentTime.format();

        if (pairCount > 0) {
          intervals[pairCount - 1].to = from;
        }

        intervals.push({ from: from, to: null, availability: true });

        currentTime.add(intervalMinutes, "minutes");
        pairCount += 1;
      } else {
        currentTime.add(intervalMinutes, "minutes");
      }
    }

    const fetchedAppointmentTimes = await Appointment.find({
      appointmentFrom: { $gte: moment.utc().format() },
    }).select("appointmentFrom appointmentTo");

    const appointmentTimes = [];
    fetchedAppointmentTimes.forEach((item) => {
      appointmentTimes.push({
        appointmentFrom: item.appointmentFrom,
        appointmentTo: item.appointmentTo,
      });
    });

    appointmentTimes.forEach((a) => {
      const totalMins = moment(a.appointmentTo).diff(
        moment(a.appointmentFrom),
        "minutes"
      );

      const slotsTaken = totalMins / intervalMinutes;

      const index = intervals.findIndex((b) => {
        return moment.utc(b.from).isSame(moment.utc(a.appointmentFrom));
      });

      if (index > -1) {
        for (i = index; i < index + slotsTaken; i++) {
          intervals[i].availability = false;
        }
      }
    });

    const result = intervals
      .map((item) => ({
        from: moment(item.from).tz(timezone).format(),
        to: moment(item.to).tz(timezone).format(),
        isAvailable: item.availability,
      }))
      .filter((item) =>
        moment.tz(item.from, "UTC").isSameOrAfter(moment.utc())
      );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  deleteAppointment,
  getAvailableSlots,
};
