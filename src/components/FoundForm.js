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
  const [errorMsg, setErrorMsg] = useState('');
  const [matchResult, setMatchResult] = useState(null);
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

    if (!formData.image) {
      setErrorMsg('Please upload an image of the found item.');
      return;
    }

    setLoading(true);
    setMatchResult(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append('location', formData.location || 'Unknown');
      formDataObj.append('image', formData.image);

      const response = await fetch('/api/items/found', {
        method: 'POST',
        body: formDataObj
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMatchResult(data);
      } else {
        setErrorMsg(data.error || 'Failed to submit item. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setErrorMsg('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
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
          <button className="tab-btn" onClick={() => router.push('/report-lost')}>Report a Lost Item</button>
          <button className="tab-btn active">Report a Found Item</button>
          <button className="tab-btn" onClick={() => router.push('/gallery')}>View Lost Items</button>
        </div>

        <div className="form-box" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2>Report a Found Item</h2>
          <p className="form-subtitle">
            Just upload an image! Our AI will automatically detect the object, generate a description, and search for matches.
          </p>

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

          {!matchResult ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Where did you find it? (Optional)</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                >
                  <option value="">Select a location...</option>
                  <option>Lobby / Main Entrance</option>
                  <option>Elevator</option>
                  <option>Parking Area</option>
                  <option>Gym / Fitness Center</option>
                  <option>Swimming Pool</option>
                  <option>Cafeteria / Food Court</option>
                  <option>Library</option>
                  <option>Classroom / Lecture Hall</option>
                  <option>Restroom</option>
                  <option>Corridor / Hallway</option>
                  <option>Reception / Front Desk</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Upload Image of the Found Item *</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="file-input"
                  required
                />
                {formData.image && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#0D9488', fontWeight: 500 }}>
                    ✓ Selected: {formData.image.name}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? '🤖 AI is analyzing and matching...' : 'Analyze and Find Match'}
              </button>
            </form>
          ) : (
            /* ── Match Result ── */
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
              <h3 style={{ color: '#0D9488', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                Item Analyzed Successfully!
              </h3>

              {/* AI result card */}
              <div style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                padding: '1.25rem', borderRadius: '12px', textAlign: 'left', marginBottom: '1.25rem'
              }}>
                <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#334155' }}>
                  <strong>🏷️ AI Detected Item:</strong> {matchResult.item?.item_name}
                </p>
                <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#334155' }}>
                  <strong>📝 Description:</strong> {matchResult.item?.description}
                </p>
                {matchResult.item?.detected_objects?.length > 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                    <strong>🔍 Keywords:</strong> {matchResult.item.detected_objects.map(o => o.name).join(', ')}
                  </p>
                )}
              </div>

              {/* Match result */}
              {matchResult.matches?.length > 0 ? (
                <div style={{
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  padding: '1rem', borderRadius: '10px', color: '#15803D', marginBottom: '1.25rem'
                }}>
                  <strong>🎯 Found {matchResult.matches.length} potential match(es)!</strong>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    The owner has been notified. You can connect with them via chat.
                  </p>
                </div>
              ) : (
                <div style={{
                  background: '#FFFBEB', border: '1px solid #FDE68A',
                  padding: '1rem', borderRadius: '10px', color: '#92400E', marginBottom: '1.25rem'
                }}>
                  <strong>No exact matches found right now.</strong>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    We&apos;ve added this to the database. You&apos;ll be notified if someone reports it lost!
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => { setMatchResult(null); setFormData({ location: '', image: null }); }}
                  style={{
                    padding: '0.75rem 1.5rem', background: '#F1F5F9', color: '#334155',
                    border: '1px solid #E2E8F0', borderRadius: '10px', fontWeight: 600,
                    cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit'
                  }}
                >
                  Report Another
                </button>
                <button onClick={() => router.push('/gallery')} className="btn-submit" style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                  View Gallery
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="form-footer">
        <p>© 2025 Fyndly · AI-Powered Lost &amp; Found Platform</p>
      </footer>
    </div>
  );
}

export default FoundForm;
