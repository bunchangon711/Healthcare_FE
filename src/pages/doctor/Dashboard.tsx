import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import appointmentService, { Appointment } from '../../services/appointmentService';
import doctorService from '../../services/doctorService';
import { Link } from 'react-router-dom';
import '../../styles/doctor.css';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch doctor profile
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const profile = await doctorService.getProfile();
        setDoctorProfile(profile);
      } catch (err) {
        console.error('Error fetching doctor profile:', err);
        // Don't show error for missing profile in dashboard
      } finally {
        setProfileLoading(false);
      }
    };

    fetchDoctorProfile();
  }, []);

  // Fetch today's appointments
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchTodayAppointments = async () => {
      try {
        const data = await appointmentService.getTodayAppointments(abortController.signal);
        setTodayAppointments(data);
        setLoading(false);
      } catch (err: any) {
        if (err.name !== 'AbortError' && err.code !== 'ERR_CANCELED') {
          console.error('Error fetching today\'s appointments:', err);
          setError('Failed to load appointments. Please try again later.');
        } else {
          console.log('Request was canceled intentionally');
        }
        setLoading(false);
      }
    };

    fetchTodayAppointments();

    return () => {
      abortController.abort();
    };
  }, []);
  
  const getNextAppointment = () => {
    const now = new Date();
    return todayAppointments.find(appointment => 
      new Date(appointment.date_time) > now && appointment.status === 'SCHEDULED'
    );
  };
  
  const formatAppointmentTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const nextAppointment = getNextAppointment();
  const scheduledAppointmentsCount = todayAppointments.filter(a => a.status === 'SCHEDULED').length;
  const completedAppointmentsCount = todayAppointments.filter(a => a.status === 'COMPLETED').length;

  const doctorName = doctorProfile ? 
    `Dr. ${doctorProfile.first_name} ${doctorProfile.last_name}` : 
    user?.last_name ? `Dr. ${user.last_name}` : 'Doctor';

  return (
    <DashboardLayout title="Doctor Dashboard">
      <div className="dashboard-welcome">
        <h2>Welcome back, {doctorName}!</h2>
        <p>Here's your schedule and patient information for today.</p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Today's Appointments</h3>
            <span className="card-icon">📋</span>
          </div>
          <div className="card-value">{scheduledAppointmentsCount}</div>
          <p className="card-description">Scheduled appointments for today</p>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Appointments Completed</h3>
            <span className="card-icon">✓</span>
          </div>
          <div className="card-value">{completedAppointmentsCount}</div>
          <p className="card-description">Appointments completed today</p>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Messages</h3>
            <span className="card-icon">✉️</span>
          </div>
          <div className="card-value">0</div>
          <p className="card-description">New messages from patients</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Next Appointment</h3>
        <div className="appointment-preview">
          {loading ? (
            <p>Loading next appointment...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : nextAppointment ? (
            <div className="next-appointment-card">
              <div className="appointment-time">
                {formatAppointmentTime(nextAppointment.date_time)}
              </div>
              <div className="appointment-details">
                <h4>{nextAppointment.patient_name}</h4>
                <p><strong>Reason:</strong> {nextAppointment.reason}</p>
                <p><strong>Type:</strong> {nextAppointment.appointment_type?.replace('_', ' ') || 'Regular Check-up'}</p>
              </div>
              <div className="appointment-actions">
                <Link to={`/doctor/patients/${nextAppointment.patient_id}`} className="view-patient-btn">
                  View Patient
                </Link>
              </div>
            </div>
          ) : (
            <p>No upcoming appointments scheduled for today.</p>
          )}
        </div>
      </div>
      
      <div className="dashboard-section">
        <h3>Today's Schedule</h3>
        {loading ? (
          <p>Loading appointments...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : todayAppointments.length === 0 ? (
          <p>No appointments scheduled for today.</p>
        ) : (
          <div className="appointments-list">
            {todayAppointments.map(appointment => (
              <div 
                key={appointment.id} 
                className={`appointment-item ${appointment.status.toLowerCase()}`}
              >
                <div className="appointment-time">
                  {formatAppointmentTime(appointment.date_time)}
                </div>
                <div className="appointment-info">
                  <div className="patient-name">{appointment.patient_name}</div>
                  <div className="appointment-reason">{appointment.reason}</div>
                </div>
                <div className="appointment-status">
                  <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                    {appointment.status}
                  </span>
                </div>
                <div className="appointment-actions">
                  <Link to={`/doctor/patients/${appointment.patient_id}`} className="view-patient-link">
                    View Patient
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
