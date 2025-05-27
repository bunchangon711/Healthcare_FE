import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../../services/authService';
import '../../styles/auth.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await authService.requestPasswordReset(email);
      setSuccessMessage('Password reset instructions have been sent to your email.');
      setEmail(''); // Clear the form after success
    } catch (err: any) {
      setError('Failed to process your request. Please try again later.');
      console.error('Password reset request error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Reset Password</h2>
          <p>Enter your email to receive password reset instructions</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {successMessage && <div className="auth-success">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Sending...' : 'Reset Password'}
          </button>

          <div className="auth-links">
            Remember your password? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
