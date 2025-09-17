import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import "../../styles/auth.css";

const Register = () => {
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    username: Yup.string()
      .required("Username is required")
      .min(3, "Username must be at least 3 characters"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
    contact: Yup.string()
      .required("Contact number is required")
      .matches(/^\d{10}$/, "Contact number must be 10 digits"),
    role: Yup.string().required("Role is required"),
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      password: "",
      contact: "",
      role: "BOOKING_USER",
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/auth/register",
          values
        );
        toast.success("Registration successful!");
        localStorage.setItem("token", response.data.token);
        navigate("/dashboard");
      } catch (error) {
        toast.error(error.response?.data?.message || "Registration failed");
      }
    },
  });

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join Venue Vista today</p>
        </div>

        <form onSubmit={formik.handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              {...formik.getFieldProps("username")}
            />
            {formik.touched.username && formik.errors.username && (
              <div className="error-message">{formik.errors.username}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" {...formik.getFieldProps("email")} />
            {formik.touched.email && formik.errors.email && (
              <div className="error-message">{formik.errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              {...formik.getFieldProps("password")}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="error-message">{formik.errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="contact">Contact Number</label>
            <input
              id="contact"
              type="tel"
              {...formik.getFieldProps("contact")}
            />
            {formik.touched.contact && formik.errors.contact && (
              <div className="error-message">{formik.errors.contact}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              {...formik.getFieldProps("role")}
              className="form-control"
            >
              <option value="BOOKING_USER">Booking User</option>
              <option value="VENUE_OWNER">Venue Owner</option>
            </select>
          </div>

          <button type="submit" className="submit-btn">
            Register
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
