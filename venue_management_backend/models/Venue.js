const mongoose = require("mongoose");
const { Schema } = mongoose;
const slugify = require("slugify");

const venueSchema = new Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    seating: { type: Number, required: true },
    hasParking: { type: Boolean, default: false },
    hasAC: { type: Boolean, default: false },
    hasCatering: { type: Boolean, default: false },
    image: { type: String },
    unavailableDates: { type: [Date], default: [] },
    slug: { type: String, unique: true },
    // New field for venue owner contact
    ownerContact: { type: String, required: true },
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields automatically
  }
);

// Automatically generate a slug before saving
venueSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

// Index for faster queries by ownerContact
venueSchema.index({ ownerContact: 1 });

const Venue = mongoose.model("Venue", venueSchema);
module.exports = Venue;
