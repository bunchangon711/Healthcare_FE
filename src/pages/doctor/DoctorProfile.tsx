import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import doctorService, { Doctor } from '../../services/doctorService';
import '../../styles/doctor.css';

const DoctorProfile: React.FC = () => {
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Doctor>>({});
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await doctorService.getProfile();
        setProfile(data);
        setFormData(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        if (err.response?.status === 404) {
          // Profile not found - should trigger automatic creation on backend
          setError('Profile not found. Creating a new profile...');
          // Retry once to get the newly created profile
          setTimeout(async () => {
            try {
              const newData = await doctorService.getProfile();
              setProfile(newData);
              setFormData(newData);
              setError('');
              setIsEditing(true); // Start in edit mode for new profiles
              setLoading(false);
            } catch (retryErr: any) {
              console.error('Error on retry:', retryErr);
              setError('Failed to create profile. Please contact support.');
              setLoading(false);
            }
          }, 1000);
        } else {
          setError('Failed to load profile. Please try again later.');
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Validate required fields on frontend
      if (!formData.first_name || !formData.last_name) {
        setError('First name and last name are required.');
        setLoading(false);
        return;
      }
      
      if (!formData.specialization || !formData.department) {
        setError('Specialization and department are required.');
        setLoading(false);
        return;
      }
      
      const updatedProfile = await doctorService.updateProfile(formData);
      setProfile(updatedProfile);
      setUpdateSuccess(true);
      setIsEditing(false);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      
      // Handle specific validation errors
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          // Format validation errors
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          setError(`Validation errors:\n${errorMessages}`);
        } else if (typeof errorData === 'string') {
          setError(errorData);
        } else {
          setError('Failed to update profile. Please check your input and try again.');
        }
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) return <div className="loading-state">Loading profile...</div>;
  if (error && !profile) return <div className="error-message">{error}</div>;
  if (!profile) return <div className="error-message">Profile not found</div>;

  return (
    <DashboardLayout title="My Profile">
      <div className="profile-container">
        {updateSuccess && (
          <div className="success-message">Profile updated successfully!</div>
        )}
        
        {error && (
          <div className="error-message">{error}</div>
        )}
        
        <div className="profile-header">
          <div className="profile-avatar large">
            {profile.first_name?.[0]}{profile.last_name?.[0]}
          </div>
          <div className="profile-title">
            <h2>Dr. {profile.first_name} {profile.last_name}</h2>
            <p>{profile.specialization} - {profile.department}</p>
          </div>
          <button 
            className="edit-profile-btn"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-edit-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name || ''}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department || ''}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>License Number</label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Experience (Years)</label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                rows={4}
              />
            </div>
            
            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                rows={4}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="detail-section">
              <h3>Personal Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">Dr. {profile.first_name} {profile.last_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Specialization</span>
                  <span className="detail-value">{profile.specialization}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Department</span>
                  <span className="detail-value">{profile.department}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">License Number</span>
                  <span className="detail-value">{profile.license_number || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Experience</span>
                  <span className="detail-value">{profile.experience_years} years</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Address</span>
                  <span className="detail-value">{profile.address || 'Not provided'}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>Contact Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{profile.email || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{profile.phone_number || 'Not provided'}</span>
                </div>
              </div>
            </div>
            
            {profile.bio && (
              <div className="detail-section">
                <h3>Biography</h3>
                <p className="bio-text">{profile.bio}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorProfile;
