import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import doctorService from '../../services/doctorService';
import { TabPanel, TabView } from '../common/TabView';
import '../../styles/doctor.css';

interface PatientDetails {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_type?: string;
  allergies?: string;
  medical_conditions?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
}

interface MedicalRecord {
  id: number;
  date: string;
  visit_type: string;
  chief_complaint: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  doctor_name: string;
}

interface Prescription {
  id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  date_prescribed: string;
  refills: number;
  status: string;
  doctor_name: string;
}

interface Appointment {
  id: number;
  date_time: string;
  reason: string;
  status: string;
  notes?: string;
  doctor_name: string;
}

const PatientDetail: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        // Fetch patient history which includes all related data
        const patientHistory = await doctorService.getPatientHistory(parseInt(patientId));
        
        setPatient(patientHistory.patient_details);
        setMedicalRecords(patientHistory.medical_records || []);
        setPrescriptions(patientHistory.prescriptions || []);
        setAppointments(patientHistory.appointments || []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient data. Please try again later.');
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  const handlePrescribe = () => {
    if (patientId) {
      navigate(`/doctor/patients/${patientId}/prescribe`);
    }
  };

  const handleAddDiagnosis = () => {
    if (patientId) {
      navigate(`/doctor/patients/${patientId}/diagnose`);
    }
  };

  const handleScheduleAppointment = () => {
    if (patientId) {
      navigate(`/doctor/patients/${patientId}/schedule`);
    }
  };

  const handleOrderLabTest = () => {
    if (patientId) {
      navigate(`/doctor/patients/${patientId}/order-lab-test`);
    }
  };

  const handleCreateMedicalReport = () => {
    if (patientId) {
      navigate(`/doctor/patients/${patientId}/create-report`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="loading-state">Loading patient data...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!patient) return <div className="error-message">Patient not found</div>;

  return (
    <div className="patient-detail-container">
      <div className="patient-header">
        <button 
          onClick={() => navigate('/doctor/patients')}
          className="back-button"
        >
          &larr; Back to Patients
        </button>
        <h2>{patient.first_name} {patient.last_name}'s Profile</h2>
      </div>

      <div className="patient-profile-summary">
        <div className="patient-basic-info">
          <div className="patient-avatar large">
            {patient.first_name[0]}{patient.last_name[0]}
          </div>
          <div>
            <h3>{patient.first_name} {patient.last_name}</h3>
            <p>DOB: {formatDate(patient.date_of_birth)}</p>
            <p>Gender: {patient.gender}</p>
            {patient.blood_type && <p>Blood Type: {patient.blood_type}</p>}
          </div>
        </div>
        <div className="patient-actions-bar">
          <button onClick={handleAddDiagnosis} className="action-button diagnose">
            Add Diagnosis
          </button>
          <button onClick={handlePrescribe} className="action-button prescribe">
            Prescribe Medication
          </button>
          <button onClick={handleScheduleAppointment} className="action-button schedule">
            Schedule Appointment
          </button>
          <button onClick={handleOrderLabTest} className="action-button lab-test">
            Order Lab Test
          </button>
          <button onClick={handleCreateMedicalReport} className="action-button report">
            Create Medical Report
          </button>
        </div>
      </div>

      <TabView activeTab={activeTab} onChangeTab={setActiveTab}>
        <TabPanel title="Medical Information">
          <div className="medical-info-section">
            <div className="info-card">
              <h4>Allergies</h4>
              <p>{patient.allergies || 'None reported'}</p>
            </div>
            <div className="info-card">
              <h4>Medical Conditions</h4>
              <p>{patient.medical_conditions || 'None reported'}</p>
            </div>
            <div className="info-card">
              <h4>Insurance</h4>
              <p>Provider: {patient.insurance_provider || 'Not provided'}</p>
              <p>Policy #: {patient.insurance_policy_number || 'Not provided'}</p>
            </div>
          </div>
        </TabPanel>

        <TabPanel title="Medical Records">
          {medicalRecords.length === 0 ? (
            <div className="no-data">No medical records available.</div>
          ) : (
            <div className="records-list">
              {medicalRecords.map(record => (
                <div key={record.id} className="record-card">
                  <div className="record-header">
                    <h4>{record.visit_type} - {formatDate(record.date)}</h4>
                    <span className="doctor-name">Dr. {record.doctor_name}</span>
                  </div>
                  <div className="record-details">
                    <p><strong>Chief Complaint:</strong> {record.chief_complaint}</p>
                    <p><strong>Diagnosis:</strong> {record.diagnosis}</p>
                    <p><strong>Treatment:</strong> {record.treatment}</p>
                    {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel title="Prescriptions">
          {prescriptions.length === 0 ? (
            <div className="no-data">No prescriptions available.</div>
          ) : (
            <div className="prescriptions-list">
              {prescriptions.map(prescription => (
                <div key={prescription.id} className="prescription-card">
                  <div className="prescription-header">
                    <h4>{prescription.medication_name}</h4>
                    <span className={`status-badge ${prescription.status.toLowerCase()}`}>
                      {prescription.status}
                    </span>
                  </div>
                  <div className="prescription-details">
                    <p><strong>Dosage:</strong> {prescription.dosage}</p>
                    <p><strong>Frequency:</strong> {prescription.frequency}</p>
                    <p><strong>Duration:</strong> {prescription.duration}</p>
                    <p><strong>Refills:</strong> {prescription.refills}</p>
                    <p><strong>Prescribed:</strong> {formatDate(prescription.date_prescribed)}</p>
                    <p><strong>Prescribed by:</strong> Dr. {prescription.doctor_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel title="Appointments">
          {appointments.length === 0 ? (
            <div className="no-data">No appointments available.</div>
          ) : (
            <div className="appointments-list">
              {appointments.map(appointment => (
                <div key={appointment.id} className="appointment-card">
                  <div className="appointment-header">
                    <h4>{formatDateTime(appointment.date_time)}</h4>
                    <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                      {appointment.status}
                    </span>
                  </div>
                  <div className="appointment-details">
                    <p><strong>Reason:</strong> {appointment.reason}</p>
                    {appointment.notes && <p><strong>Notes:</strong> {appointment.notes}</p>}
                    <p><strong>Doctor:</strong> Dr. {appointment.doctor_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabPanel>

        <TabPanel title="Contact Information">
          <div className="contact-info-section">
            <div className="info-card">
              <h4>Contact Details</h4>
              <p><strong>Phone:</strong> {patient.phone_number || 'Not provided'}</p>
              <p><strong>Email:</strong> {patient.email || 'Not provided'}</p>
              <p><strong>Address:</strong> {patient.address || 'Not provided'}</p>
            </div>
            <div className="info-card">
              <h4>Emergency Contact</h4>
              <p><strong>Name:</strong> {patient.emergency_contact_name || 'Not provided'}</p>
              <p><strong>Phone:</strong> {patient.emergency_contact_phone || 'Not provided'}</p>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
};

export default PatientDetail;
