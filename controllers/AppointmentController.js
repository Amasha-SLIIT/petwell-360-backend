const moment = require("moment");
require("moment-timezone");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

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
    const { petId, services, userId, appointmentFrom, appointmentTo, paymentStatus } = req.body;
    
    // Create a mock payment ID for demonstration
    const mockPaymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
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
      status: "pending",
      payment: {
        amount: 500,
        status: paymentStatus || "pending",
        paymentId: paymentStatus === "paid" ? mockPaymentId : null,
        paymentDate: paymentStatus === "paid" ? new Date() : null,
      },
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
    // Start from the beginning of today in Sri Lankan time
    const todayStart = moment().tz(timezone).startOf('day');
    const xDaysFromToday = moment().tz(timezone).add(14, 'days').endOf('day');

    const intervalMinutes = 30; // 30 mins
    const intervals = [];
    let slotTime = todayStart.clone();

    let pairCount = 0;
    while (
      slotTime.isBefore(xDaysFromToday) ||
      slotTime.isSame(xDaysFromToday)
    ) {
      const sriLankanTime = slotTime.clone();
      const hour = sriLankanTime.hour();
      const minute = sriLankanTime.minute();
      
      // Check if the current time is within working hours (9 AM - 9 PM) in Sri Lankan time
      if (hour >= 9 && (hour < 21 || (hour === 20 && minute === 30))) {
        const from = slotTime.format();

        if (pairCount > 0) {
          intervals[pairCount - 1].to = from;
        }

        intervals.push({ from: from, to: null, availability: true });
        pairCount += 1;
      }
      
      slotTime.add(intervalMinutes, 'minutes');
    }

    // Get existing appointments
    const fetchedAppointmentTimes = await Appointment.find({
      appointmentFrom: { 
        $gte: todayStart.toDate(),
        $lte: xDaysFromToday.toDate()
      }
    }).select("appointmentFrom appointmentTo");

    // Mark slots as unavailable if they overlap with existing appointments
    fetchedAppointmentTimes.forEach((appointment) => {
      const appointmentStart = moment(appointment.appointmentFrom);
      const appointmentEnd = moment(appointment.appointmentTo);

      intervals.forEach((slot, index) => {
        const slotStart = moment(slot.from);
        const slotEnd = moment(slot.to || slotStart.clone().add(intervalMinutes, 'minutes'));

        if (
          (slotStart.isSameOrAfter(appointmentStart) && slotStart.isBefore(appointmentEnd)) ||
          (slotEnd.isAfter(appointmentStart) && slotEnd.isSameOrBefore(appointmentEnd)) ||
          (slotStart.isSameOrBefore(appointmentStart) && slotEnd.isSameOrAfter(appointmentEnd))
        ) {
          intervals[index].availability = false;
        }
      });
    });

    // Filter out past slots and format the response
    const now = moment().tz(timezone);
    const result = intervals
      .filter(slot => moment(slot.from).isAfter(now))
      .map((item) => ({
        from: moment(item.from).tz(timezone).format(),
        to: moment(item.to || moment(item.from).add(intervalMinutes, 'minutes')).tz(timezone).format(),
        isAvailable: item.availability,
      }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAvailableSlots:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { petId, services, userId, appointmentFrom, appointmentTo } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update appointment fields
    appointment.petId = petId || appointment.petId;
    appointment.services = services || appointment.services;
    appointment.userId = userId || appointment.userId;
    
    if (appointmentFrom) {
      appointment.appointmentFrom = moment
        .tz(appointmentFrom, timezone)
        .utc()
        .seconds(0)
        .format();
    }
    
    if (appointmentTo) {
      appointment.appointmentTo = moment
        .tz(appointmentTo, timezone)
        .utc()
        .seconds(0)
        .format();
    }

    await appointment.save();

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

const generateReport = async (req, res) => {
  try {
    // Get all appointments
    const appointments = await Appointment.find();
    
    // Calculate statistics
    const serviceStats = {};
    const timeSlotStats = {};
    const twoWeekPeriods = [];
    const currentDate = moment().tz(timezone);
    
    // Initialize two-week periods for the last 6 months
    for (let i = 0; i < 12; i++) {
      const startDate = currentDate.clone().subtract(i * 14, 'days');
      const endDate = startDate.clone().add(13, 'days');
      twoWeekPeriods.push({
        start: startDate,
        end: endDate,
        count: 0
      });
    }

    appointments.forEach(appointment => {
      // Service type statistics
      appointment.services.forEach(service => {
        serviceStats[service] = (serviceStats[service] || 0) + 1;
      });

      // Time slot statistics
      const appointmentTime = moment(appointment.appointmentFrom).tz(timezone);
      const hour = appointmentTime.hour();
      const timeSlot = `${hour}:00 - ${hour + 1}:00`;
      timeSlotStats[timeSlot] = (timeSlotStats[timeSlot] || 0) + 1;

      // Two-week period statistics
      const appointmentDate = moment(appointment.appointmentFrom).tz(timezone);
      twoWeekPeriods.forEach(period => {
        if (appointmentDate.isBetween(period.start, period.end, 'day', '[]')) {
          period.count++;
        }
      });
    });

    // Calculate averages
    const totalAppointments = appointments.length;
    const averageAppointmentsPerTwoWeeks = totalAppointments / twoWeekPeriods.length;
    
    // Find busiest time slots
    const busiestTimeSlots = Object.entries(timeSlotStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Create PDF
    const doc = new PDFDocument();
    const fileName = `appointment-report-${moment().format('YYYY-MM-DD')}.pdf`;
    const reportsDir = path.join(process.cwd(), 'reports');
    
    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, fileName);

    // Write PDF to file
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Add content to PDF
    doc.fontSize(20).text('Appointment Statistics Report', { align: 'center' });
    doc.moveDown(2);

    // Service Statistics
    doc.fontSize(16).text('Service Type Statistics');
    doc.moveDown();
    Object.entries(serviceStats).forEach(([service, count]) => {
      doc.fontSize(12).text(`${service}: ${count} appointments (${((count/totalAppointments)*100).toFixed(2)}%)`);
    });
    doc.moveDown(2);

    // Time Slot Statistics
    doc.fontSize(16).text('Busiest Time Slots');
    doc.moveDown();
    busiestTimeSlots.forEach(([timeSlot, count]) => {
      doc.fontSize(12).text(`${timeSlot}: ${count} appointments (${((count/totalAppointments)*100).toFixed(2)}%)`);
    });
    doc.moveDown(2);

    // Two-Week Period Statistics
    doc.fontSize(16).text('Two-Week Period Statistics');
    doc.moveDown();
    doc.fontSize(12).text(`Average appointments per two weeks: ${averageAppointmentsPerTwoWeeks.toFixed(2)}`);
    doc.moveDown();
    twoWeekPeriods.forEach((period, index) => {
      doc.fontSize(12).text(
        `Period ${index + 1} (${period.start.format('MMM D')} - ${period.end.format('MMM D')}): ${period.count} appointments`
      );
    });

    // Finalize PDF
    doc.end();

    // Wait for the write stream to finish
    writeStream.on('finish', () => {
      // Send the file for download
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({ message: 'Error sending file' });
        }
        // Clean up: delete the file after sending
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    });

    writeStream.on('error', (err) => {
      console.error('Error writing file:', err);
      res.status(500).json({ message: 'Error generating report' });
    });

  } catch (error) {
    console.error('Error in generateReport:', error);
    res.status(500).json({ message: error.message });
  }
};

const initiatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Generate mock payment ID
    const mockPaymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Update appointment with payment details
    appointment.payment.paymentId = mockPaymentId;
    appointment.payment.status = "pending";
    await appointment.save();

    res.status(200).json({
      message: "Payment initiated successfully",
      paymentId: mockPaymentId,
      amount: appointment.payment.amount,
      appointmentId: appointment._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params; // This is the appointment ID
    const { paymentId } = req.body; // This should be the payment ID received from initiate payment
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    if (!paymentId) {
      return res.status(400).json({ 
        message: "Payment ID is required in request body",
        example: {
          "paymentId": "PAY-xxxxxx-xxxxx"
        }
      });
    }

    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!appointment.payment.paymentId) {
      return res.status(400).json({ 
        message: "Payment not initiated for this appointment. Please initiate payment first using POST /appointments/:id/payment/initiate"
      });
    }

    if (appointment.payment.paymentId !== paymentId) {
      return res.status(400).json({ 
        message: "Invalid payment ID. Make sure to use the payment ID received from the initiate payment step",
        currentPaymentId: appointment.payment.paymentId,
        providedPaymentId: paymentId
      });
    }

    // Mock payment verification
    appointment.payment.status = "paid";
    appointment.payment.paymentDate = new Date();
    appointment.status = "confirmed";
    await appointment.save();

    res.status(200).json({
      message: "Payment verified successfully",
      appointment: {
        id: appointment._id,
        status: appointment.status,
        paymentStatus: appointment.payment.status,
        amount: appointment.payment.amount
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  deleteAppointment,
  getAvailableSlots,
  updateAppointment,
  generateReport,
  initiatePayment,
  verifyPayment,
};
