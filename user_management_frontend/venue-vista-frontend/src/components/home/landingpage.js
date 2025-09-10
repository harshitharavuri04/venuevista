import React from "react";
import { Link } from "react-router-dom";
import { FaMapMarkerAlt, FaCalendarAlt, FaUsers } from "react-icons/fa";
import { MdSecurity } from "react-icons/md";
import "../../styles/home.css";

const LandingPage = () => {
  return (
    <div className="landing-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Find Your Perfect Venue</h1>
          <p>
            Discover and book amazing venues for your events. From weddings to
            corporate meetings, we've got you covered.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-button primary-button">
              Get Started
            </Link>
            <Link to="/login" className="cta-button secondary-button">
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <FaMapMarkerAlt className="feature-icon" />
            <h3>Location-Based Search</h3>
            <p>
              Find venues near you with our advanced location-based search
              system
            </p>
          </div>
          <div className="feature-card">
            <FaCalendarAlt className="feature-icon" />
            <h3>Real-Time Availability</h3>
            <p>Check venue availability and book instantly</p>
          </div>
          <div className="feature-card">
            <FaUsers className="feature-icon" />
            <h3>Venue Management</h3>
            <p>Easy-to-use tools for venue owners to manage their properties</p>
          </div>
          <div className="feature-card">
            <MdSecurity className="feature-icon" />
            <h3>Secure Booking</h3>
            <p>Safe and secure payment processing for all bookings</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
