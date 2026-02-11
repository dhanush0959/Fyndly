import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './styles/FoundForm.css';

function FoundForm() {
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    location: '',
    image: null
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.itemName || !formData.description || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.image) {
      alert('Please upload an image of the item');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      navigate('/');
      return;
    }

    try {
      // Create FormData for file upload
      const formDataObj = new FormData();
      formDataObj.append('itemName', formData.itemName);
      formDataObj.append('description', formData.description);
      formDataObj.append('location', formData.location);
      formDataObj.append('dateFound', new Date().toISOString().split('T')[0]);
      formDataObj.append('image', formData.image);

      const response = await fetch('http://localhost:5000/api/items/found', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const matchMsg = data.matchesFound > 0 
          ? `Found ${data.matchesFound} potential match(es)!` 
          : 'No matches found yet.';
        alert(`Found item reported successfully!\n${matchMsg}\n\nDetected objects: ${data.item.detectedObjects.slice(0, 5).map(o => o.description || o.name).join(', ')}`);
        navigate('/gallery');
      } else {
        alert(data.error || 'Failed to submit item. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Connection error. Please make sure the backend server is running.');
    }
  };

  return (
    <div className="form-page">
      <nav className="top-navbar">
        <div className="nav-brand">The Grandview</div>
        <div className="nav-links">
          <span>Welcome to The Grandview</span>
          <ThemeToggle />
          <span onClick={() => navigate('/dashboard')}>Home</span>
        </div>
      </nav>

      <div className="form-container">
        <div className="tab-navigation">
          <button className="tab-btn" onClick={() => navigate('/report-lost')}>Report a Lost Item</button>
          <button className="tab-btn active">Report a Found Item</button>
          <button className="tab-btn" onClick={() => navigate('/gallery')}>View Lost Items</button>
        </div>

        <div className="form-box">
          <h2>Report a Found Item</h2>
          <p className="form-subtitle">Found something? Help it find its way back home. Our AI will try to find a match.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Item Name</label>
              <input
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description (color, brand, condition)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Found Location (e.g., Elevator B, Pool Area)</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Upload Image of the Item</label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="file-input"
              />
            </div>

            <button type="submit" className="btn-submit">Analyze and Find Match</button>
          </form>
        </div>
      </div>

      <footer className="form-footer">
        <p>© 2025 The Grandview Residences</p>
        <p>For urgent matters, please contact the front desk at 9505640179.</p>
      </footer>
    </div>
  );
}

export default FoundForm;
