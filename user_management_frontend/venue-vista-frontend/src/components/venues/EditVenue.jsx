import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaUpload } from "react-icons/fa";

const EditVenue = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    location: {
      address: "",
      latitude: "",
      longitude: "",
    },
    pricePerDay: "",
    seatingCapacity: "",
    parking: false,
    airConditioning: false,
    catering: false,
    description: "",
    photos: [],
  });
  const [loading, setLoading] = useState(false);
  const [fetchingVenue, setFetchingVenue] = useState(true);
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

  useEffect(() => {
    fetchVenue();
  }, [id]);

  const fetchVenue = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:3001/venues/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const venue = response.data;
      setFormData({
        title: venue.title || "",
        category: venue.category || "",
        location: {
          address: venue.location?.address || "",
          latitude: venue.location?.latitude || "",
          longitude: venue.location?.longitude || "",
        },
        pricePerDay: venue.pricePerDay || "",
        seatingCapacity: venue.seatingCapacity || "",
        parking: venue.parking || false,
        airConditioning: venue.airConditioning || false,
        catering: venue.catering || false,
        description: venue.description || "",
        photos: venue.photos || [],
      });
    } catch (error) {
      toast.error("Failed to fetch venue details");
      navigate("/dashboard/my-venues");
    } finally {
      setFetchingVenue(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.photos.length > 5) {
      toast.error("You can upload maximum 5 photos");
      return;
    }
    
    const photoPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(photoPromises).then(photos => {
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...photos]
      }));
    });
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:3001/venues/${id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      toast.success("Venue updated successfully!");
      navigate("/dashboard/my-venues");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update venue");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingVenue) {
    return <div className="loading">Loading venue details...</div>;
  }

  return (
    <div className="edit-venue-container">
      <div className="edit-venue-header">
        <h1>Edit Venue</h1>
        <p>Update your venue details</p>
      </div>

      <form onSubmit={handleSubmit} className="edit-venue-form">
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
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your venue..."
              rows="4"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Location</h2>
          
          <div className="form-group">
            <label>Address *</label>
            <textarea
              name="location.address"
              value={formData.location.address}
              onChange={handleInputChange}
              required
              placeholder="Enter complete address"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input
                type="number"
                name="location.latitude"
                value={formData.location.latitude}
                onChange={handleInputChange}
                placeholder="e.g., 17.4065"
                step="any"
              />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input
                type="number"
                name="location.longitude"
                value={formData.location.longitude}
                onChange={handleInputChange}
                placeholder="e.g., 78.4772"
                step="any"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Pricing & Capacity</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Price per Day (₹) *</label>
              <input
                type="number"
                name="pricePerDay"
                value={formData.pricePerDay}
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
                name="seatingCapacity"
                value={formData.seatingCapacity}
                onChange={handleInputChange}
                required
                min="1"
                placeholder="e.g., 200"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Amenities</h2>
          
          <div className="amenities-grid">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="parking"
                  checked={formData.parking}
                  onChange={handleInputChange}
                />
                <span>Parking Available</span>
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="airConditioning"
                  checked={formData.airConditioning}
                  onChange={handleInputChange}
                />
                <span>Air Conditioning</span>
              </label>
            </div>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="catering"
                  checked={formData.catering}
                  onChange={handleInputChange}
                />
                <span>Catering Available</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Photos</h2>
          
          <div className="photo-upload">
            <div className="upload-area">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                id="photo-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="photo-upload" className="upload-label">
                <FaUpload />
                <span>Upload Photos (Max 5)</span>
              </label>
            </div>
            
            {formData.photos.length > 0 && (
              <div className="photo-preview">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="photo-item">
                    <img src={photo} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="remove-photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            {loading ? "Updating..." : "Update Venue"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditVenue;