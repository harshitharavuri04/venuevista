import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope,FaPhone } from "react-icons/fa";
import "../../styles/navbar.css";
// Profile.jsx
const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-photo-container">
            {profile?.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt="Profile"
                className="profile-photo"
              />
            ) : (
              <FaUser className="default-profile-icon" />
            )}
          </div>
          <div className="profile-title">
            <h1>{profile?.username}</h1>
            <p className="profile-role">{profile?.role}</p>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-info">
            <div className="info-item">
              <FaEnvelope className="info-icon" />
              <div className="info-text">
                <label>Email</label>
                <p>{profile?.email}</p>
              </div>
            </div>

            <div className="info-item">
              <FaPhone className="info-icon" />
              <div className="info-text">
                <label>Contact</label>
                <p>{profile?.contact}</p>
              </div>
            </div>
          </div>

          {profile?.bookings?.length > 0 && (
            <div className="bookings-section">
              <h2>Recent Bookings</h2>
              <div className="bookings-list">
                {profile.bookings.map((booking) => (
                  <div key={booking._id} className="booking-item">
                    <p>Booking ID: {booking._id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Profile;