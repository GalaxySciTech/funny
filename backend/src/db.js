const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/quizmaster";

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log("MongoDB connected:", MONGODB_URI.replace(/:\/\/.*@/, "://***@"));
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
