'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import './styles/FoundForm.css';

function FoundForm() {
  const [formData, setFormData] = useState({
    location: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
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

    if (!formData.image) {
      setErrorMsg('Please upload an image of the found item.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Stage indicators for UX
      setLoadingStage('📤 Uploading image...');
      await new Promise(r => setTimeout(r, 500));

      setLoadingStage('🤖 AI is analyzing the item (detecting objects, colors, brand, text)...');

      const formDataObj = new FormData();
      formDataObj.append('location', formData.location || 'Unknown');
      formDataObj.append('image', formData.image);

      const response = await fetch('/api/items/found', {
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
      setLoading(false);
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
          <button className="tab-btn" onClick={() => router.push('/report-lost')}>Report a Lost Item</button>
          <button className="tab-btn active">Report a Found Item</button>
          <button className="tab-btn" onClick={() => router.push('/gallery')}>View Lost Items</button>
        </div>

        <div className="form-box" style={{ maxWidth: '650px', margin: '0 auto' }}>
          <h2>Report a Found Item</h2>
          <p className="form-subtitle">
            Just upload a photo and select the location — our AI handles the rest!
            It will automatically detect the object, generate a detailed description, and search for matches.
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

          {!result ? (
            <form onSubmit={handleSubmit}>
              {/* Image Upload with Preview */}
              <div className="form-group">
                <label>Upload Image of the Found Item *</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="file-input"
                  required
                />
                {imagePreview && (
                  <div style={{
                    marginTop: '0.75rem', borderRadius: '12px', overflow: 'hidden',
                    border: '2px solid #E2E8F0', maxHeight: '250px'
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Preview" style={{
                      width: '100%', maxHeight: '250px', objectFit: 'cover'
                    }} />
                  </div>
                )}
              </div>

              {/* Location Dropdown */}
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

              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? loadingStage : '🔍 Analyze & Find Match'}
              </button>

              {loading && (
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
                  <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem' }}>
                    This may take 10-20 seconds as Gemini analyzes the image...
                  </p>
                </div>
              )}
            </form>
          ) : (
            /* ── Result Display ── */
            <div style={{ padding: '0.5rem 0' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>🎉</div>
                <h3 style={{ color: '#0D9488', fontSize: '1.25rem' }}>
                  Item Analyzed Successfully!
                </h3>
              </div>

              {/* AI Analysis Card */}
              <div style={{
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                padding: '1.25rem', borderRadius: '12px', marginBottom: '1.25rem'
              }}>
                <h4 style={{ color: '#0D9488', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                  🤖 AI Detection Results
                </h4>
                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.88rem', color: '#334155' }}>
                  <p><strong>🏷️ Item Type:</strong> {result.item?.ai_analysis?.item_type || result.item?.item_name}</p>
                  <p><strong>📂 Category:</strong> {result.item?.category}</p>
                  <p><strong>🎨 Color:</strong> {result.item?.ai_analysis?.primary_color}
                    {result.item?.ai_analysis?.secondary_color && result.item?.ai_analysis?.secondary_color !== 'None'
                      ? ` / ${result.item.ai_analysis.secondary_color}` : ''}</p>
                  <p><strong>🏪 Brand:</strong> {result.item?.ai_analysis?.brand || 'Unknown'}</p>
                  <p><strong>🔧 Material:</strong> {result.item?.ai_analysis?.material || 'Unknown'}</p>
                  <p><strong>📋 Condition:</strong> {result.item?.ai_analysis?.condition || 'N/A'}</p>
                  {result.item?.ai_analysis?.ocr_text_found && result.item.ai_analysis.ocr_text_found !== 'None' && (
                    <p><strong>📝 Text Detected:</strong> {result.item.ai_analysis.ocr_text_found}</p>
                  )}
                </div>
                <div style={{
                  marginTop: '0.75rem', padding: '0.75rem', background: '#FFF',
                  borderRadius: '8px', border: '1px solid #E2E8F0'
                }}>
                  <p style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>
                    &ldquo;{result.item?.description || result.item?.ai_analysis?.human_style_description}&rdquo;
                  </p>
                </div>
                {result.item?.ai_analysis?.searchable_tags?.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {result.item.ai_analysis.searchable_tags.map((tag, i) => (
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

              {/* Matching Pipeline Results */}
              <div style={{
                background: '#F0F9FF', border: '1px solid #BAE6FD',
                padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem',
                fontSize: '0.85rem', color: '#0369A1'
              }}>
                <strong>🔍 Matching Pipeline:</strong>
                <p style={{ marginTop: '0.375rem' }}>
                  Tier 1 (DB Filter): {result.matching?.tier1_candidates || 0} candidates →{' '}
                  Tier 2 (Tag Match): {result.matching?.tier2_candidates || 0} candidates →{' '}
                  Tier 3 (AI Judge): {result.matching?.final_matches || 0} match(es)
                </p>
              </div>

              {/* Match Results */}
              {result.matching?.matches?.length > 0 ? (
                <div style={{
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  padding: '1rem', borderRadius: '10px', color: '#15803D', marginBottom: '1.25rem'
                }}>
                  <strong>🎯 Found {result.matching.matches.length} potential match(es)!</strong>
                  {result.matching.matches.map((match, idx) => (
                    <div key={idx} style={{
                      marginTop: '0.75rem', padding: '0.75rem', background: '#FFF',
                      borderRadius: '8px', border: '1px solid #BBF7D0'
                    }}>
                      <p style={{ fontWeight: 600, color: '#166534' }}>
                        Match #{idx + 1}: &ldquo;{match.lostItemName}&rdquo;
                      </p>
                      <p style={{ fontSize: '0.82rem', color: '#15803D', marginTop: '0.25rem' }}>
                        Confidence: {match.confidence}% • Owner notified
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>
                        {match.reasoning}
                      </p>
                    </div>
                  ))}
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

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => { setResult(null); setFormData({ location: '', image: null }); setImagePreview(null); }}
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

export default FoundForm;
