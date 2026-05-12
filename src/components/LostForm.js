'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import './styles/LostForm.css';

function LostForm() {
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    location: '',
    image: null
  });
  const router = useRouter();

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
      router.push('/');
      return;
    }

    try {
      // Create FormData for file upload
      const formDataObj = new FormData();
      formDataObj.append('itemName', formData.itemName);
      formDataObj.append('description', formData.description);
      formDataObj.append('location', formData.location);
      formDataObj.append('dateLost', new Date().toISOString().split('T')[0]);
      formDataObj.append('image', formData.image);

      const response = await fetch('/api/items/lost', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const detected = data.item.detectedObjects || data.item.detected_objects || [];
        const matchMsg = data.matchesFound > 0 
          ? `Found ${data.matchesFound} potential match(es)!` 
          : 'No matches found yet.';
        const objectsMsg = detected.length > 0 
          ? `\n\nDetected objects: ${detected.slice(0, 5).map(o => o.description || o.name).join(', ')}`
          : '';
        alert(`Lost item reported successfully!\n${matchMsg}${objectsMsg}`);
        router.push('/gallery');
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

          <span onClick={() => router.push('/dashboard')}>Home</span>
        </div>
      </nav>

      <div className="form-container">
        <div className="tab-navigation">
          <button className="tab-btn active">Report a Lost Item</button>
          <button className="tab-btn" onClick={() => router.push('/report-found')}>Report a Found Item</button>
          <button className="tab-btn" onClick={() => router.push('/gallery')}>View Lost Items</button>
        </div>

        <div className="form-box">
          <h2>Report a Lost Item</h2>
          <p className="form-subtitle">Provide details about the item you lost within the premises. More detail improves match accuracy.</p>
          
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
              <label>Description (color, brand, etc.)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Last Seen Location (e.g., Lobby, Gym, Parking P2)</label>
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
              {formData.image && <p style={{marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--primary-color)'}}>Selected: {formData.image.name}</p>}
            </div>

            <button type="submit" className="btn-submit">Report Lost Item</button>
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

export default LostForm;
