import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaTimes, FaCheck, FaClock } from "react-icons/fa";
import "../../styles/bookings.css";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, confirmed, cancelled
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    count: 0,
    totalBookings: 0
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchBookings();
  }, [filter, currentPage]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      // Add status filter if not 'all'
      if (filter !== 'all') {
        params.append('status', filter.charAt(0).toUpperCase() + filter.slice(1));
      }

      const response = await axios.get(`http://localhost:3003/api/bookings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setBookings(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error("Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Fetch bookings error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.put(
          `http://localhost:3003/api/bookings/${bookingId}/cancel`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (response.data.success) {
          // Update the booking status in the local state
          setBookings(prevBookings =>
            prevBookings.map(booking =>
              booking._id === bookingId
                ? { ...booking, status: "Cancelled" }
                : booking
            )
          );
          
          toast.success(response.data.message || "Booking cancelled successfully");
        }
      } catch (error) {
        console.error("Cancel booking error:", error);
        toast.error(error.response?.data?.message || "Failed to cancel booking");
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <FaClock className="status-icon pending" />;
      case "Confirmed":
        return <FaCheck className="status-icon confirmed" />;
      case "Cancelled":
        return <FaTimes className="status-icon cancelled" />;
      default:
        return <FaClock className="status-icon pending" />;
    }
  };

  const getStatusClass = (status) => {
    return status.toLowerCase();
  };

  const getBookingCounts = () => {
    // Since we're using server-side filtering, we need to make separate calls or store counts
    // For now, we'll show the current filter count
    return {
      all: pagination.totalBookings || bookings.length,
      pending: filter === 'pending' ? bookings.length : 0,
      confirmed: filter === 'confirmed' ? bookings.length : 0,
      cancelled: filter === 'cancelled' ? bookings.length : 0
    };
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <div className="loading">Loading your bookings...</div>;
  }

  const counts = getBookingCounts();

  return (
    <div className="my-bookings-container">
      <div className="bookings-header">
        <h1>My Bookings</h1>
        <div className="booking-filters">
          <button
            onClick={() => handleFilterChange("all")}
            className={filter === "all" ? "active" : ""}
          >
            All ({pagination.totalBookings || 0})
          </button>
          <button
            onClick={() => handleFilterChange("pending")}
            className={filter === "pending" ? "active" : ""}
          >
            Pending
          </button>
          <button
            onClick={() => handleFilterChange("confirmed")}
            className={filter === "confirmed" ? "active" : ""}
          >
            Confirmed
          </button>
          <button
            onClick={() => handleFilterChange("cancelled")}
            className={filter === "cancelled" ? "active" : ""}
          >
            Cancelled
          </button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="no-bookings">
          <h2>No bookings found</h2>
          <p>
            {filter === "all"
              ? "You haven't made any bookings yet"
              : `No ${filter} bookings found`}
          </p>
        </div>
      ) : (
        <>
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking._id} className="booking-card">
                <div className="booking-header">
                  <div className="venue-info">
                    <h3>{booking.venue?.title || "Venue Title"}</h3>
                    <div className="venue-category">
                      {booking.venue?.category || "Category"}
                    </div>
                  </div>
                  <div className={`booking-status ${getStatusClass(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    <span>{booking.status}</span>
                  </div>
                </div>

                <div className="booking-details">
                  <div className="detail-row">
                    <div className="detail-item">
                      <FaCalendarAlt />
                      <div>
                        <strong>Booking Date</strong>
                        <span>{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FaUsers />
                      <div>
                        <strong>Capacity</strong>
                        <span>{booking.venue?.seatingCapacity || "N/A"} guests</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-row">
                    <div className="detail-item location">
                      <FaMapMarkerAlt />
                      <div>
                        <strong>Location</strong>
                        <span>{booking.venue?.location?.address || "Address not available"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-row">
                    <div className="detail-item">
                      <strong>Price per Day:</strong>
                      <span className="price">₹{booking.venue?.pricePerDay || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Payment Status:</strong>
                      <span className={`payment-status ${booking.paymentStatus?.toLowerCase() || 'pending'}`}>
                        {booking.paymentStatus || "Pending"}
                      </span>
                    </div>
                  </div>

                  {booking.venue?.photos && booking.venue.photos.length > 0 && (
                    <div className="venue-image">
                      <img 
                        src={booking.venue.photos[0]} 
                        alt={booking.venue.title}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="booking-actions">
                  <div className="booking-meta">
                    <small>
                      Booked on: {new Date(booking.createdAt || booking.date).toLocaleDateString()}
                    </small>
                  </div>
                  
                  {booking.status === "Pending" && (
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="cancel-btn"
                    >
                      <FaTimes /> Cancel Booking
                    </button>
                  )}
                  
                  {booking.status === "Confirmed" && booking.paymentStatus === "Pending" && (
                    <button className="pay-btn">
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {pagination.current} of {pagination.total} 
                ({pagination.totalBookings} total bookings)
              </span>
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= pagination.total}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyBookings;