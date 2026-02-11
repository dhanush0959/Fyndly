import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './styles/Dashboard.css';

function Dashboard() {
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({
    lostItems: 0,
    foundItems: 0,
    recentMatches: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userLoggedIn = localStorage.getItem('userLoggedIn');
    if (!userLoggedIn) {
      navigate('/');
      return;
    }

    const name = localStorage.getItem('userName') || 'User';
    setUserName(name);

    // Fetch stats
    loadStats();
  }, [navigate]);

  const loadStats = async () => {
    try {
      const [lostRes, foundRes] = await Promise.all([
        fetch('http://localhost:5000/api/items/lost'),
        fetch('http://localhost:5000/api/items/found')
      ]);

      const lostData = await lostRes.json();
      const foundData = await foundRes.json();

      setStats({
        lostItems: lostData.items?.length || 0,
        foundItems: foundData.items?.length || 0,
        recentMatches: 0 // Can add matches endpoint later
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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
    <div className="dashboard-page">
      <nav className="top-navbar">
        <div className="nav-brand">The Grandview</div>
        <div className="nav-links">
          <span className="active">Dashboard</span>
          <span onClick={() => navigate('/chat')}>Messages</span>
          <ThemeToggle />
          <span onClick={handleLogout} className="logout-btn">Logout</span>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="welcome-section">
          <h1>Welcome back, {userName}! 👋</h1>
          <p className="subtitle">Your community portal</p>
        </div>

        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">🔍</div>
            <h3>{stats.lostItems}</h3>
            <p>Lost Items Reported</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✨</div>
            <h3>{stats.foundItems}</h3>
            <p>Found Items</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <h3>{stats.recentMatches}</h3>
            <p>Recent Matches</p>
          </div>
        </div>

        <div className="action-cards">
          <div className="action-card lost-card" onClick={() => navigate('/report-lost')}>
            <div className="action-icon">📢</div>
            <h2>Report a Lost Item</h2>
            <p>Lost something? Report it here and our AI will search for matches.</p>
            <button className="action-btn lost-btn">Report Lost Item</button>
          </div>

          <div className="action-card found-card" onClick={() => navigate('/report-found')}>
            <div className="action-icon">🎉</div>
            <h2>Report a Found Item</h2>
            <p>Found something? Help it find its owner with AI-powered matching.</p>
            <button className="action-btn found-btn">Report Found Item</button>
          </div>

          <div className="action-card gallery-card" onClick={() => navigate('/gallery')}>
            <div className="action-icon">🖼️</div>
            <h2>View Lost Items Gallery</h2>
            <p>Browse all currently reported lost items in the community.</p>
            <button className="action-btn gallery-btn">View Gallery</button>
          </div>
        </div>

        <div className="info-section">
          <h3>How It Works</h3>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <h4>Upload Photo</h4>
                <p>Take a clear photo of the item</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h4>AI Analysis</h4>
                <p>Our system detects objects, text, and colors automatically</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h4>Smart Matching</h4>
                <p>Algorithm finds potential matches with similarity scores</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div className="step-content">
                <h4>Get Notified</h4>
                <p>Receive alerts when matches are found</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="dashboard-footer">
        <p>© 2025 The Grandview Residences</p>
        <p>For urgent matters, please contact the front desk at 9505640179.</p>
      </footer>
    </div>
  );
}

export default Dashboard;
