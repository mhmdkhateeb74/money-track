const express = require("express");
const Expense = require("../models/expense");
const User = require("../models/user");
const { auth } = require("../middleware/auth");

const router = express.Router();

function monthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

// Create
router.post("/", auth, async (req, res) => {
  try {
    const { amount, category, date, note } = req.body;

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }
    if (!category || !date) {
      return res.status(400).json({ message: "category and date are required" });
    }

    const expense = await Expense.create({
      amount,
      category: String(category).trim(),
      date: new Date(date),
      note: note ? String(note).trim() : "",
      userId: req.user.id
    });

    // Monthly alert check
    const user = await User.findById(req.user.id).select("monthlyLimit");
    let alert = null;

    if (user && user.monthlyLimit > 0) {
      const d = new Date(expense.date);
      const { start, end } = monthRange(d.getFullYear(), d.getMonth() + 1);

      const agg = await Expense.aggregate([
        { $match: { userId: expense.userId, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      const total = agg.length ? agg[0].total : 0;

      if (total > user.monthlyLimit) {
        alert = { overLimit: true, total, limit: user.monthlyLimit };
      }
    }

    return res.status(201).json({ message: "Created", expense, alert });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Read (with filters)
router.get("/", auth, async (req, res) => {
  try {
    const { from, to, category } = req.query;

    const filter = { userId: req.user.id };
    if (from || to) filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
    if (category) filter.category = String(category).trim();

    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 }).limit(500);
    return res.json({ expenses });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Update
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, date, note } = req.body;

    const update = {};
    if (typeof amount === "number") update.amount = amount;
    if (category !== undefined) update.category = String(category).trim();
    if (date !== undefined) update.date = new Date(date);
    if (note !== undefined) update.note = String(note).trim();

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      update,
      { new: true }
    );

    if (!expense) return res.status(404).json({ message: "Expense not found" });
    return res.json({ message: "Updated", expense });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Expense.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Expense not found" });
    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
