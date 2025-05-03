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
    console.log('Starting report generation...');
    
    // Get all appointments with populated user and pet data
    const appointments = await Appointment.find()
      .populate('userId', 'name')  // Only populate necessary fields
      .populate('petId', 'name type')
      .catch(err => {
        console.error('Error fetching appointments:', err);
        throw new Error('Failed to fetch appointment data from database');
      });

    if (!appointments || appointments.length === 0) {
      console.log('No appointments found in the database');
      return res.status(404).json({ 
        message: 'No appointment data found to generate report',
        error: 'NO_DATA'
      });
    }

    console.log(`Found ${appointments.length} appointments for report generation`);

    // Initialize statistics objects
    const stats = {
      appointmentVolume: {
        daily: {},
        weekly: {},
        monthly: {},
        serviceType: {},
        perPet: {},
        singleVsMultiPet: {
          single: 0,
          multi: 0,
          total: 0
        }
      },
      scheduling: {
        peakHours: {},
        weekdayVsWeekend: {
          weekday: 0,
          weekend: 0
        },
        slotUtilization: {
          weekday: { total: 0, booked: 0 },
          weekend: { total: 0, booked: 0 }
        },
        popularDays: {},
        cancellationRate: {
          total: 0,
          cancelled: 0,
          byService: {}
        }
      },
      serviceInsights: {
        mostRequested: {},
        totalByService: {}
      },
      clientBehavior: {
        loyalty: {}
      }
    };

    // Process each appointment
    appointments.forEach(appointment => {
      try {
        const appointmentDate = moment(appointment.appointmentFrom).tz(timezone);
        const dayOfWeek = appointmentDate.day();
        const hour = appointmentDate.hour();
        const dateKey = appointmentDate.format('YYYY-MM-DD');
        const weekKey = appointmentDate.format('YYYY-[W]WW');
        const monthKey = appointmentDate.format('YYYY-MM');

        // Appointment Volume Analysis
        stats.appointmentVolume.daily[dateKey] = (stats.appointmentVolume.daily[dateKey] || 0) + 1;
        stats.appointmentVolume.weekly[weekKey] = (stats.appointmentVolume.weekly[weekKey] || 0) + 1;
        stats.appointmentVolume.monthly[monthKey] = (stats.appointmentVolume.monthly[monthKey] || 0) + 1;

        // Service Type Analysis
        appointment.services.forEach(service => {
          stats.appointmentVolume.serviceType[service] = (stats.appointmentVolume.serviceType[service] || 0) + 1;
          stats.serviceInsights.totalByService[service] = (stats.serviceInsights.totalByService[service] || 0) + 1;
        });

        // Per Pet Analysis
        const petId = appointment.petId._id.toString();
        stats.appointmentVolume.perPet[petId] = (stats.appointmentVolume.perPet[petId] || 0) + 1;

        // Single vs Multi Pet Analysis
        const userId = appointment.userId._id.toString();
        if (!stats.appointmentVolume.singleVsMultiPet[userId]) {
          const userPets = appointments.filter(a => a.userId._id.toString() === userId)
            .map(a => a.petId._id.toString());
          const uniquePets = new Set(userPets).size;
          if (uniquePets > 1) {
            stats.appointmentVolume.singleVsMultiPet.multi++;
          } else {
            stats.appointmentVolume.singleVsMultiPet.single++;
          }
          stats.appointmentVolume.singleVsMultiPet.total++;
          stats.appointmentVolume.singleVsMultiPet[userId] = true;
        }

        // Time Slot Analysis
        const timeSlot = `${hour}:00 - ${hour + 1}:00`;
        stats.scheduling.peakHours[timeSlot] = (stats.scheduling.peakHours[timeSlot] || 0) + 1;

        // Weekday vs Weekend Analysis
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          stats.scheduling.weekdayVsWeekend.weekend++;
        } else {
          stats.scheduling.weekdayVsWeekend.weekday++;
        }

        // Slot Utilization
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (isWeekend) {
          stats.scheduling.slotUtilization.weekend.total++;
          if (appointment.status === 'confirmed') {
            stats.scheduling.slotUtilization.weekend.booked++;
          }
        } else {
          stats.scheduling.slotUtilization.weekday.total++;
          if (appointment.status === 'confirmed') {
            stats.scheduling.slotUtilization.weekday.booked++;
          }
        }

        // Popular Days
        const dayName = appointmentDate.format('dddd');
        stats.scheduling.popularDays[dayName] = (stats.scheduling.popularDays[dayName] || 0) + 1;

        // Cancellation Rate
        stats.scheduling.cancellationRate.total++;
        if (appointment.status === 'cancelled') {
          stats.scheduling.cancellationRate.cancelled++;
          appointment.services.forEach(service => {
            stats.scheduling.cancellationRate.byService[service] = (stats.scheduling.cancellationRate.byService[service] || 0) + 1;
          });
        }

        // Client Loyalty
        stats.clientBehavior.loyalty[userId] = (stats.clientBehavior.loyalty[userId] || 0) + 1;
      } catch (err) {
        console.error('Error processing appointment:', err);
        // Continue processing other appointments
      }
    });

    // Calculate derived statistics
    const totalAppointments = appointments.length;
    const cancellationRate = (stats.scheduling.cancellationRate.cancelled / totalAppointments) * 100;
    const slotUtilizationWeekday = (stats.scheduling.slotUtilization.weekday.booked / stats.scheduling.slotUtilization.weekday.total) * 100;
    const slotUtilizationWeekend = (stats.scheduling.slotUtilization.weekend.booked / stats.scheduling.slotUtilization.weekend.total) * 100;
    const singlePetPercentage = (stats.appointmentVolume.singleVsMultiPet.single / stats.appointmentVolume.singleVsMultiPet.total) * 100;
    const multiPetPercentage = (stats.appointmentVolume.singleVsMultiPet.multi / stats.appointmentVolume.singleVsMultiPet.total) * 100;

    // Find most requested service
    const mostRequestedService = Object.entries(stats.serviceInsights.totalByService)
      .sort(([, a], [, b]) => b - a)[0];

    // Find top clients by visits
    const topClients = Object.entries(stats.clientBehavior.loyalty)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Create PDF
    const doc = new PDFDocument();
    const fileName = `appointment-report-${moment().format('YYYY-MM-DD')}.pdf`;
    const reportsDir = path.join(process.cwd(), 'reports');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, fileName);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Add content to PDF
    doc.fontSize(20).text('Appointment Statistics Report', { align: 'center' });
    doc.moveDown(2);

    // 1. Appointment Volume & Demand Analysis
    doc.fontSize(16).text('1. Appointment Volume & Demand Analysis');
    doc.moveDown();

    // Total Appointments
    doc.fontSize(14).text('Total Appointments:');
    doc.fontSize(12).text(`- Total: ${totalAppointments}`);
    doc.fontSize(12).text(`- Daily Average: ${(totalAppointments / Object.keys(stats.appointmentVolume.daily).length).toFixed(2)}`);
    doc.fontSize(12).text(`- Weekly Average: ${(totalAppointments / Object.keys(stats.appointmentVolume.weekly).length).toFixed(2)}`);
    doc.fontSize(12).text(`- Monthly Average: ${(totalAppointments / Object.keys(stats.appointmentVolume.monthly).length).toFixed(2)}`);
    doc.moveDown();

    // Service Type Breakdown
    doc.fontSize(14).text('Appointments by Service Type:');
    Object.entries(stats.appointmentVolume.serviceType).forEach(([service, count]) => {
      doc.fontSize(12).text(`- ${service}: ${count} (${((count/totalAppointments)*100).toFixed(2)}%)`);
    });
    doc.moveDown();

    // Single vs Multi Pet Clients
    doc.fontSize(14).text('Client Distribution:');
    doc.fontSize(12).text(`- Single Pet Clients: ${singlePetPercentage.toFixed(2)}%`);
    doc.fontSize(12).text(`- Multi Pet Clients: ${multiPetPercentage.toFixed(2)}%`);
    doc.moveDown(2);

    // 2. Time Slot & Scheduling Efficiency
    doc.fontSize(16).text('2. Time Slot & Scheduling Efficiency');
    doc.moveDown();

    // Busiest Time Slots
    doc.fontSize(14).text('Busiest Time Slots:');
    const busiestTimeSlots = Object.entries(stats.scheduling.peakHours)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    busiestTimeSlots.forEach(([time, count]) => {
      const percentage = ((count / totalAppointments) * 100).toFixed(2);
      doc.fontSize(12).text(`- ${time}: ${count} appointments (${percentage}%)`);
    });
    doc.moveDown();

    // Weekday vs Weekend
    doc.fontSize(14).text('Weekday vs Weekend Demand:');
    doc.fontSize(12).text(`- Weekday: ${stats.scheduling.weekdayVsWeekend.weekday} appointments`);
    doc.fontSize(12).text(`- Weekend: ${stats.scheduling.weekdayVsWeekend.weekend} appointments`);
    doc.moveDown();

    // Slot Utilization
    doc.fontSize(14).text('Slot Utilization Rate:');
    doc.fontSize(12).text(`- Weekday: ${slotUtilizationWeekday.toFixed(2)}%`);
    doc.fontSize(12).text(`- Weekend: ${slotUtilizationWeekend.toFixed(2)}%`);
    doc.moveDown();

    // Most Popular Days
    doc.fontSize(14).text('Most Popular Days:');
    const popularDays = Object.entries(stats.scheduling.popularDays)
      .sort(([, a], [, b]) => b - a);
    popularDays.forEach(([day, count]) => {
      doc.fontSize(12).text(`- ${day}: ${count} appointments`);
    });
    doc.moveDown();

    // Cancellation Rate
    doc.fontSize(14).text('Cancellation Rate:');
    doc.fontSize(12).text(`- Overall: ${cancellationRate.toFixed(2)}%`);
    doc.fontSize(12).text('By Service Type:');
    Object.entries(stats.scheduling.cancellationRate.byService).forEach(([service, count]) => {
      const serviceTotal = stats.appointmentVolume.serviceType[service];
      doc.fontSize(12).text(`  - ${service}: ${((count/serviceTotal)*100).toFixed(2)}%`);
    });
    doc.moveDown(2);

    // 3. Service-Specific Insights
    doc.fontSize(16).text('3. Service-Specific Insights');
    doc.moveDown();
    doc.fontSize(14).text('Most Requested Service:');
    doc.fontSize(12).text(`- ${mostRequestedService[0]}: ${mostRequestedService[1]} appointments`);
    doc.moveDown(2);

    // 4. Client Behavior
    doc.fontSize(16).text('4. Client Behavior');
    doc.moveDown();
    doc.fontSize(14).text('Top Clients by Number of Visits:');
    topClients.forEach(([userId, visits], index) => {
      doc.fontSize(12).text(`${index + 1}. User ID: ${userId} - ${visits} visits`);
    });

    // Finalize PDF
    doc.end();

    // Wait for the write stream to finish
    writeStream.on('finish', () => {
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
    // Send a more detailed error response
    res.status(500).json({ 
      message: error.message || 'Failed to generate report',
      error: error.name || 'UNKNOWN_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
