const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./db.js");

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Sample route
app.get("/", (req, res) => {
    connectDB()
    res.send("Welcome to Express App!");
});

// Define port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
