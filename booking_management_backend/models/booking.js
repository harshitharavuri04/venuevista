// models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Venue",
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Failed"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
bookingSchema.index({ user: 1 });
bookingSchema.index({ venue: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
