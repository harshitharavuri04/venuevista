import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt, FaUsers, FaCar, FaSnowflake, FaUtensils, FaPhone } from "react-icons/fa";
import "../../styles/venue.css";

const MyVenues = () => {
  const [venues, setVenues] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfileAndVenues();
  }, []);

  const fetchUserProfileAndVenues = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // First, fetch user profile to get contact number
          const profileResponse = await fetch("http://localhost:5000/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      
      const profile = profileResponse.data;
      setUserProfile(profile);

      // Check if user has contact number
      if (!profile.contact) {
        toast.error("Please update your profile with contact number to manage venues");
        setLoading(false);
        return;
      }

      // Fetch venues by owner contact
      const venuesResponse = await axios.get(
        `http://localhost:3001/api/venues/owner/${encodeURIComponent(profile.contact)}`, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setVenues(venuesResponse.data.venues || []);

      // Optionally fetch owner statistics
      try {
        const statsResponse = await axios.get(
          `http://localhost:3001/api/venues/owner/${encodeURIComponent(profile.contact)}/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStats(statsResponse.data.statistics);
      } catch (statsError) {
        console.log("Stats not available:", statsError.message);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        toast.error("Please login again");
        navigate("/login");
      } else if (error.response?.status === 404) {
        toast.info("No venues found for your contact number");
        setVenues([]);
      } else {
        toast.error("Failed to fetch venues. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVenue = async (venueId) => {
    if (window.confirm("Are you sure you want to delete this venue?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:3001/api/venues/${venueId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Remove venue from state
        setVenues(venues.filter(venue => venue._id !== venueId));
        
        // Update stats if available
        if (stats) {
          setStats(prev => ({
            ...prev,
            totalVenues: prev.totalVenues - 1,
            venues: prev.venues.filter(v => v.id !== venueId)
          }));
        }
        
        toast.success("Venue deleted successfully");
      } catch (error) {
        console.error("Error deleting venue:", error);
        toast.error("Failed to delete venue");
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading your venues...</div>
      </div>
    );
  }

  // If user doesn't have contact number
  if (!userProfile?.contact) {
    return (
      <div className="my-venues-container">
        <div className="no-contact-warning">
          <h2>Contact Number Required</h2>
          <p>Please update your profile with a contact number to manage venues.</p>
          <Link to="/dashboard/profile" className="update-profile-btn">
            Update Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="my-venues-container">
      <div className="venues-header">
        <div className="header-info">
          <h1>My Venues</h1>
          {userProfile && (
            <div className="owner-info">
              <FaPhone className="contact-icon" />
              <span className="contact-number">{userProfile.contact}</span>
              {stats && (
                <span className="venue-count">({stats.totalVenues} venues)</span>
              )}
            </div>
          )}
        </div>
        <Link to="/dashboard/create-venue" className="create-venue-btn">
          <FaPlus /> Add New Venue
        </Link>
      </div>

      {/* Stats Section */}
      {stats && stats.totalVenues > 0 && (
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{stats.totalVenues}</h3>
              <p>Total Venues</p>
            </div>
            <div className="stat-card">
              <h3>{stats.totalSeating}</h3>
              <p>Total Seating</p>
            </div>
            <div className="stat-card">
              <h3>{formatPrice(stats.averagePrice)}</h3>
              <p>Average Price</p>
            </div>
          </div>
        </div>
      )}

      {venues.length === 0 ? (
        <div className="no-venues">
          <h2>No venues found</h2>
          <p>Start by creating your first venue with your contact number: {userProfile.contact}</p>
          <Link to="/dashboard/create-venue" className="create-first-venue-btn">
            Create Your First Venue
          </Link>
        </div>
      ) : (
        <div className="venues-grid">
          {venues.map((venue) => (
            <div key={venue._id} className="venue-card">
              <div className="venue-image">
                {venue.image ? (
                  <img 
                    src={`http://localhost:3001${venue.image}`} 
                    alt={venue.title}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="no-image" style={{ display: venue.image ? 'none' : 'flex' }}>
                  No Image
                </div>
              </div>
              
              <div className="venue-info">
                <h3>{venue.title}</h3>
                <div className="venue-category">{venue.category}</div>
                
                <div className="venue-details">
                  <div className="detail-item">
                    <FaMapMarkerAlt />
                    <span>{venue.location || "Location not specified"}</span>
                  </div>
                  <div className="detail-item">
                    <FaUsers />
                    <span>{venue.seating} guests</span>
                  </div>
                  <div className="detail-item price">
                    <strong>{formatPrice(venue.price)}/day</strong>
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

                {/* Show unavailable dates if any */}
                {venue.unavailableDates && venue.unavailableDates.length > 0 && (
                  <div className="unavailable-dates-info">
                    <small>Unavailable: {venue.unavailableDates.length} date(s)</small>
                  </div>
                )}

                <div className="venue-actions">
                  <Link 
                    to={`/dashboard/edit-venue/${venue._id}`} 
                    className="action-btn edit-btn"
                  >
                    <FaEdit /> Edit
                  </Link>
                  <button 
                    onClick={() => handleDeleteVenue(venue._id)}
                    className="action-btn delete-btn"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>

                {/* Venue creation date */}
                {venue.createdAt && (
                  <div className="venue-meta">
                    <small>Created: {new Date(venue.createdAt).toLocaleDateString()}</small>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyVenues;