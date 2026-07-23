'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import './styles/LostForm.css';

function LostForm() {
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    location: '',
    dateLost: new Date().toISOString().split('T')[0],
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, image: file });
    setErrorMsg('');
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.itemName || !formData.description || !formData.location) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      setLoadingStage('📤 Uploading your report...');
      await new Promise(r => setTimeout(r, 400));

      setLoadingStage('🤖 AI is standardizing your description for optimal matching...');

      const formDataObj = new FormData();
      formDataObj.append('itemName', formData.itemName);
      formDataObj.append('description', formData.description);
      formDataObj.append('location', formData.location);
      formDataObj.append('dateLost', formData.dateLost);
      if (formData.image) {
        formDataObj.append('image', formData.image);
      }

      const response = await fetch('/api/items/lost', {
        method: 'POST',
        body: formDataObj
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data);
      } else {
        setErrorMsg(data.error || 'Failed to submit item. Please try again.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setErrorMsg('Connection error. Please check your internet and try again.');
    } finally {
      setIsSubmitting(false);
      setLoadingStage('');
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
          {!result ? (
            <>
              <h2>Report a Lost Item</h2>
              <p className="form-subtitle">
                Describe your item in as much detail as possible — colors, brand, scratches, stickers, contents.
                The more detail you provide, the better our AI can match it when someone finds it.
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

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    placeholder="e.g., Black Sony WH-1000XM4 Headphones, Brown Leather Wallet"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Detailed Description (color, brand, markings, contents, etc.) *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Describe everything you can remember: exact color shade, brand, model, size, any scratches, stickers, dents, what was inside, any engravings or text on it..."
                    required
                    maxLength={5000}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'right', marginTop: '0.25rem' }}>
                    {formData.description.length} / 5000 characters
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Last Seen Location *</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Library 2nd Floor, Cafeteria"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date Lost</label>
                    <input
                      type="date"
                      name="dateLost"
                      value={formData.dateLost}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Upload Reference Image (Optional but recommended)</label>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '0.5rem' }}>
                    Upload a photo of your item or a similar product image — this significantly improves match accuracy.
                  </p>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="file-input"
                  />
                  {imagePreview && (
                    <div style={{
                      marginTop: '0.75rem', borderRadius: '12px', overflow: 'hidden',
                      border: '2px solid #E2E8F0', maxHeight: '200px'
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Reference" style={{
                        width: '100%', maxHeight: '200px', objectFit: 'cover'
                      }} />
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? loadingStage : '📢 Report Lost Item'}
                </button>

                {isSubmitting && (
                  <div style={{
                    textAlign: 'center', marginTop: '1rem', padding: '1rem',
                    background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0'
                  }}>
                    <div style={{
                      width: '2rem', height: '2rem', border: '3px solid #CCFBF1',
                      borderTopColor: '#0D9488', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem'
                    }} />
                    <p style={{ fontSize: '0.85rem', color: '#0D9488', fontWeight: 500 }}>
                      {loadingStage}
                    </p>
                  </div>
                )}
              </form>
            </>
          ) : (
            /* ── Result Display ── */
            <div style={{ padding: '0.5rem 0' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>✅</div>
                <h3 style={{ color: '#0D9488', fontSize: '1.25rem' }}>
                  Lost Item Reported Successfully!
                </h3>
              </div>

              {/* AI Profile Card */}
              {result.item?.ai_profile && (
                <div style={{
                  background: '#F8FAFC', border: '1px solid #E2E8F0',
                  padding: '1.25rem', borderRadius: '12px', marginBottom: '1.25rem'
                }}>
                  <h4 style={{ color: '#0D9488', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                    🤖 AI Standardized Profile
                  </h4>
                  <div style={{ display: 'grid', gap: '0.4rem', fontSize: '0.88rem', color: '#334155' }}>
                    <p><strong>📂 Category:</strong> {result.item.category}</p>
                    <p><strong>🏷️ Item Type:</strong> {result.item.ai_profile.item_type}</p>
                    <p><strong>🎨 Color:</strong> {result.item.ai_profile.primary_color}
                      {result.item.ai_profile.secondary_color && result.item.ai_profile.secondary_color !== 'None'
                        ? ` / ${result.item.ai_profile.secondary_color}` : ''}</p>
                    <p><strong>🏪 Brand:</strong> {result.item.ai_profile.brand || 'Unknown'}</p>
                    {result.item.ai_profile.distinguishing_marks && (
                      <p><strong>✨ Distinguishing Marks:</strong> {result.item.ai_profile.distinguishing_marks}</p>
                    )}
                  </div>
                  {result.item.ai_profile.searchable_tags?.length > 0 && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {result.item.ai_profile.searchable_tags.map((tag, i) => (
                        <span key={i} style={{
                          background: '#CCFBF1', color: '#0D9488', padding: '0.2rem 0.6rem',
                          borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Matching Pipeline Results */}
              <div style={{
                background: '#F0F9FF', border: '1px solid #BAE6FD',
                padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem',
                fontSize: '0.85rem', color: '#0369A1'
              }}>
                <strong>🔍 Reverse Matching Pipeline:</strong>
                <p style={{ marginTop: '0.375rem' }}>
                  Checked {result.matching?.tier1_candidates || 0} existing found items →{' '}
                  {result.matching?.tier2_candidates || 0} tag-matched →{' '}
                  {result.matching?.final_matches || 0} AI-confirmed match(es)
                </p>
              </div>

              {/* Match Results */}
              {result.matching?.matches?.length > 0 ? (
                <div style={{
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  padding: '1rem', borderRadius: '10px', color: '#15803D', marginBottom: '1.25rem'
                }}>
                  <strong>🎯 Great news! We found {result.matching.matches.length} item(s) that may be yours!</strong>
                  {result.matching.matches.map((match, idx) => (
                    <div key={idx} style={{
                      marginTop: '0.75rem', padding: '0.75rem', background: '#FFF',
                      borderRadius: '8px', border: '1px solid #BBF7D0'
                    }}>
                      <p style={{ fontWeight: 600, color: '#166534' }}>
                        Match #{idx + 1}: &ldquo;{match.foundItemName}&rdquo;
                      </p>
                      <p style={{ fontSize: '0.82rem', color: '#15803D', marginTop: '0.25rem' }}>
                        Confidence: {match.confidence}%
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>
                        {match.reasoning}
                      </p>
                    </div>
                  ))}
                  <p style={{ fontSize: '0.82rem', marginTop: '0.75rem' }}>
                    Go to your Dashboard to verify ownership and connect with the finder!
                  </p>
                </div>
              ) : (
                <div style={{
                  background: '#FFFBEB', border: '1px solid #FDE68A',
                  padding: '1rem', borderRadius: '10px', color: '#92400E', marginBottom: '1.25rem'
                }}>
                  <strong>No matching found items in the system yet.</strong>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    Don&apos;t worry! You&apos;ll be notified instantly when someone reports finding an item that matches yours.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => { setResult(null); setFormData({ itemName: '', description: '', location: '', dateLost: new Date().toISOString().split('T')[0], image: null }); setImagePreview(null); }}
                  style={{
                    padding: '0.75rem 1.5rem', background: '#F1F5F9', color: '#334155',
                    border: '1px solid #E2E8F0', borderRadius: '10px', fontWeight: 600,
                    cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit'
                  }}
                >
                  Report Another
                </button>
                <button onClick={() => router.push('/dashboard')} className="btn-submit" style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                  Dashboard
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

export default LostForm;
