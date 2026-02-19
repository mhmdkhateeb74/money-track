const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

/* =============================
   MongoDB Connection
============================= */

// إذا شغال Docker رح ياخد MONGO_URI من compose
// إذا شغال محلي رح يستخدم localhost
const mongoUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/money-track";

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

/* =============================
   Middleware
============================= */

app.use(express.json());

/* =============================
   Test Route
============================= */

app.get("/", (req, res) => {
  res.json({ message: "Money Track API is running 🚀" });
});

/* =============================
   Start Server
============================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
