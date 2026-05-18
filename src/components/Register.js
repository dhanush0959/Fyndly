'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import './styles/Register.css';

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name || !formData.email || !formData.password) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create the account
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Registration failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // 2. Auto sign-in after successful registration
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Account was created but sign-in failed — send them to login
        router.push('/');
        return;
      }

      // 3. Go straight to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMsg('Connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <nav className="top-navbar">
        <div className="nav-brand" onClick={() => router.push('/')}>
          <span className="brand-icon">✨</span>
          Fyndly
        </div>
        <div className="nav-links">
          <span onClick={() => router.push('/')}>Home</span>
          <span onClick={() => router.push('/')}>Login</span>
          <span className="active">Register</span>
        </div>
      </nav>

      <div className="register-container">
        <div className="register-box">
          <h1>Create Account</h1>
          <p className="subtitle">Join Fyndly and never lose your belongings again.</p>

          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {errorMsg}
              </div>
            )}

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
                  placeholder="Password (min. 6 characters)"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-register" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="login-link">
            Already have an account?{' '}
            <span onClick={() => router.push('/')}>Sign in here</span>
          </p>
        </div>
      </div>

      <footer className="register-footer">
        <p>© 2025 Fyndly</p>
      </footer>
    </div>
  );
}

export default Register;
