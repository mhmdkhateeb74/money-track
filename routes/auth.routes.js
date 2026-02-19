const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, monthlyLimit } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      monthlyLimit: typeof monthlyLimit === "number" && monthlyLimit >= 0 ? monthlyLimit : 0
    });

    return res.status(201).json({
      message: "Registered",
      user: { id: user._id, name: user.name, email: user.email, monthlyLimit: user.monthlyLimit }
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, monthlyLimit: user.monthlyLimit }
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Update monthly limit
router.put("/limit", async (req, res) => {
  // This endpoint intentionally left without auth to keep the demo minimal in UI,
  // BUT we'll still require token in the client and here we check it if present.
  return res.status(501).json({ message: "Use /api/user/limit instead" });
});

module.exports = router;
