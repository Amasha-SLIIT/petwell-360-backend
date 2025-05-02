const express = require("express");
//const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./db.js");

//nilekas routes
const inventoryRoutes = require("./routes/inventoryRoutes");
//amasha routes
const appointmentRoutes = require("./routes/appointmentRoutes");
const userRoutes = require("./routes/userRoutes");
const petRoutes = require("./routes/petRoutes");





// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Middlewarev 
app.use(cors());
app.use(express.json());

//amasha
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/pets", petRoutes);


// nilekas inventory routes
app.use("/inventory", inventoryRoutes);
app.use('/uploads', express.static('uploads'));

// Sample route
app.get("/", (req, res) => {
  console.log("bye");
  res.send("Welcome to Express App!");
});
// Define port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

