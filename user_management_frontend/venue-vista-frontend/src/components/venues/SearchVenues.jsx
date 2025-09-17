import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaSearch, FaMapMarkerAlt, FaUsers, FaCar, FaSnowflake, FaUtensils, FaCalendarAlt } from "react-icons/fa";
import "../../styles/search.css";

const SearchVenues = () => {
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState({});
  const [userToken, setUserToken] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    location: "",
    minPrice: "",
    maxPrice: "",
    minCapacity: "",
    parking: false,
    airConditioning: false,
    catering: false,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const venueCategories = [
    "Wedding Hall",
    "Banquet Hall", 
    "Conference Room",
    "Outdoor Garden",
    "Resort",
    "Hotel",
    "Community Center",
    "Restaurant",
    "Other"
  ];

  useEffect(() => {
    fetchUserToken();
    fetchVenues();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [venues, filters, searchTerm]);

  // Fetch user token from profile/user management API
  const fetchUserToken = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Assuming you have a profile API endpoint
        const response = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.data.success) {
          setUserToken(token);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Token might be invalid, remove it
      localStorage.removeItem("token");
    }
  };

  const fetchVenues = async () => {
    try {
      // Remove authorization header since venue fetching might not require authentication
      const response = await axios.get("http://localhost:3001/api/venues");
      
      // Based on your venueController, it returns venues directly
      setVenues(response.data || []);
    } catch (error) {
      console.error("Fetch venues error:", error);
      toast.error(error.response?.data?.error || "Failed to fetch venues");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = venues;

    // Search term filter - Updated to match your venue structure
    if (searchTerm) {
      filtered = filtered.filter(venue => 
        venue.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venue.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(venue => venue.category === filters.category);
    }

    // Location filter - Updated to match your venue structure
    if (filters.location) {
      filtered = filtered.filter(venue => 
        venue.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Price filters - Updated to match your venue structure (price instead of pricePerDay)
    if (filters.minPrice) {
      filtered = filtered.filter(venue => venue.price >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(venue => venue.price <= parseInt(filters.maxPrice));
    }

    // Capacity filter - Updated to match your venue structure (seating instead of seatingCapacity)
    if (filters.minCapacity) {
      filtered = filtered.filter(venue => venue.seating >= parseInt(filters.minCapacity));
    }

    // Amenity filters - Updated to match your venue structure
    if (filters.parking) {
      filtered = filtered.filter(venue => venue.hasParking);
    }
    if (filters.airConditioning) {
      filtered = filtered.filter(venue => venue.hasAC);
    }
    if (filters.catering) {
      filtered = filtered.filter(venue => venue.hasCatering);
    }

    setFilteredVenues(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      location: "",
      minPrice: "",
      maxPrice: "",
      minCapacity: "",
      parking: false,
      airConditioning: false,
      catering: false,
    });
    setSearchTerm("");
  };

  const handleBookVenue = async (venueId) => {
    // Get fresh token from localStorage
    const currentToken = localStorage.getItem("token");
    console.log("Current token for booking:", currentToken); // Debug log
    console.log("UserToken state:", userToken); // Debug log
    
    // Check if user is logged in
    if (!currentToken) {
      toast.error("Please login to book a venue");
      return;
    }

    // Create a more user-friendly date input
    const selectedDate = prompt("Enter booking date (YYYY-MM-DD):");
    if (!selectedDate) return;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(selectedDate)) {
      toast.error("Please enter date in YYYY-MM-DD format");
      return;
    }

    // Validate date is in the future
    const bookingDate = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      toast.error("Cannot book dates in the past");
      return;
    }

    setBookingLoading(prev => ({ ...prev, [venueId]: true }));

    try {
      console.log("Making booking request with token:", currentToken); // Debug log
      
      const response = await axios.post(
        "http://localhost:3003/api/bookings",
        {
          venue: venueId,
          date: selectedDate,
        },
        {
          headers: { Authorization: `Bearer ${currentToken}` },
        }
      );

      console.log("Booking response:", response.data); // Debug log

      if (response.data.success) {
        toast.success(response.data.message || "Booking request submitted successfully!");
      } else {
        toast.error(response.data.message || "Failed to book venue");
      }
    } catch (error) {
      console.error("Booking error:", error);
      console.error("Error response:", error.response?.data); // Debug log
      
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || "Invalid booking request");
      } else if (error.response?.status === 401) {
        toast.error("Please login to book a venue");
        // Clear invalid token
        localStorage.removeItem("token");
        setUserToken(null);
      } else if (error.response?.status === 404) {
        toast.error("Venue not found");
      } else {
        toast.error(error.response?.data?.message || "Failed to book venue");
      }
    } finally {
      setBookingLoading(prev => ({ ...prev, [venueId]: false }));
    }
  };

  if (loading) {
    return <div className="loading">Loading venues...</div>;
  }

  return (
    <div className="search-venues-container">
      <div className="search-header">
        <h1>Find Your Perfect Venue</h1>
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search venues by name, category, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="search-content">
        <div className="filters-sidebar">
          <div className="filters-header">
            <h3>Filters</h3>
            <button onClick={clearFilters} className="clear-filters">
              Clear All
            </button>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              {venueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Enter location"
            />
          </div>

          <div className="filter-group">
            <label>Price Range (₹/day)</label>
            <div className="price-inputs">
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="Min"
              />
              <span>-</span>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="Max"
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Minimum Capacity</label>
            <input
              type="number"
              name="minCapacity"
              value={filters.minCapacity}
              onChange={handleFilterChange}
              placeholder="Min guests"
            />
          </div>

          <div className="filter-group">
            <label>Amenities</label>
            <div className="amenity-filters">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="parking"
                  checked={filters.parking}
                  onChange={handleFilterChange}
                />
                <span>Parking</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="airConditioning"
                  checked={filters.airConditioning}
                  onChange={handleFilterChange}
                />
                <span>AC</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="catering"
                  checked={filters.catering}
                  onChange={handleFilterChange}
                />
                <span>Catering</span>
              </label>
            </div>
          </div>
        </div>

        <div className="venues-results">
          <div className="results-header">
            <h2>{filteredVenues.length} venues found</h2>
          </div>

          {filteredVenues.length === 0 ? (
            <div className="no-results">
              <p>No venues match your search criteria</p>
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="venues-grid">
              {filteredVenues.map((venue) => (
                <div key={venue._id} className="venue-search-card">
                  <div className="venue-image">
                    {venue.image ? (
                      <img 
                        src={`http://localhost:3001${venue.image}`}
                        alt={venue.title}
                        onError={(e) => {
                          e.target.src = '/placeholder-venue.jpg';
                          e.target.onerror = null;
                        }}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  
                  <div className="venue-info">
                    <div className="venue-header">
                      <h3>{venue.title}</h3>
                      <div className="venue-category">{venue.category}</div>
                    </div>
                    
                    <div className="venue-details">
                      <div className="detail-item">
                        <FaMapMarkerAlt />
                        <span>{venue.location || "Location not specified"}</span>
                      </div>
                      <div className="detail-item">
                        <FaUsers />
                        <span>{venue.seating || "N/A"} guests</span>
                      </div>
                    </div>

                    <div className="venue-amenities">
                      {venue.hasParking && (
                        <span className="amenity">
                          <FaCar /> Parking
                        </span>
                      )}
                      {venue.hasAC && (
                        <span className="amenity">
                          <FaSnowflake /> AC
                        </span>
                      )}
                      {venue.hasCatering && (
                        <span className="amenity">
                          <FaUtensils /> Catering
                        </span>
                      )}
                    </div>

                    <div className="venue-footer">
                      <div className="price">
                        <strong>₹{venue.price || "N/A"}/day</strong>
                      </div>
                      <button 
                        onClick={() => handleBookVenue(venue._id)}
                        className="book-btn"
                        disabled={bookingLoading[venue._id]}
                      >
                        <FaCalendarAlt /> 
                        {bookingLoading[venue._id] ? "Booking..." : "Book Now"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchVenues;