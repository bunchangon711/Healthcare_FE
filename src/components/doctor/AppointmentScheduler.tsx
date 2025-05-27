import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import doctorService from '../../services/doctorService';
import appointmentService, { Appointment } from '../../services/appointmentService';
import '../../styles/doctor.css';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
}

interface TimeSlot {
  time: string;
  formatted_time: string;
}

const AppointmentScheduler: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Update formData to use the correct type for appointment_type
  const [formData, setFormData] = useState({
    appointment_type: 'REGULAR' as Appointment['appointment_type'],
    slot: '',
    reason: '',
    notes: '',
    duration_minutes: 30
  });

  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        const patientData = await doctorService.getPatient(parseInt(patientId));
        setPatient(patientData);
        
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow.toISOString().split('T')[0]);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching patient:', err);
        setError('Failed to load patient data. Please try again later.');
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);
  
  useEffect(() => {
    // Fetch available slots when date changes
    const fetchAvailableSlots = async () => {
      if (!selectedDate || !patientId) return;
      
      try {
        setLoadingSlots(true);
        // Get doctor ID from the auth context or user profile
        const doctorProfile = await doctorService.getProfile();
        const doctorId = doctorProfile.user_id;
        
        // Fetch available slots
        const slots = await appointmentService.getAvailableSlots(doctorId, selectedDate);
        setAvailableSlots(slots);
        setLoadingSlots(false);
      } catch (err: any) {
        console.error('Error fetching available slots:', err);
        setError('Failed to load available time slots. Please try again.');
        setLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedDate, patientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'appointment_type') {
      // Ensure type safety with a validation function
      const isValidAppointmentType = (val: string): val is Appointment['appointment_type'] => {
        return ['REGULAR', 'FOLLOW_UP', 'SPECIALIST', 'EMERGENCY', 'PROCEDURE', 'VACCINATION', 'THERAPY'].includes(val);
      };
      
      if (isValidAppointmentType(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'duration_minutes' ? parseInt(value) : value
      }));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    // Clear the selected slot when date changes
    setFormData(prev => ({
      ...prev,
      slot: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !formData.slot) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      // Get doctor ID from the auth context or user profile
      const doctorProfile = await doctorService.getProfile();
      
      const appointmentData: Partial<Appointment> = {
        patient_id: parseInt(patientId),
        doctor_id: doctorProfile.user_id,
        date_time: formData.slot,
        appointment_type: formData.appointment_type,
        reason: formData.reason,
        notes: formData.notes,
        duration_minutes: formData.duration_minutes
      };
      
      await appointmentService.createAppointment(appointmentData);
      setSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        appointment_type: 'REGULAR' as Appointment['appointment_type'],
        slot: '',
        reason: '',
        notes: '',
        duration_minutes: 30
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/doctor/patients/${patientId}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error scheduling appointment:', err);
      setError(err.response?.data?.detail || 'Failed to schedule appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!patient) return <div className="error-message">Patient not found</div>;

  return (
    <div className="appointment-scheduler-container">
      <div className="form-header">
        <button 
          onClick={() => navigate(`/doctor/patients/${patientId}`)}
          className="back-button"
        >
          &larr; Back to Patient
        </button>
        <h2>Schedule Appointment for {patient.first_name} {patient.last_name}</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Appointment scheduled successfully!</div>}
      
      <form onSubmit={handleSubmit} className="appointment-form">
        <div className="form-group">
          <label htmlFor="appointment_type">Appointment Type*</label>
          <select 
            id="appointment_type" 
            name="appointment_type"
            value={formData.appointment_type}
            onChange={handleChange}
            required
          >
            <option value="REGULAR">Regular Check-up</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="SPECIALIST">Specialist Consultation</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="PROCEDURE">Medical Procedure</option>
            <option value="VACCINATION">Vaccination</option>
            <option value="THERAPY">Therapy Session</option>
          </select>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date*</label>
            <input
              type="date"
              id="date"
              name="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]} // Today's date as minimum
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="duration_minutes">Duration (minutes)*</label>
            <select
              id="duration_minutes"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              required
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Available Time Slots*</label>
          {loadingSlots ? (
            <div className="loading-message">Loading available slots...</div>
          ) : availableSlots.length === 0 ? (
            <div className="no-slots-message">No available slots for the selected date.</div>
          ) : (
            <div className="time-slots">
              {availableSlots.map((slot) => (
                <label key={slot.time} className="time-slot-option">
                  <input
                    type="radio"
                    name="slot"
                    value={slot.time}
                    checked={formData.slot === slot.time}
                    onChange={handleChange}
                    required
                  />
                  <span className="slot-time">{slot.formatted_time}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="reason">Reason for Appointment*</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="notes">Additional Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate(`/doctor/patients/${patientId}`)}
            className="cancel-button"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={submitting || !formData.slot}
          >
            {submitting ? 'Scheduling...' : 'Schedule Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentScheduler;
