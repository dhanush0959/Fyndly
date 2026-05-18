'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import './styles/Gallery.css';

function Gallery() {
  /* eslint-disable @next/next/no-img-element */
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { data: session, status } = useSession();
  const router = useRouter();

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/items/lost');
      const data = await response.json();

      if (response.ok && data.success) {
        const transformedItems = data.items.map(item => ({
          id: item._id || item.id,
          itemName: item.item_name,
          description: item.description,
          location: item.location,
          imageUrl: item.image_url,
          dateReported: new Date(item.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          }),
          detectedObjects: item.detected_objects
        }));
        setItems(transformedItems);
      } else {
        setError('Failed to load items. Please try again.');
      }
    } catch (err) {
      console.error('Load items error:', err);
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
    if (status === 'authenticated') {
      loadItems();
    }
    // eslint-disable-next-line
  }, [status, router]);

  // Show nothing while session is loading
  if (status === 'loading' || status === 'unauthenticated') return null;

  return (
    <div className="gallery-page">
      <nav className="top-navbar">
        <div className="nav-brand">Fyndly</div>
        <div className="nav-links">
          <span onClick={() => router.push('/dashboard')}>Dashboard</span>
          <span onClick={() => router.push('/report-lost')}>Report Lost</span>
          <span onClick={() => router.push('/report-found')}>Report Found</span>
        </div>
      </nav>

      <div className="gallery-container">
        <div className="tab-navigation">
          <button className="tab-btn" onClick={() => router.push('/report-lost')}>Report a Lost Item</button>
          <button className="tab-btn" onClick={() => router.push('/report-found')}>Report a Found Item</button>
          <button className="tab-btn active">View Lost Items</button>
        </div>

        <div className="gallery-content">
          <h1 className="gallery-title">Currently Reported Lost Items</h1>

          {/* Error state */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
              padding: '0.875rem 1rem', borderRadius: '10px', marginBottom: '1.5rem',
              fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              ⚠️ {error}
              <button
                onClick={loadItems}
                style={{ marginLeft: 'auto', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748B' }}>
              <div style={{
                width: '2.5rem', height: '2.5rem', border: '3px solid #CCFBF1',
                borderTopColor: '#0D9488', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem'
              }} />
              <p style={{ fontSize: '0.9rem' }}>Loading items...</p>
            </div>
          ) : (
            <div className="items-grid">
              {items.length === 0 ? (
                <div className="no-items" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.4 }}>🔍</div>
                  <p style={{ fontWeight: 600, color: '#64748B' }}>No lost items reported yet.</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.375rem' }}>Be the first to report a lost item!</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="item-card">
                    {item.imageUrl ? (
                      <div className="item-image">
                        <img src={item.imageUrl} alt={item.itemName} />
                      </div>
                    ) : (
                      <div className="item-image-placeholder">🏷️</div>
                    )}
                    <div className="item-content">
                      <h3>{item.itemName}</h3>
                      <p className="item-description">{item.description}</p>
                      <div className="item-footer">
                        <span>📍 {item.location}</span>
                        <span>{item.dateReported}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="gallery-footer">
        <p>© 2025 Fyndly · AI-Powered Lost &amp; Found Platform</p>
      </footer>
    </div>
  );
}

export default Gallery;
