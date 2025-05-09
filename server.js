const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./db.js");

//lenoras routes
const reviewRoutes = require("./routes/reviewRoute");
const authRoutes = require("./routes/authRoutes");
//nilekas routes
const inventoryRoutes = require("./routes/inventoryRoutes");
//amashas routes
const appointmentRoutes = require("./routes/appointmentRoutes");
const userRoutes = require("./routes/userRoutes");
const petRoutes = require("./routes/petRoutes");


// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

//connect to mongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());  

//routes
app.use("/reviews", reviewRoutes);
app.use("/auth", authRoutes); 

// Sample route
app.get("/", (req, res) => {
    console.log("hello");
    res.send("Welcome to Express App!");
});


//amasha
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/pets", petRoutes);


// nilekas inventory routes
app.use("/inventory", inventoryRoutes);
app.use('/uploads', express.static('uploads'));


// Define port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

