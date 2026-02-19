const express = require("express");
const User = require("../models/user");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("_id name email monthlyLimit createdAt");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user });
});

router.put("/limit", auth, async (req, res) => {
  const { monthlyLimit } = req.body;
  if (typeof monthlyLimit !== "number" || monthlyLimit < 0) {
    return res.status(400).json({ message: "monthlyLimit must be a non-negative number" });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { monthlyLimit },
    { new: true, runValidators: true }
  ).select("_id name email monthlyLimit");

  return res.json({ message: "Updated", user });
});

module.exports = router;
