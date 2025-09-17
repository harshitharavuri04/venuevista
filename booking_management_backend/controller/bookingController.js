const axios = require("axios");
const Booking = require("../models/booking");

const VENUE_SERVICE_URL =
  process.env.VENUE_SERVICE_URL || "http://localhost:3001"; // Add default fallback

// POST /api/bookings - Book a venue
const bookVenue = async (req, res) => {
  try {
    const { venue, date } = req.body;
    const userId = req.user._id || req.user.id;

    if (!venue || !date) {
      return res
        .status(400)
        .json({ success: false, message: "Venue and date are required" });
    }

    // ✅ Call Venue Management API
    const venueResponse = await axios.get(
      `${VENUE_SERVICE_URL}/api/venues/${venue}`
    );
    const venueDoc = venueResponse.data; // This is the venue object directly

    if (!venueDoc || !venueDoc._id) {
      return res
        .status(404)
        .json({ success: false, message: "Venue not found" });
    }

    // Validate booking date
    const bookingDate = new Date(date);
    if (
      isNaN(bookingDate.getTime()) ||
      bookingDate < new Date().setHours(0, 0, 0, 0)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or past date" });
    }

    // Check unavailable dates from Venue service
    if (
      venueDoc.unavailableDates?.some(
        (d) => new Date(d).toDateString() === bookingDate.toDateString()
      )
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Venue unavailable on this date" });
    }

    // Check existing booking
    const existingBooking = await Booking.findOne({
      venue,
      date: bookingDate,
      status: { $ne: "Cancelled" },
    });

    if (existingBooking) {
      return res
        .status(400)
        .json({ success: false, message: "Venue already booked on this date" });
    }

    // ✅ Create booking
    const booking = new Booking({
      user: userId,
      venue,
      date: bookingDate,
      status: "Pending",
      paymentStatus: "Pending",
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        ...booking.toObject(),
        venue: venueDoc, // Return venue object directly
        user: {
          _id: req.user._id,
          username: req.user.username,
          email: req.user.email,
        },
      },
    });
  } catch (error) {
    console.error(
      "Error creating booking:",
      error.response?.data || error.message
    );

    // Handle specific venue service errors
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating booking",
      error: error.response?.data || "Internal server error",
    });
  }
};

// GET /api/bookings - Retrieve user bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { user: userId };
    if (status && ["Pending", "Confirmed", "Cancelled"].includes(status)) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Fetch venue details for each booking
    const enrichedBookings = await Promise.all(
      bookings.map(async (b) => {
        try {
          const venueResponse = await axios.get(
            `${VENUE_SERVICE_URL}/api/venues/${b.venue}`
          );
          return { ...b.toObject(), venue: venueResponse.data };
        } catch {
          return { ...b.toObject(), venue: null };
        }
      })
    );

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: enrichedBookings,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: bookings.length,
        totalBookings: total,
      },
      user: {
        _id: req.user._id,
        username: req.user.username,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.response?.data || "Internal server error",
    });
  }
};

// PUT /api/bookings/:id/cancel - Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id || req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this booking",
      });
    }

    if (booking.status === "Cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Booking is already cancelled" });
    }

    if (booking.date < new Date().setHours(0, 0, 0, 0)) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot cancel past bookings" });
    }

    booking.status = "Cancelled";
    booking.updatedAt = new Date();
    await booking.save();

    // Fetch venue details
    let venueData = null;
    try {
      const venueResponse = await axios.get(
        `${VENUE_SERVICE_URL}/api/venues/${booking.venue}`
      );
      venueData = venueResponse.data;
    } catch {}

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: { ...booking.toObject(), venue: venueData },
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling booking",
      error: error.response?.data || "Internal server error",
    });
  }
};

// GET /api/bookings/:id - Get specific booking details
const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    const booking = await Booking.findById(bookingId).populate(
      "user",
      "username email contact"
    );
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Fetch venue details
    let venueData = null;
    try {
      const venueResponse = await axios.get(
        `${VENUE_SERVICE_URL}/api/venues/${booking.venue}`
      );
      venueData = venueResponse.data;
    } catch {}

    // Check permissions
    const isOwner = booking.user._id.toString() === userId.toString();
    const isVenueOwner =
      userRole === "VENUE_OWNER" &&
      venueData?.ownerContact === req.user.contact; // Updated to match your venue schema

    if (!isOwner && !isVenueOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this booking",
      });
    }

    res.status(200).json({
      success: true,
      data: { ...booking.toObject(), venue: venueData },
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching booking details",
      error: error.response?.data || "Internal server error",
    });
  }
};

// PUT /api/bookings/:id/status - Update booking status (for venue owners)
const updateBookingStatus = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    if (userRole !== "VENUE_OWNER") {
      return res.status(403).json({
        success: false,
        message: "Only venue owners can update booking status",
      });
    }

    if (!["Pending", "Confirmed", "Cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: Pending, Confirmed, or Cancelled",
      });
    }

    const booking = await Booking.findById(bookingId).populate(
      "user",
      "username email"
    );
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Fetch venue details
    let venueData = null;
    try {
      const venueResponse = await axios.get(
        `${VENUE_SERVICE_URL}/api/venues/${booking.venue}`
      );
      venueData = venueResponse.data;
    } catch {}

    if (!venueData || venueData.ownerContact !== req.user.contact) {
      // Updated to match your venue schema
      return res.status(403).json({
        success: false,
        message: "You can only update bookings for your own venues",
      });
    }

    booking.status = status;
    booking.updatedAt = new Date();
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status} successfully`,
      data: { ...booking.toObject(), venue: venueData },
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating booking status",
      error: error.response?.data || "Internal server error",
    });
  }
};

// GET /api/bookings/owner/venues - Get bookings for venue owner's venues
const getOwnerVenueBookings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const userContact = req.user.contact;

    if (userRole !== "VENUE_OWNER") {
      return res.status(403).json({
        success: false,
        message: "Only venue owners can access this endpoint",
      });
    }

    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status && ["Pending", "Confirmed", "Cancelled"].includes(status)) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "username email contact");

    // Fetch venue details & filter only owned venues
    const ownerBookings = [];
    for (const b of bookings) {
      try {
        const venueResponse = await axios.get(
          `${VENUE_SERVICE_URL}/api/venues/${b.venue}`
        );
        const venueData = venueResponse.data;
        if (venueData && venueData.ownerContact === userContact) {
          // Updated to match your venue schema
          ownerBookings.push({ ...b.toObject(), venue: venueData });
        }
      } catch {}
    }

    const total = await Booking.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: ownerBookings,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: ownerBookings.length,
        totalBookings: total,
      },
    });
  } catch (error) {
    console.error("Error fetching owner venue bookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching venue bookings",
      error: error.response?.data || "Internal server error",
    });
  }
};

module.exports = {
  bookVenue,
  getUserBookings,
  cancelBooking,
  getBookingById,
  updateBookingStatus,
  getOwnerVenueBookings,
};
