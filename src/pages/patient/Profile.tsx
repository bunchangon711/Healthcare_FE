import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import patientService from '../../services/patientService';
import DashboardLayout from '../../components/common/DashboardLayout';
import '../../styles/profile.css';

const PatientProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Create an AbortController to cancel requests when component unmounts
    const abortController = new AbortController();
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const data = await patientService.getProfile(abortController.signal);
        if (isMounted) {
          setProfile(data);
          setFormData(data);
          setLoading(false);
        }
      } catch (err: any) {
        // Only set error if the request wasn't aborted and component is still mounted
        if (err.name !== 'AbortError' && isMounted) {
          if (err.response?.status === 404) {
            // Profile not found - this should trigger automatic creation on backend
            setError('Profile not found. Creating a new profile...');
            // Retry once to get the newly created profile
            setTimeout(async () => {
              try {
                const newData = await patientService.getProfile(abortController.signal);
                if (isMounted) {
                  setProfile(newData);
                  setFormData(newData);
                  setError('');
                  setIsEditing(true); // Start in edit mode for new profiles
                  setLoading(false);
                }
              } catch (retryErr: any) {
                if (retryErr.name !== 'AbortError' && isMounted) {
                  setError('Failed to create profile. Please try refreshing the page.');
                  setLoading(false);
                }
              }
            }, 1000);
          } else {
            setError('Failed to load profile data. Please try again later.');
            setLoading(false);
          }
          console.error('Error fetching patient profile:', err);
        }
      }
    };

    fetchProfile();

    // Cleanup function to run when component unmounts
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []); // Empty dependency array to run only once

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const updatedProfile = await patientService.updateProfile(formData);
      setProfile(updatedProfile);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const cancelEdit = () => {
    setFormData(profile);
    setIsEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <DashboardLayout title="My Profile">
        <div className="loading-state">Loading profile information...</div>
      </DashboardLayout>
    );
  }

  if (!profile && !loading) {
    return (
      <DashboardLayout title="My Profile">
        <div className="error-state">
          <h2>Profile Not Found</h2>
          <p>Your profile information could not be found. Please contact support.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="profile-container">
        <div className="profile-header">
          <h2>{profile.first_name} {profile.last_name}'s Profile</h2>
          {!isEditing && (
            <button className="edit-button" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date_of_birth">Date of Birth</label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={formData.date_of_birth || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone_number">Phone Number</label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="blood_type">Blood Type</label>
                  <select
                    id="blood_type"
                    name="blood_type"
                    value={formData.blood_type || ''}
                    onChange={handleChange}
                  >
                    <option value="">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  required
                  rows={3}
                />
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="allergies">Allergies</label>
                <textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies || ''}
                  onChange={handleChange}
                  rows={2}
                  placeholder="List any allergies (if none, leave blank)"
                />
              </div>
            </div>
            
            <div className="form-section">
              <h3>Emergency Contact</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="emergency_contact_name">Name</label>
                  <input
                    type="text"
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="emergency_contact_phone">Phone</label>
                  <input
                    type="tel"
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h3>Insurance Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="insurance_provider">Provider</label>
                  <input
                    type="text"
                    id="insurance_provider"
                    name="insurance_provider"
                    value={formData.insurance_provider || ''}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="insurance_policy_number">Policy Number</label>
                  <input
                    type="text"
                    id="insurance_policy_number"
                    name="insurance_policy_number"
                    value={formData.insurance_policy_number || ''}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={cancelEdit} className="cancel-button">
                Cancel
              </button>
              <button type="submit" className="save-button" disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="profile-section">
              <h3>Personal Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{profile.first_name} {profile.last_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{profile.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date of Birth</span>
                  <span className="info-value">{profile.date_of_birth}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Gender</span>
                  <span className="info-value">{profile.gender}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Blood Type</span>
                  <span className="info-value">{profile.blood_type || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone Number</span>
                  <span className="info-value">{profile.phone_number}</span>
                </div>
              </div>
              
              <div className="info-item full-width">
                <span className="info-label">Address</span>
                <span className="info-value">{profile.address}</span>
              </div>
              
              <div className="info-item full-width">
                <span className="info-label">Allergies</span>
                <span className="info-value">{profile.allergies || 'None'}</span>
              </div>
            </div>
            
            <div className="profile-section">
              <h3>Emergency Contact</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Name</span>
                  <span className="info-value">{profile.emergency_contact_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{profile.emergency_contact_phone}</span>
                </div>
              </div>
            </div>
            
            <div className="profile-section">
              <h3>Insurance Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Provider</span>
                  <span className="info-value">{profile.insurance_provider || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Policy Number</span>
                  <span className="info-value">{profile.insurance_policy_number || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientProfile;
