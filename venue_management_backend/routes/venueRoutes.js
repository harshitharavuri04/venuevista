const express = require("express");
const router = express.Router();
const {
  addVenue,
  editVenue,
  deleteVenue,
  getAllVenues,
  getVenuesByOwner,
  getOwnerStats,
  getVenueById,
} = require("../controllers/venueController");
const upload = require("../multerConfig");

// Existing routes
router.post("/venues", upload.single("image"), addVenue);
router.put("/venues/:id", upload.single("image"), editVenue);
router.delete("/venues/:id", deleteVenue);
router.get("/venues", getAllVenues);

// IMPORTANT: More specific routes should come FIRST
router.get("/venues/owner/:ownerContact/stats", getOwnerStats);
router.get("/venues/owner/:ownerContact", getVenuesByOwner);

// General route should come LAST
router.get("/venues/:id", getVenueById);

module.exports = router;
