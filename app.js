const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDb } = require("./config/db");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// static frontend
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/user", require("./routes/user.routes"));
app.use("/api/expenses", require("./routes/expense.routes"));
app.use("/api/stats", require("./routes/stats.routes"));

// start
const port = process.env.PORT || 3000;

(async () => {
  try {
    await connectDb(process.env.MONGO_URI);
    app.listen(port, () => console.log("✅ Server running: http://localhost:" + port));
  } catch (err) {
    console.error("❌ Failed to start:", err.message);
    process.exit(1);
  }
})();
