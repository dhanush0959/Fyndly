'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
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
          router.push('/dashboard');
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
      {/* Background Ambient Shapes */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner-ring"></div>
          <p className="loading-text">Authenticating...</p>
        </div>
      )}
      
      {/* Success Overlay */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-icon">
            <svg viewBox="0 0 52 52">
              <circle className="success-circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="success-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          <p className="success-text">Welcome Back!</p>
        </div>
      )}
      
      <nav className="top-navbar">
        <div className="nav-brand" onClick={() => router.push('/')}>
          <span className="brand-icon">✨</span>
          Fyndly
        </div>
        <div className="nav-links">
          <span onClick={() => router.push('/')}>Home</span>
          <span className="active">Login</span>
          <span onClick={() => router.push('/register')} className="nav-btn">Get Started</span>
        </div>
      </nav>

      <div className="login-container">
        <div className="login-card">
          <div className="card-header">
            <h1>Welcome Back</h1>
            <p>Enter your details to access your AI-powered dashboard.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <div className="label-row">
                <label>Password</label>
                <a href="#" className="forgot-password" onClick={(e) => e.preventDefault()}>Forgot password?</a>
              </div>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0110 0v4"></path>
                </svg>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="btn-primary" disabled={isLoading}>
              <span>Sign In</span>
              <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </form>
          
          <div className="card-footer">
            <p>
              New to Fyndly? <span className="highlight-link" onClick={() => router.push('/register')}>Create an account</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login; 
