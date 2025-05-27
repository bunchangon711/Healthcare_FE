import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import appointmentService, { Appointment } from '../../services/appointmentService';
import '../../styles/doctor.css';
import doctorService from '../../services/doctorService';

const DoctorAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [date, setDate] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        console.log('Fetching doctor appointments with filter:', filter, 'and date:', date);
        let params: any = {};
        
        if (date) {
          params.start_date = date;
        }
        
        if (filter !== 'all') {
          params.status = filter.toUpperCase();
        }
        
        const data = await doctorService.getAppointments(params);
        console.log('Received doctor appointments:', data);
        
        // Ensure data is an array before setting state
        setAppointments(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments. Please try again later.');
        setAppointments([]);
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [filter, date]);

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCompleteAppointment = async (id: number) => {
    try {
      await appointmentService.completeAppointment(id);
      setAppointments(appointments.map(app => 
        app.id === id ? { ...app, status: 'COMPLETED' } : app
      ));
    } catch (err) {
      console.error('Error completing appointment:', err);
      setError('Failed to complete appointment. Please try again.');
    }
  };

  const handleNoShow = async (id: number) => {
    try {
      await appointmentService.markNoShow(id);
      setAppointments(appointments.map(app => 
        app.id === id ? { ...app, status: 'NO_SHOW' } : app
      ));
    } catch (err) {
      console.error('Error marking no-show:', err);
      setError('Failed to mark patient as no-show. Please try again.');
    }
  };

  return (
    <DashboardLayout title="Appointments">
      <div className="appointments-container">
        {error && <div className="error-message">{error}</div>}
        
        <div className="filters-container">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Appointments</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Date:</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="date-filter"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="loading-state">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="no-data">No appointments found matching your criteria.</div>
        ) : (
          <div className="appointments-list">
            {appointments.map(appointment => (
              <div 
                key={appointment.id} 
                className={`appointment-item ${appointment.status.toLowerCase()}`}
              >
                <div className="appointment-time">
                  {formatDateTime(appointment.date_time)}
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
                  <Link 
                    to={`/doctor/patients/${appointment.patient_id}`} 
                    className="view-patient-link"
                  >
                    View Patient
                  </Link>
                  
                  {appointment.status === 'SCHEDULED' && (
                    <>
                      <button 
                        onClick={() => handleCompleteAppointment(appointment.id)}
                        className="complete-btn"
                      >
                        Complete
                      </button>
                      <button 
                        onClick={() => handleNoShow(appointment.id)}
                        className="no-show-btn"
                      >
                        No Show
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorAppointments;
