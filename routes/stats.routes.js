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

// Monthly stats
router.get("/monthly", auth, async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || (now.getMonth() + 1);

    const { start, end } = monthRange(year, month);

    const byCategory = await Expense.aggregate([
      { $match: { userId: new (require("mongoose")).Types.ObjectId(req.user.id), date: { $gte: start, $lt: end } } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    const totalAgg = await Expense.aggregate([
      { $match: { userId: new (require("mongoose")).Types.ObjectId(req.user.id), date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);

    const total = totalAgg.length ? totalAgg[0].total : 0;
    const count = totalAgg.length ? totalAgg[0].count : 0;
    const average = count > 0 ? total / count : 0;

    const topCategory = byCategory.length ? byCategory[0]._id : null;

    // Daily totals for chart
    const daily = await Expense.aggregate([
      { $match: { userId: new (require("mongoose")).Types.ObjectId(req.user.id), date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const user = await User.findById(req.user.id).select("monthlyLimit");

    const alert = user && user.monthlyLimit > 0 && total > user.monthlyLimit
      ? { overLimit: true, total, limit: user.monthlyLimit }
      : { overLimit: false, total, limit: user ? user.monthlyLimit : 0 };

    return res.json({
      year,
      month,
      total,
      average,
      topCategory,
      byCategory,
      daily,
      alert
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
