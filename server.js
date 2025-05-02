const express = require("express");
//const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./db.js");
const inventoryRoutes = require("./routes/inventoryRoutes");




// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Middlewarev 
app.use(cors());
app.use(express.json());

// Use the inventory routes
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

