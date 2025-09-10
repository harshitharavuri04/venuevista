// Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import "../../styles/navbar.css";

const Navbar = ({ user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-content">
        <Link to="/dashboard" className="nav-logo">
          Venue Vista
        </Link>

        <div className="nav-links">
          <Link to="/dashboard/search" className="nav-link">
            Search Venues
          </Link>

          {user?.role === "VENUE_OWNER" && (
            <Link to="/dashboard/my-venues" className="nav-link">
              My Venues
            </Link>
          )}

          <Link to="/dashboard/bookings" className="nav-link">
            My Bookings
          </Link>

          <div className="profile-container" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="profile-button"
            >
              <FaUserCircle className="profile-icon" />
              <span>{user?.username || "Profile"}</span>
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <Link to="/dashboard/profile" className="dropdown-item">
                  <FaUser className="dropdown-icon" />
                  Profile
                </Link>
                <button onClick={handleLogout} className="dropdown-item">
                  <FaSignOutAlt className="dropdown-icon" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};



export default Navbar;
