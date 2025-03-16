const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./db.js");
const appointmentRoutes = require("./routes/appointmentRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
