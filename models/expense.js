const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true }, // food, transport, coffee, etc.
    date: { type: Date, required: true },
    note: { type: String, default: "", trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

expenseSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model("Expense", expenseSchema);
