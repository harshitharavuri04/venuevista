import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaUpload } from "react-icons/fa";

const CreateVenue = () => {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    location: "",
    price: "",
    seating: "",
    hasParking: false,
    hasAC: false,
    hasCatering: false,
    ownerContact: "",
    unavailableDates: []
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      setSelectedImage(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    document.getElementById('image-upload').value = '';
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        unavailableDates: [...prev.unavailableDates, selectedDate]
      }));
    }
  };

  const removeDateFromUnavailable = (dateToRemove) => {
    setFormData(prev => ({
      ...prev,
      unavailableDates: prev.unavailableDates.filter(date => date !== dateToRemove)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Venue title is required");
      return false;
    }
    if (!formData.category) {
      toast.error("Please select a category");
      return false;
    }
    if (!formData.location.trim()) {
      toast.error("Location is required");
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error("Please enter a valid price");
      return false;
    }
    if (!formData.seating || formData.seating <= 0) {
      toast.error("Please enter valid seating capacity");
      return false;
    }
    if (!formData.ownerContact.trim()) {
      toast.error("Owner contact is required");
      return false;
    }
    
    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(formData.ownerContact)) {
      toast.error("Please enter a valid contact number");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      // Create FormData for multipart/form-data
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('category', formData.category);
      submitData.append('location', formData.location);
      submitData.append('price', formData.price);
      submitData.append('seating', formData.seating);
      submitData.append('hasParking', formData.hasParking);
      submitData.append('hasAC', formData.hasAC);
      submitData.append('hasCatering', formData.hasCatering);
      submitData.append('ownerContact', formData.ownerContact);
      submitData.append('unavailableDates', JSON.stringify(formData.unavailableDates));
      
      if (selectedImage) {
        submitData.append('image', selectedImage);
      }

      const response = await axios.post(
        "http://localhost:3001/api/venues",
        submitData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
        }
      );
      
      toast.success("Venue created successfully!");
      navigate("/dashboard/my-venues");
    } catch (error) {
      console.error('Error creating venue:', error);
      toast.error(error.response?.data?.error || "Failed to create venue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-venue-container">
      <div className="create-venue-header">
        <h1>Create New Venue</h1>
        <p>Fill in the details to list your venue</p>
      </div>

      <form onSubmit={handleSubmit} className="create-venue-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label>Venue Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Enter venue name"
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Category</option>
              {venueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Location *</label>
            <textarea
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              placeholder="Enter complete address"
              rows="3"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Pricing & Capacity</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Price per Day (₹) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                placeholder="e.g., 25000"
              />
            </div>
            <div className="form-group">
              <label>Seating Capacity *</label>
              <input
                type="number"
                name="seating"
                value={formData.seating}
                onChange={handleInputChange}
                required
                min="1"
                placeholder="e.g., 200"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Contact Information</h2>
          
          <div className="form-group">
            <label>Owner Contact Number *</label>
            <input
              type="tel"
              name="ownerContact"
              value={formData.ownerContact}
              onChange={handleInputChange}
              required
              placeholder="e.g., +91 9876543210"
            />
            <small>This will be used to identify and manage your venues</small>
          </div>
        </div>

        <div className="form-section">
          <h2>Amenities</h2>
          
          <div className="amenities-grid">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="hasParking"
                  checked={formData.hasParking}
                  onChange={handleInputChange}
                />
                <span>Parking Available</span>
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="hasAC"
                  checked={formData.hasAC}
                  onChange={handleInputChange}
                />
                <span>Air Conditioning</span>
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="hasCatering"
                  checked={formData.hasCatering}
                  onChange={handleInputChange}
                />
                <span>Catering Available</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Venue Image</h2>
          
          <div className="image-upload">
            <div className="upload-area">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                id="image-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="image-upload" className="upload-label">
                <FaUpload />
                <span>Upload Venue Image</span>
              </label>
            </div>
            
            {selectedImage && (
              <div className="image-preview">
                <div className="image-item">
                  <img 
                    src={URL.createObjectURL(selectedImage)} 
                    alt="Venue preview" 
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="remove-image"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2>Unavailable Dates (Optional)</h2>
          
          <div className="form-group">
            <label>Select dates when venue is not available</label>
            <input
              type="date"
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {formData.unavailableDates.length > 0 && (
            <div className="unavailable-dates-list">
              <h4>Unavailable Dates:</h4>
              <div className="date-tags">
                {formData.unavailableDates.map((date, index) => (
                  <div key={index} className="date-tag">
                    <span>{new Date(date).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={() => removeDateFromUnavailable(date)}
                      className="remove-date"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/dashboard/my-venues")}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? "Creating..." : "Create Venue"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateVenue;