const mongoose = require("mongoose");
const cors = require("cors");
const express = require("express");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const app = express();
const PORT = process.env.PORT || 5000;

// Middelware
app.use(
  cors({
    origin: "http://localhost:3000", // allows request from the origin
    credentials: true, // allow cookies to be sent
  })
);
app.use(express.json());

// Sample routes
app.get("/api", (req, res) => {
  res.send("API is working!");
});

app.use("/api/users", userRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(`MongoDB connected`);
    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.log("Error connecting to MongoDB:", err));
