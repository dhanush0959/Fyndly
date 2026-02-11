import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsLoading(false);
        setShowSuccess(true);
        
        // Store user session with JWT token
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', data.user.name);
        localStorage.setItem('token', data.token);
        
        // Navigate after success animation
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setIsLoading(false);
        alert(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Login error:', error);
      alert('Connection error. Please make sure the backend server is running.');
    }
  };

  return (
    <div className="login-page">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p className="loading-text">Authenticating...</p>
        </div>
      )}
      
      {/* Success Overlay */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-checkmark">
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          <p className="success-text">Login Successful!</p>
        </div>
      )}
      
      <nav className="top-navbar">
        <div className="nav-brand">The Grandview</div>
        <div className="nav-links">
          <span onClick={() => navigate('/')}>Home</span>
          <span className="active">Resident Login</span>
          <span onClick={() => navigate('/register')}>Register</span>
        </div>
      </nav>

      <div className="login-container">
        <div className="login-box">
          <h1>Resident Portal</h1>
          <p className="subtitle">Log in to access your community portal.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <div className="input-wrapper">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-login">Login</button>
          </form>
          
          <p className="register-link">
            Not a registered resident? <span onClick={() => navigate('/register')}>Register here</span>
          </p>
        </div>
      </div>

      <footer className="login-footer">
        <p>© 2025 The Grandview Residences</p>
        <p>For urgent matters, please contact the front desk at 9505640179.</p>
      </footer>
    </div>
  );
}

export default Login; 
