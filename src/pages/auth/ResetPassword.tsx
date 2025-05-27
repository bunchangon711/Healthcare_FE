import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import authService from '../../services/authService';
import '../../styles/auth.css';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(true);

  // Check if token is provided
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      if (token) {
        await authService.resetPassword({
          token,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword
        });
        
        // Show success message and navigate to login
        navigate('/login', { 
          state: { notification: 'Your password has been successfully reset. Please login with your new password.' }
        });
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.response?.data) {
        // Handle structured validation errors
        const serverErrors = err.response.data;
        const errorMessage = Object.entries(serverErrors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
        setError(errorMessage || 'Failed to reset password. Please try again.');
      } else {
        setError('Failed to reset your password. The link may have expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Invalid Reset Link</h2>
            <p>This password reset link is invalid or has expired.</p>
          </div>
          <div className="auth-error">{error}</div>
          <div className="auth-links" style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/forgot-password" className="auth-button" style={{ display: 'inline-block' }}>
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Set New Password</h2>
          <p>Please enter your new password</p>
        </div>

        {error && (
          <div className="auth-error">
            {error.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>

          <div className="auth-links">
            Remember your password? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
