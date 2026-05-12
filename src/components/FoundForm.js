'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import './styles/FoundForm.css';

function FoundForm() {
  const [formData, setFormData] = useState({
    location: '',
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      alert('Please upload an image of the item');
      return;
    }

    setLoading(true);
    setMatchResult(null);

    const token = localStorage.getItem('token') || 'dummy';

    try {
      const formDataObj = new FormData();
      formDataObj.append('location', formData.location || 'Unknown');
      formDataObj.append('image', formData.image);

      const response = await fetch('/api/items/found', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataObj
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMatchResult(data);
      } else {
        alert(data.error || 'Failed to submit item.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Connection error. Please make sure the backend server is running.');
    }
    setLoading(false);
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
          <button className="tab-btn" onClick={() => router.push('/report-lost')}>Report a Lost Item</button>
          <button className="tab-btn active">Report a Found Item</button>
          <button className="tab-btn" onClick={() => router.push('/gallery')}>View Lost Items</button>
        </div>

        <div className="form-box" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2>Report a Found Item</h2>
          <p className="form-subtitle">
            Just upload an image! Our AI will automatically detect the object, generate a description, and search for matches.
          </p>
          
          {!matchResult ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Found Location (Optional)</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Elevator B, Pool Area"
                />
              </div>

              <div className="form-group">
                <label>Upload Image</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="file-input"
                  required
                />
              </div>

              <button type="submit" className="btn-submit" disabled={loading} style={{ background: loading ? '#6b7280' : '#10b981' }}>
                {loading ? 'AI is analyzing and matching...' : 'Analyze and Find Match'}
              </button>
            </form>
          ) : (
            <div className="success-container" style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>Item Analyzed Successfully!</h3>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', textAlign: 'left', marginBottom: '1.5rem' }}>
                <p><strong>AI Detected Item:</strong> {matchResult.item?.item_name}</p>
                <p><strong>AI Generated Description:</strong> {matchResult.item?.description}</p>
                <p><strong>Keywords:</strong> {matchResult.item?.detected_objects?.map(o => o.name).join(', ')}</p>
              </div>

              {matchResult.matches?.length > 0 ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '1rem', borderRadius: '8px', color: '#10b981' }}>
                  <strong>We found {matchResult.matches.length} potential match(es)!</strong>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>The person who lost this item has been notified. You can now connect via chat.</p>
                </div>
              ) : (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', padding: '1rem', borderRadius: '8px', color: '#f59e0b' }}>
                  <strong>No exact matches found right now.</strong>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>We&apos;ve added this to the database. We&apos;ll notify you if someone reports it lost!</p>
                </div>
              )}

              <button onClick={() => router.push('/gallery')} className="btn-submit" style={{ marginTop: '2rem' }}>
                View in Gallery
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="form-footer">
        <p>© 2025 The Grandview Residences</p>
      </footer>
    </div>
  );
}

export default FoundForm;
