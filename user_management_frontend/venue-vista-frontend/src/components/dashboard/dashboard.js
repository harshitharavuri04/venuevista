import React, { useEffect, useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import axios from "axios";
import Navbar from "./navbar";
import MyVenues from "../venues/MyVenues";
import CreateVenue from "../venues/CreateVenue";
import EditVenue from "../venues/EditVenue";
import SearchVenues from "../venues/SearchVenues";
import MyBookings from "../bookings/MyBookings";
import Profile from "./profile";
import "../../styles/dashboard.css";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/auth/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchUserProfile();
  }, [navigate]);

  if (!user) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <Navbar user={user} />
      <main className="dashboard-content">
        <Routes>
          <Route path="/" element={<DashboardHome user={user} />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<SearchVenues />} />
          <Route path="/bookings" element={<MyBookings />} />
          {user?.role === "VENUE_OWNER" && (
            <>
              <Route path="/my-venues" element={<MyVenues />} />
              <Route path="/create-venue" element={<CreateVenue />} />
              <Route path="/edit-venue/:id" element={<EditVenue />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
};

// Dashboard Home Component
const DashboardHome = ({ user }) => {
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Fetching dashboard data for user:", user);

        const requests = [];

        // Venues based on role
        if (user.role === "VENUE_OWNER") {
          requests.push(
            axios.get(
              `http://localhost:3001/api/venues/owner/${user.contact}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
          );
        } else {
          requests.push(
            axios.get("http://localhost:3001/api/venues", {
              headers: { Authorization: `Bearer ${token}` },
            })
          );
        }

        // Use new bookings API
        requests.push(
          axios.get("http://localhost:3003/api/bookings", {
            headers: { Authorization: `Bearer ${token}` },
          })
        );

        const responses = await Promise.allSettled(requests);

        // Venues response
        const venuesResponse = responses[0];
        if (venuesResponse.status === "fulfilled") {
          const venuesData = Array.isArray(venuesResponse.value.data)
            ? venuesResponse.value.data
            : [];
          setVenues(
            user.role === "VENUE_OWNER" ? venuesData : venuesData.slice(0, 6)
          );
        } else {
          setVenues([]);
        }

        // Bookings response (ignore Cancelled)
        const bookingsResponse = responses[1];
        if (bookingsResponse.status === "fulfilled") {
          let bookingsData = bookingsResponse.value.data?.data || []; // API returns { success, data, pagination }
          bookingsData = bookingsData.filter(
            (b) =>
              b.status &&
              ["PENDING", "CONFIRMED"].includes(b.status.toUpperCase())
          );
          setBookings(bookingsData.slice(0, 5)); // recent 5
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setVenues([]);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.contact) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user?.role, user?.contact]);

  const handleVenueClick = (venueId) => {
    navigate(`/venue/${venueId}`);
  };

  const handleBookingClick = (bookingId) => {
    navigate(`/booking/${bookingId}`);
  };

  if (loading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  const pendingBookings = bookings.filter(
    (b) => b.status?.toUpperCase() === "PENDING"
  ).length;
  const confirmedBookings = bookings.filter(
    (b) => b.status?.toUpperCase() === "CONFIRMED"
  ).length;

  return (
    <div className="dashboard-home">
      {/* Welcome */}
      <div className="welcome-section">
        <h1>Welcome back, {user.username}!</h1>
        <p>
          {user.role === "VENUE_OWNER"
            ? "Manage your venues and track bookings"
            : "Discover and book amazing venues for your events"}
        </p>
      </div>

      {/* Stats */}
      <div className="quick-stats">
        {user.role === "VENUE_OWNER" ? (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{venues.length}</h3>
              <p>Total Venues</p>
            </div>
            <div className="stat-card">
              <h3>{pendingBookings}</h3>
              <p>Pending Bookings</p>
            </div>
            <div className="stat-card">
              <h3>{confirmedBookings}</h3>
              <p>Confirmed Bookings</p>
            </div>
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{bookings.length}</h3>
              <p>Your Bookings</p>
            </div>
            <div className="stat-card">
              <h3>{confirmedBookings}</h3>
              <p>Confirmed</p>
            </div>
            <div className="stat-card">
              <h3>{pendingBookings}</h3>
              <p>Pending</p>
            </div>
          </div>
        )}
      </div>

      {/* Venues */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>
            {user.role === "VENUE_OWNER" ? "Your Venues" : "Featured Venues"}
          </h2>
          <button
            className="view-all-btn"
            onClick={() =>
              navigate(
                user.role === "VENUE_OWNER"
                  ? "/dashboard/my-venues"
                  : "/dashboard/search"
              )
            }
          >
            View All
          </button>
        </div>
        {venues.length > 0 ? (
          <div className="venues-grid">
            {venues.map((venue) => (
              <div key={venue._id} className="venue-search-card">
                <div className="venue-image">
                  {venue.image ? (
                    <img
                      src={`http://localhost:3001${venue.image}`}
                      alt={venue.title}
                      onError={(e) => {
                        e.target.src = "/placeholder-venue.jpg";
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
                      <span>📍</span>
                      <span>{venue.location || "Location not specified"}</span>
                    </div>
                    <div className="detail-item">
                      <span>👥</span>
                      <span>{venue.seating || "N/A"} guests</span>
                    </div>
                  </div>
                  <div className="venue-amenities">
                    {venue.hasParking && (
                      <span className="amenity">🚗 Parking</span>
                    )}
                    {venue.hasAC && <span className="amenity">❄️ AC</span>}
                    {venue.hasCatering && (
                      <span className="amenity">🍽️ Catering</span>
                    )}
                  </div>
                  <div className="venue-footer">
                    <div className="price">
                      <strong>₹{venue.price || "N/A"}/day</strong>
                    </div>
                    <button
                      onClick={() => handleVenueClick(venue._id)}
                      className="book-btn"
                    >
                      {user.role === "VENUE_OWNER"
                        ? "View Details"
                        : "Book Now"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>
              {user.role === "VENUE_OWNER"
                ? "You haven't created any venues yet."
                : "No featured venues available at the moment."}
            </p>
            {user.role === "VENUE_OWNER" && (
              <button
                className="cta-btn"
                onClick={() => navigate("/dashboard/create-venue")}
              >
                Create Your First Venue
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bookings */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Bookings</h2>
          <button
            className="view-all-btn"
            onClick={() => navigate("/dashboard/bookings")}
          >
            View All
          </button>
        </div>
        {bookings.length > 0 ? (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="booking-card"
                onClick={() => handleBookingClick(booking._id)}
              >
                <div className="booking-info">
                  <h3>
                    {booking.venue?.title ||
                      booking.venueName ||
                      "Unknown Venue"}
                  </h3>
                  <p className="booking-date">
                    {booking.eventDate
                      ? new Date(booking.eventDate).toLocaleDateString()
                      : "No date"}
                  </p>
                  <p className="booking-details">
                    {booking.eventType || "Event"} • {booking.guestCount || 0}{" "}
                    guests
                  </p>
                </div>
                <div className="booking-status">
                  <span
                    className={`status-badge ${
                      booking.status ? booking.status.toLowerCase() : "pending"
                    }`}
                  >
                    {booking.status || "PENDING"}
                  </span>
                  <div className="booking-amount">
                    ₹{booking.totalAmount || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No active bookings found.</p>
            {user.role !== "VENUE_OWNER" && (
              <button
                className="cta-btn"
                onClick={() => navigate("/dashboard/search")}
              >
                Browse Venues
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
