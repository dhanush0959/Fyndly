import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Register.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('Registration successful! Please login.');
        navigate('/');
      } else {
        alert(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Connection error. Please make sure the backend server is running.');
    }
  };

  return (
    <div className="register-page">
      <nav className="top-navbar">
        <div className="nav-brand">The Grandview</div>
        <div className="nav-links">
          <span onClick={() => navigate('/')}>Home</span>
          <span onClick={() => navigate('/')}>Resident Login</span>
          <span className="active">Register</span>
        </div>
      </nav>

      <div className="register-container">
        <div className="register-box">
          <h1>Resident Registration</h1>
          <p className="subtitle">Create an account to join the resident portal.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-wrapper">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <div className="input-wrapper">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <div className="input-wrapper">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-register">Register</button>
          </form>
          
          <p className="login-link">
            Already have an account? <span onClick={() => navigate('/')}>Login here</span>
          </p>
        </div>
      </div>

      <footer className="register-footer">
        <p>© 2024 The Grandview Residences | Duvada</p>
        <p>For urgent matters, please contact the front desk at (123) 456-7890.</p>
      </footer>
    </div>
  );
}

export default Register;
