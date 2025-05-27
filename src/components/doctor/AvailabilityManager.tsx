import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import doctorService, { AvailabilitySlot } from '../../services/doctorService';
import '../../styles/doctor.css';
import authService from '../../services/authService';

const AvailabilityManager: React.FC = () => {
  const navigate = useNavigate();
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newSlot, setNewSlot] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '17:00',
    is_available: true
  });
  
  const [timeOffPeriods, setTimeOffPeriods] = useState<any[]>([]);
  const [showTimeOffForm, setShowTimeOffForm] = useState(false);
  const [newTimeOff, setNewTimeOff] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });

  // Mapping for day of week
  const dayNames = {
    0: 'Monday',
    1: 'Tuesday',
    2: 'Wednesday',
    3: 'Thursday',
    4: 'Friday',
    5: 'Saturday',
    6: 'Sunday'
  };

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if user is authenticated first
      if (!authService.isAuthenticated()) {
        setError('You need to be logged in to access this page.');
        setLoading(false);
        navigate('/login'); // Redirect to login
        return;
      }
      
      // Try to refresh token if needed before making the API calls
      if (authService.isTokenExpired()) {
        try {
          await authService.refreshToken();
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          setError('Authentication session expired. Please log in again.');
          setLoading(false);
          navigate('/login');
          return;
        }
      }
      
      // Fetch both availability and time off using the doctor service methods
      const [availabilityData, timeOffData] = await Promise.allSettled([
        doctorService.getAvailability(),
        doctorService.getTimeOff()
      ]);
      
      // Check the status of each promise and handle accordingly
      if (availabilityData.status === 'fulfilled') {
        setAvailabilitySlots(availabilityData.value);
      } else {
        console.error('Failed to load availability data:', availabilityData.reason);
      }
      
      if (timeOffData.status === 'fulfilled') {
        setTimeOffPeriods(timeOffData.value);
      } else {
        console.error('Failed to load time off data:', timeOffData.reason);
      }
      
      // Set error message if both requests failed
      if (availabilityData.status === 'rejected' && timeOffData.status === 'rejected') {
        const isAuthError = 
          (availabilityData.reason?.response?.status === 401) || 
          (timeOffData.reason?.response?.status === 401);
          
        if (isAuthError) {
          setError('Authentication error. Please log in again.');
          navigate('/login');
        } else {
          setError('Failed to load availability data. Please try again later.');
        }
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load availability data. Please try again later.');
      setLoading(false);
    }
  };

  fetchData();
}, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setNewSlot(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : name === 'day_of_week' 
          ? parseInt(value) 
          : value
    }));
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      
      // Use the doctor service method
      const response = await doctorService.setAvailability(newSlot);
      
      // Add the new slot to the list
      setAvailabilitySlots(prev => [...prev, response]);
      
      // Reset form
      setNewSlot({
        day_of_week: 0,
        start_time: '09:00',
        end_time: '17:00',
        is_available: true
      });
      
      setShowAddForm(false);
      setSuccess('Availability slot added successfully!');
      
      // Clear success message after a few seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: any) {
      console.error('Error adding availability slot:', err);
      setError(err.response?.data?.detail || 'Failed to add availability slot. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAvailability = async (slotId: number, isAvailable: boolean) => {
    try {
      setError('');
      
      // Find the slot
      const slot = availabilitySlots.find(s => s.id === slotId);
      if (!slot) return;
      
      // Update the availability using the doctor service method
      const updatedData = { ...slot, is_available: isAvailable };
      await doctorService.updateAvailability(updatedData);
      
      // Update the local state
      setAvailabilitySlots(prev => 
        prev.map(s => s.id === slotId ? { ...s, is_available: isAvailable } : s)
      );
      
      setSuccess(`Availability ${isAvailable ? 'enabled' : 'disabled'} successfully!`);
      
      // Clear success message after a few seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: any) {
      console.error('Error updating availability:', err);
      setError(err.response?.data?.detail || 'Failed to update availability. Please try again.');
    }
  };

  const handleTimeOffInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTimeOff(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError('');
      
      const response = await doctorService.addTimeOff(newTimeOff);
      
      // Add the new time off to the list
      setTimeOffPeriods(prev => [response, ...prev]);
      
      // Reset form
      setNewTimeOff({
        start_date: '',
        end_date: '',
        reason: ''
      });
      
      setShowTimeOffForm(false);
      setSuccess('Time off period added successfully!');
      
      // Clear success message after a few seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error: any) {
      console.error('Error adding time off:', error);
      setError(error.response?.data?.detail || 'Failed to add time off period. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format time to display in 12-hour format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hoursNum = parseInt(hours);
    const period = hoursNum >= 12 ? 'PM' : 'AM';
    const hours12 = hoursNum % 12 || 12;
    return `${hours12}:${minutes} ${period}`;
  };

  if (loading) return <div className="loading-state">Loading availability...</div>;

  return (
    <div className="availability-manager-container">
      <div className="section-header">
        <h2>Manage Your Availability</h2>
        <div className="header-buttons">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="action-button add"
          >
            {showAddForm ? 'Cancel' : 'Add Availability Slot'}
          </button>
          <button 
            onClick={() => setShowTimeOffForm(!showTimeOffForm)}
            className="action-button add"
          >
            {showTimeOffForm ? 'Cancel' : 'Add Time Off'}
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {showAddForm && (
        <div className="add-slot-form-container">
          <h3>Add New Availability Slot</h3>
          <form onSubmit={handleAddSlot} className="add-slot-form">
            <div className="form-group">
              <label htmlFor="day_of_week">Day of Week*</label>
              <select 
                id="day_of_week" 
                name="day_of_week"
                value={newSlot.day_of_week}
                onChange={handleInputChange}
                required
              >
                {Object.entries(dayNames).map(([value, name]) => (
                  <option key={value} value={value}>{name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_time">Start Time*</label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  value={newSlot.start_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="end_time">End Time*</label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  value={newSlot.end_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_available"
                  checked={newSlot.is_available}
                  onChange={handleInputChange}
                />
                Available for Appointments
              </label>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Slot'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {showTimeOffForm && (
        <div className="add-slot-form-container">
          <h3>Add Time Off Period</h3>
          <form onSubmit={handleAddTimeOff} className="add-slot-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">Start Date*</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={newTimeOff.start_date}
                  onChange={handleTimeOffInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="end_date">End Date*</label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={newTimeOff.end_date}
                  onChange={handleTimeOffInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="reason">Reason*</label>
              <input
                type="text"
                id="reason"
                name="reason"
                value={newTimeOff.reason}
                onChange={handleTimeOffInputChange}
                placeholder="e.g., Vacation, Conference, Personal"
                required
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setShowTimeOffForm(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Time Off'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="availability-slots-list">
        <h3>Your Current Availability</h3>
        
        {availabilitySlots.length === 0 ? (
          <div className="no-data">No availability slots defined yet. Add some to allow patients to book appointments.</div>
        ) : (
          <div className="availability-grid">
            {availabilitySlots.map(slot => (
              <div key={slot.id} className={`availability-card ${!slot.is_available ? 'unavailable' : ''}`}>
                <div className="slot-details">
                  <h4>{dayNames[slot.day_of_week as keyof typeof dayNames]}</h4>
                  <p className="time-range">{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</p>
                </div>
                <div className="slot-status">
                  <label className="status-toggle">
                    <input
                      type="checkbox"
                      checked={slot.is_available}
                      onChange={() => slot.id && handleUpdateAvailability(slot.id, !slot.is_available)}
                      disabled={!slot.id}
                    />
                    <span className="toggle-switch"></span>
                    <span className="toggle-label">{slot.is_available ? 'Available' : 'Unavailable'}</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="time-off-section">
        <h3>Time Off Periods</h3>
        
        {timeOffPeriods.length === 0 ? (
          <div className="no-data">No time off periods scheduled.</div>
        ) : (
          <div className="time-off-list">
            {timeOffPeriods.map(timeOff => (
              <div key={timeOff.id} className="time-off-card">
                <div className="time-off-details">
                  <h4>{timeOff.reason}</h4>
                  <p className="date-range">
                    {new Date(timeOff.start_date).toLocaleDateString()} - {new Date(timeOff.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityManager;
