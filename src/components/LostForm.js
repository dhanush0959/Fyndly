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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.itemName || !formData.description || !formData.location) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (!formData.image) {
      setErrorMsg('Please upload an image of the item.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('itemName', formData.itemName);
      formDataObj.append('description', formData.description);
      formDataObj.append('location', formData.location);
      formDataObj.append('dateLost', new Date().toISOString().split('T')[0]);
      formDataObj.append('image', formData.image);

      const response = await fetch('/api/items/lost', {
        method: 'POST',
        body: formDataObj
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg('✅ Lost item reported successfully! Redirecting to gallery...');
        setTimeout(() => router.push('/gallery'), 1800);
      } else {
        setErrorMsg(data.error || 'Failed to submit item. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setErrorMsg('Connection error. Please check your internet and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-page">
      <nav className="top-navbar">
        <div className="nav-brand">Fyndly</div>
        <div className="nav-links">
          <span onClick={() => router.push('/dashboard')}>Dashboard</span>
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
          <p className="form-subtitle">Provide details about the item you lost. More detail improves AI match accuracy.</p>

          {/* Error message */}
          {errorMsg && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
              padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem',
              fontSize: '0.875rem', fontWeight: 500
            }}>
              {errorMsg}
            </div>
          )}

          {/* Success message */}
          {successMsg && (
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D',
              padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.25rem',
              fontSize: '0.875rem', fontWeight: 500
            }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Item Name *</label>
              <input
                type="text"
                name="itemName"
                value={formData.itemName}
                onChange={handleChange}
                placeholder="e.g., Black Wallet, iPhone 14, Car Keys"
                required
              />
            </div>

            <div className="form-group">
              <label>Description (color, brand, markings, etc.) *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Describe the item in detail — color, brand, size, any distinguishing marks..."
                required
              />
            </div>

            <div className="form-group">
              <label>Last Seen Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Lobby, Gym, Parking P2, Cafeteria"
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
              {formData.image && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#0D9488', fontWeight: 500 }}>
                  ✓ Selected: {formData.image.name}
                </p>
              )}
            </div>

            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? '⏳ Submitting...' : 'Report Lost Item'}
            </button>
          </form>
        </div>
      </div>

      <footer className="form-footer">
        <p>© 2025 Fyndly · AI-Powered Lost &amp; Found Platform</p>
      </footer>
    </div>
  );
}

export default LostForm;
