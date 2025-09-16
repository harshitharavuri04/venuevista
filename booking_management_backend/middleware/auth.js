const axios = require("axios");
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    try {
      // Option 1: Verify token with User Management Service
      const response = await axios.get(
        "http://localhost:5000/api/auth/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      // Set user data from user service response
      req.user = {
        _id: response.data._id,
        id: response.data._id, // For backward compatibility
        username: response.data.username,
        email: response.data.email,
        contact: response.data.contact,
        role: response.data.role,
        profilePicture: response.data.profilePicture,
        bookings: response.data.bookings,
      };

      next();
    } catch (serviceError) {
      // Fallback: Local JWT verification if user service is down
      console.warn(
        "User service unavailable, falling back to local verification"
      );

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          _id: decoded.id,
          id: decoded.id,
          role: decoded.role || "BOOKING_USER",
        };
        next();
      } catch (jwtError) {
        return res.status(401).json({
          success: false,
          message: "Invalid token.",
        });
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error.",
    });
  }
};

module.exports = authMiddleware;
