const Venue = require("../models/Venue");
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");
const mongoose = require("mongoose"); // Add this line
// Create the exports object that will hold all our controller functions
const venueController = {};

// Add a new venue
venueController.addVenue = async (req, res) => {
  try {
    const {
      title,
      category,
      location,
      price,
      seating,
      hasParking,
      hasAC,
      hasCatering,
      unavailableDates,
      ownerContact, // New field
    } = req.body;

    // Validate required fields
    if (!ownerContact) {
      return res.status(400).json({
        error: "Owner contact is required",
      });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : "";

    // Convert boolean values correctly
    const parseBoolean = (value) => value === "true" || value === true;

    // Parse unavailable dates
    let parsedDates = [];
    if (Array.isArray(unavailableDates)) {
      parsedDates = unavailableDates.map((date) => new Date(date));
    } else if (typeof unavailableDates === "string") {
      try {
        parsedDates = JSON.parse(unavailableDates).map(
          (date) => new Date(date)
        );
      } catch (error) {
        console.error("Invalid unavailableDates format:", unavailableDates);
      }
    }

    // Generate slug and ensure uniqueness
    let slug = slugify(title, { lower: true, strict: true });
    let existingVenue = await Venue.findOne({ slug });

    if (existingVenue) {
      slug = `${slug}-${Date.now()}`; // Append timestamp to ensure uniqueness
    }

    const venueData = {
      title,
      category,
      location,
      price: Number(price) || 0,
      seating: Number(seating) || 0,
      hasParking: parseBoolean(hasParking),
      hasAC: parseBoolean(hasAC),
      hasCatering: parseBoolean(hasCatering),
      image,
      unavailableDates: parsedDates,
      slug,
      ownerContact, // Add owner contact
    };

    const newVenue = new Venue(venueData);
    await newVenue.save();

    res.status(201).json({
      message: "Venue added successfully",
      venue: newVenue,
    });
  } catch (error) {
    console.error("Error adding venue:", error);
    res.status(500).json({
      error: "Failed to add venue",
      details: error.message,
    });
  }
};

// Edit a venue
venueController.editVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      location,
      price,
      seating,
      hasParking,
      hasAC,
      hasCatering,
      unavailableDates,
      ownerContact,
    } = req.body;

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    let imagePath = venue.image;
    if (req.file) {
      if (venue.image) {
        const oldImagePath = path.join(__dirname, "..", venue.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = `/uploads/${req.file.filename}`;
    }

    // Handle unavailableDates - check if it's an array or string
    const processedUnavailableDates = Array.isArray(unavailableDates)
      ? unavailableDates.map((date) => new Date(date))
      : unavailableDates
      ? JSON.parse(unavailableDates).map((date) => new Date(date))
      : venue.unavailableDates;

    const updatedVenue = {
      title: title || venue.title,
      category: category || venue.category,
      location: location || venue.location,
      price: Number(price) || venue.price,
      seating: Number(seating) || venue.seating,
      hasParking:
        hasParking !== undefined ? Boolean(hasParking) : venue.hasParking,
      hasAC: hasAC !== undefined ? Boolean(hasAC) : venue.hasAC,
      hasCatering:
        hasCatering !== undefined ? Boolean(hasCatering) : venue.hasCatering,
      image: imagePath,
      unavailableDates: processedUnavailableDates,
      ownerContact: ownerContact || venue.ownerContact,
    };

    const result = await Venue.findByIdAndUpdate(id, updatedVenue, {
      new: true,
    });

    res.status(200).json({
      message: "Venue updated successfully",
      venue: result,
    });
  } catch (error) {
    console.error("Error updating venue:", error);
    res.status(500).json({
      error: "Failed to update venue",
      details: error.message,
    });
  }
};

// Delete a venue
venueController.deleteVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const venue = await Venue.findById(id);

    if (!venue) {
      return res.status(404).json({ message: "Venue not found" });
    }

    // Delete the associated image file if it exists
    if (venue.image) {
      const imagePath = path.join(__dirname, "..", venue.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Venue.findByIdAndDelete(id);
    res.status(200).json({ message: "Venue deleted successfully" });
  } catch (error) {
    console.error("Error deleting venue:", error);
    res.status(500).json({
      error: "Failed to delete venue",
      details: error.message,
    });
  }
};

// Get all venues
venueController.getAllVenues = async (req, res) => {
  try {
    const venues = await Venue.find();
    res.status(200).json(venues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({
      error: "Failed to fetch venues",
      details: error.message,
    });
  }
};
// Get a venue by ID
venueController.getVenueById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Received ID:", id);
    console.log("ID type:", typeof id);

    // Validate if it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid venue ID format",
      });
    }

    const venue = await Venue.findById(id);
    console.log("Found venue:", venue);

    if (!venue) {
      return res.status(404).json({
        error: "Venue not found",
      });
    }

    res.status(200).json(venue);
  } catch (error) {
    console.error("Error fetching venue by ID:", error);
    res.status(500).json({
      error: "Failed to fetch venue",
      details: error.message,
    });
  }
};

// New function: Get venues by owner contact
venueController.getVenuesByOwner = async (req, res) => {
  try {
    const { ownerContact } = req.params;

    if (!ownerContact) {
      return res.status(400).json({
        error: "Owner contact is required",
      });
    }

    const venues = await Venue.find({ ownerContact }).sort({ createdAt: -1 });

    res.status(200).json({
      message: `Found ${venues.length} venues for owner`,
      venues,
      ownerContact,
    });
  } catch (error) {
    console.error("Error fetching venues by owner:", error);
    res.status(500).json({
      error: "Failed to fetch venues by owner",
      details: error.message,
    });
  }
};

// New function: Get venue statistics for an owner
venueController.getOwnerStats = async (req, res) => {
  try {
    const { ownerContact } = req.params;

    if (!ownerContact) {
      return res.status(400).json({
        error: "Owner contact is required",
      });
    }

    const totalVenues = await Venue.countDocuments({ ownerContact });
    const venues = await Venue.find({ ownerContact });

    const categories = venues.reduce((acc, venue) => {
      acc[venue.category] = (acc[venue.category] || 0) + 1;
      return acc;
    }, {});

    const totalSeating = venues.reduce((sum, venue) => sum + venue.seating, 0);
    const averagePrice =
      venues.length > 0
        ? venues.reduce((sum, venue) => sum + venue.price, 0) / venues.length
        : 0;

    res.status(200).json({
      ownerContact,
      statistics: {
        totalVenues,
        totalSeating,
        averagePrice: Math.round(averagePrice * 100) / 100,
        categoriesCount: categories,
        venues: venues.map((venue) => ({
          id: venue._id,
          title: venue.title,
          category: venue.category,
          price: venue.price,
          seating: venue.seating,
          createdAt: venue.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching owner statistics:", error);
    res.status(500).json({
      error: "Failed to fetch owner statistics",
      details: error.message,
    });
  }
};

// Export the controller object with all methods
module.exports = venueController;
