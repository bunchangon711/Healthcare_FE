import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import patientService, { Appointment } from '../../services/patientService';
import appointmentService from '../../services/appointmentService';
import '../../styles/appointments.css';

interface Doctor {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  specialization: string;
  department: string;
  is_available: boolean;
}

interface TimeSlot {
  time: string;
  formatted_time: string;
}

const AppointmentsList: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    doctor_id: '',
    selected_date: '',
    selected_time: '',
    reason: '',
    notes: '',
    appointment_type: 'REGULAR' as 'REGULAR' | 'FOLLOW_UP' | 'SPECIALIST' | 'EMERGENCY' | 'PROCEDURE' | 'VACCINATION' | 'THERAPY',
    duration_minutes: 30
  });
  
  // Separate states for the multi-step process
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  
  // Loading states
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchAppointments = async () => {
      try {
        console.log('Fetching patient appointments...');
        const data = await patientService.getAppointments(abortController.signal);
        console.log('Fetched appointments data:', data);
        if (isMounted) {
          setAppointments(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          console.error('Error fetching appointments:', err);
          setError('Failed to load appointments. Please try again later.');
          setAppointments([]);
          setLoading(false);
        }
      }
    };

    fetchAppointments();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [bookingSuccess]); // Re-fetch when booking is successful

  // Fetch all available doctors when form is shown
  const fetchAvailableDoctors = async () => {
    setLoadingDoctors(true);
    setError('');
    try {
      const response = await appointmentService.getAvailableDoctors();
      console.log('Doctors response:', response);
      
      let doctors;
      if (Array.isArray(response)) {
        doctors = response;
      } else if (response && Array.isArray((response as any).data)) {
        doctors = (response as any).data;
      } else if (response && Array.isArray((response as any).doctors)) {
        doctors = (response as any).doctors;
      } else {
        console.warn('Unexpected response format for doctors:', response);
        doctors = [];
      }
      
      setAvailableDoctors(doctors);
    } catch (err: any) {
      console.error('Error fetching available doctors:', err);
      setError('Failed to load available doctors. Please try again.');
      setAvailableDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Fetch available dates for selected doctor
  const fetchAvailableDates = async (doctorId: string) => {
    if (!doctorId) return;
    
    setLoadingDates(true);
    setError('');
    try {
      // Get doctor's availability for the next 30 days
      const doctorAvailability = await appointmentService.getDoctorAvailability(parseInt(doctorId));
      console.log('Doctor availability:', doctorAvailability);
      
      // Generate dates for the next 30 days
      const dates: string[] = [];
      const today = new Date();
      
      for (let i = 1; i <= 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayOfWeek = (date.getDay() + 6) % 7; // Convert to backend format (0=Monday)
        
        // Check if doctor is available on this day
        const hasAvailability = doctorAvailability.some(slot => 
          slot.day_of_week === dayOfWeek && slot.is_available
        );
        
        if (hasAvailability) {
          dates.push(date.toISOString().split('T')[0]);
        }
      }
      
      setAvailableDates(dates);
    } catch (err: any) {
      console.error('Error fetching available dates:', err);
      setError('Failed to load available dates. Please try again.');
      setAvailableDates([]);
    } finally {
      setLoadingDates(false);
    }
  };

  // Fetch available time slots for selected doctor and date
  const fetchAvailableTimeSlots = async (doctorId: string, date: string) => {
    if (!doctorId || !date) return;
    
    setLoadingTimeSlots(true);
    setError('');
    try {
      const slots = await appointmentService.getAvailableSlots(parseInt(doctorId), date);
      console.log('Available time slots:', slots);
      setAvailableTimeSlots(slots);
    } catch (err: any) {
      console.error('Error fetching time slots:', err);
      setError('Failed to load available time slots. Please try again.');
      setAvailableTimeSlots([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  // Load doctors when form is shown
  useEffect(() => {
    if (showForm) {
      fetchAvailableDoctors();
    }
  }, [showForm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Handle cascading selections
    if (name === 'doctor_id') {
      // Reset dependent fields when doctor changes
      setFormData(prev => ({
        ...prev,
        selected_date: '',
        selected_time: ''
      }));
      setAvailableDates([]);
      setAvailableTimeSlots([]);
      
      // Fetch available dates for selected doctor
      if (value) {
        fetchAvailableDates(value);
      }
    } else if (name === 'selected_date') {
      // Reset time selection when date changes
      setFormData(prev => ({
        ...prev,
        selected_time: ''
      }));
      setAvailableTimeSlots([]);
      
      // Fetch available time slots for selected date
      if (value && formData.doctor_id) {
        fetchAvailableTimeSlots(formData.doctor_id, value);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!formData.doctor_id || !formData.selected_date || !formData.selected_time) {
      setError('Please complete all required fields');
      setLoading(false);
      return;
    }

    try {
      const selectedDoctor = availableDoctors.find(
        doctor => doctor.user_id.toString() === formData.doctor_id
      );

      if (!selectedDoctor) {
        throw new Error('Selected doctor not found');
      }

      // Get patient profile
      const patientProfile = await patientService.getProfile();
      
      // Combine date and time
      const appointmentDateTime = `${formData.selected_date}T${formData.selected_time}`;
      const appointmentDate = new Date(appointmentDateTime);
      
      if (isNaN(appointmentDate.getTime())) {
        throw new Error('Invalid date/time selected. Please try again.');
      }

      const appointmentData = {
        patient_id: patientProfile.id ?? patientProfile.user_id,
        doctor_id: selectedDoctor.id ?? selectedDoctor.user_id,
        date_time: appointmentDate.toISOString(),
        appointment_type: formData.appointment_type,
        reason: formData.reason,
        notes: formData.notes,
        duration_minutes: typeof formData.duration_minutes === 'string' 
          ? parseInt(formData.duration_minutes) 
          : formData.duration_minutes
      };

      console.log('Creating appointment with data:', appointmentData);

      await appointmentService.createAppointment(appointmentData);
      
      setBookingSuccess(true);
      setSuccessMessage('Appointment booked successfully!');
      setShowForm(false);
      resetForm();
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err: any) {
      console.error('Error booking appointment:', err);
      
      let errorMessage = 'Failed to book appointment. Please try again.';
      
      if (err.response?.data) {
        if (err.response.data.date_time) {
          errorMessage = `Date/Time Error: ${err.response.data.date_time[0]}`;
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors[0];
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else {
          const firstError = Object.values(err.response.data)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          }
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      doctor_id: '',
      selected_date: '',
      selected_time: '',
      reason: '',
      notes: '',
      appointment_type: 'REGULAR',
      duration_minutes: 30
    });
    setAvailableDoctors([]);
    setAvailableDates([]);
    setAvailableTimeSlots([]);
  };

  const handleCancel = async (id: number) => {
    setError('');
    setCancellingId(id);
    
    try {
      await patientService.cancelAppointment(id);
      
      setAppointments(appointments.map(appointment => 
        appointment.id === id ? { ...appointment, status: 'CANCELLED' } : appointment
      ));
      
      setSuccessMessage('Appointment cancelled successfully!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      setError(err.response?.data?.detail || 'Failed to cancel appointment. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateTimeString).toLocaleDateString('en-US', options);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <DashboardLayout title="My Appointments">
      <div className="appointments-container">
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <div className="appointments-header">
          <h2>Manage Your Appointments</h2>
          <button 
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                resetForm();
              }
            }}
            className="book-button"
          >
            {showForm ? 'Cancel' : 'Book New Appointment'}
          </button>
        </div>
        
        {showForm && (
          <div className="appointment-form-container">
            <h3>Book New Appointment</h3>
            <form onSubmit={handleSubmit} className="appointment-form">
              
              {/* Step 1: Select Doctor */}
              <div className="form-group">
                <label htmlFor="doctor_id">Step 1: Select Doctor*</label>
                {loadingDoctors ? (
                  <div className="loading-message">Loading doctors...</div>
                ) : !Array.isArray(availableDoctors) || availableDoctors.length === 0 ? (
                  <div className="error-message">
                    No doctors available. Please try again later.
                  </div>
                ) : (
                  <select
                    id="doctor_id"
                    name="doctor_id"
                    value={formData.doctor_id}
                    onChange={handleChange}
                    required
                    className="doctor-select"
                  >
                    <option value="">-- Select a doctor --</option>
                    {availableDoctors.map(doctor => (
                      <option key={doctor.user_id} value={doctor.user_id.toString()}>
                        Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Step 2: Select Date */}
              <div className="form-group">
                <label htmlFor="selected_date">Step 2: Select Date*</label>
                {!formData.doctor_id ? (
                  <div className="info-message">
                    Please select a doctor first to see available dates.
                  </div>
                ) : loadingDates ? (
                  <div className="loading-message">Loading available dates...</div>
                ) : availableDates.length === 0 ? (
                  <div className="error-message">
                    No available dates for the selected doctor in the next 30 days.
                  </div>
                ) : (
                  <select
                    id="selected_date"
                    name="selected_date"
                    value={formData.selected_date}
                    onChange={handleChange}
                    required
                    className="date-select"
                  >
                    <option value="">-- Select a date --</option>
                    {availableDates.map(date => (
                      <option key={date} value={date}>
                        {formatDate(date)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Step 3: Select Time Slot */}
              <div className="form-group">
                <label htmlFor="selected_time">Step 3: Select Time*</label>
                {!formData.selected_date ? (
                  <div className="info-message">
                    Please select a date first to see available time slots.
                  </div>
                ) : loadingTimeSlots ? (
                  <div className="loading-message">Loading available time slots...</div>
                ) : availableTimeSlots.length === 0 ? (
                  <div className="error-message">
                    No available time slots for the selected date.
                  </div>
                ) : (
                  <div className="time-slots">
                    {availableTimeSlots.map((slot) => (
                      <label key={slot.time} className="time-slot-option">
                        <input
                          type="radio"
                          name="selected_time"
                          value={slot.time.split('T')[1]?.split('.')[0] || slot.time}
                          checked={formData.selected_time === (slot.time.split('T')[1]?.split('.')[0] || slot.time)}
                          onChange={handleChange}
                          required
                        />
                        <span className="slot-time">{slot.formatted_time}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Appointment Details */}
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

              <div className="form-group">
                <label htmlFor="duration_minutes">Duration*</label>
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
                  <option value="90">90 minutes</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="reason">Reason for Visit*</label>
                <textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Additional Notes (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="cancel-button">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-button" 
                  disabled={loading || !formData.doctor_id || !formData.selected_date || !formData.selected_time}
                >
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {loading && !showForm ? (
          <div className="loading-state">Loading appointments...</div>
        ) : (
          <div className="appointments-list">
            {!Array.isArray(appointments) || appointments.length === 0 ? (
              <div className="no-appointments">
                <p>You don't have any appointments scheduled.</p>
              </div>
            ) : (
              <>
                <div className="appointments-table">
                  <div className="table-header">
                    <div className="header-cell date-time">Date & Time</div>
                    <div className="header-cell doctor">Doctor</div>
                    <div className="header-cell reason">Reason</div>
                    <div className="header-cell status">Status</div>
                    <div className="header-cell actions">Actions</div>
                  </div>
                  
                  {appointments.map((appointment) => (
                    <div className={`table-row ${appointment.status.toLowerCase()}`} key={appointment.id}>
                      <div className="cell date-time">{formatDateTime(appointment.date_time)}</div>
                      <div className="cell doctor">Dr. {appointment.doctor_name || 'Unknown'}</div>
                      <div className="cell reason">{appointment.reason}</div>
                      <div className="cell status">
                        <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="cell actions">
                        {appointment.status === 'SCHEDULED' && (
                          <button 
                            className="cancel-appointment-button" 
                            onClick={() => handleCancel(appointment.id)}
                            disabled={cancellingId === appointment.id}
                          >
                            {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AppointmentsList;