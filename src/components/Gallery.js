import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './styles/Gallery.css';

function Gallery() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userLoggedIn = localStorage.getItem('userLoggedIn');
    if (!userLoggedIn) {
      navigate('/');
      return;
    }

    loadItems();
  }, [navigate]);

  const loadItems = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/items/lost');
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Transform API data to match component structure
        const transformedItems = data.items.map(item => ({
          id: item.id,
          itemName: item.item_name,
          description: item.description,
          location: item.location,
          imageUrl: item.image_url,
          dateReported: new Date(item.created_at).toLocaleDateString(),
          detectedObjects: item.detected_objects
        }));
        setItems(transformedItems);
      } else {
        console.error('Failed to load items');
      }
    } catch (error) {
      console.error('Load items error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="gallery-page">
      <nav className="top-navbar">
        <div className="nav-brand">The Grandview</div>
        <div className="nav-links">
          <span onClick={() => navigate('/dashboard')}>Home</span>
          <ThemeToggle />
        </div>
      </nav>

      <div className="gallery-container">
        <div className="tab-navigation">
          <button className="tab-btn" onClick={() => navigate('/report-lost')}>Report a Lost Item</button>
          <button className="tab-btn" onClick={() => navigate('/report-found')}>Report a Found Item</button>
          <button className="tab-btn active">View Lost Items</button>
        </div>

        <div className="gallery-content">
          <h1 className="gallery-title">Currently Reported Lost Items</h1>
          
          <div className="items-grid">
            {items.length === 0 ? (
              <div className="no-items">
                <p>No items found. Be the first to report!</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="item-card">
                  {item.imageUrl && (
                    <div className="item-image">
                      <img src={item.imageUrl} alt={item.itemName} />
                    </div>
                  )}
                  <div className="item-content">
                    <h3>{item.itemName}</h3>
                    <p className="item-description">{item.description}</p>
                    <div className="item-footer">
                      <span className="item-location">{item.location}</span>
                      <span className="item-date">{item.dateReported}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <footer className="gallery-footer">
        <p>© 2025 The Grandview Residences</p>
        <p>For urgent matters, please contact the front desk at 9505640179.</p>
      </footer>
    </div>
  );
}

export default Gallery;
