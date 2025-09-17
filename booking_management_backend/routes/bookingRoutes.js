const express = require("express");
const router = express.Router();
const {
  bookVenue,
  getUserBookings,
  cancelBooking,
  getBookingById,
  updateBookingStatus,
  getOwnerVenueBookings,
} = require("../controller/bookingController");

// Import auth middleware
const authMiddleware = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(authMiddleware);

// POST /api/bookings - Book a venue
router.post("/", bookVenue);

// GET /api/bookings - Retrieve user bookings
router.get("/", getUserBookings);

// GET /api/bookings/owner/venues - Get bookings for venue owner's venues
router.get("/owner/venues", getOwnerVenueBookings);

// GET /api/bookings/:id - Get specific booking details
router.get("/:id", getBookingById);

// PUT /api/bookings/:id/cancel - Cancel a booking
router.put("/:id/cancel", cancelBooking);

// PUT /api/bookings/:id/status - Update booking status
router.put("/:id/status", updateBookingStatus);

module.exports = router;
