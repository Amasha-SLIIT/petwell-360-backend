const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./db.js");
const reviewRoutes = require("./routes/reviewRoute");
const authRoutes = require("./routes/authRoutes");

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

/*
app.use("/",(req,res,next) => {
    res.send("It is working");
    }
    )
 */

// Sample route
app.get("/", (req, res) => {
    console.log("hello");
    res.send("Welcome to Express App!");
});

// Define port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



