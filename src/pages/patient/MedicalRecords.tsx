import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import patientService from '../../services/patientService';
import '../../styles/medicalRecords.css';

const MedicalRecords: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [viewingDetails, setViewingDetails] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchMedicalRecords = async () => {
      try {
        const data = await patientService.getMedicalRecords(abortController.signal);
        if (isMounted) {
          setRecords(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          console.error('Error fetching medical records:', err);
          setError('Failed to load medical records. Please try again later.');
          setLoading(false);
        }
      }
    };

    fetchMedicalRecords();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  const handleViewDetails = async (recordId: number) => {
    setLoading(true);
    try {
      const record = await patientService.getMedicalRecord(recordId);
      setSelectedRecord(record);
      setViewingDetails(true);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching record details:', err);
      setError('Failed to load record details. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    setViewingDetails(false);
    setSelectedRecord(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getVisitTypeLabel = (visitType: string) => {
    const visitTypeMap: {[key: string]: string} = {
      'ROUTINE': 'Routine Check-up',
      'EMERGENCY': 'Emergency',
      'FOLLOW_UP': 'Follow-up',
      'SPECIALIST': 'Specialist Consultation',
      'SURGERY': 'Surgery',
      'VACCINATION': 'Vaccination',
    };
    return visitTypeMap[visitType] || visitType;
  };

  if (loading) {
    return (
      <DashboardLayout title="Medical Records">
        <div className="loading-state">Loading medical records...</div>
      </DashboardLayout>
    );
  }

  // Display medical record details
  if (viewingDetails && selectedRecord) {
    return (
      <DashboardLayout title="Medical Record Details">
        <div className="record-detail-container">
          <button onClick={handleBack} className="back-button">
            ← Back to Records
          </button>
          
          <div className="record-header">
            <h2>{getVisitTypeLabel(selectedRecord.visit_type)} - {formatDate(selectedRecord.date)}</h2>
            <span className="doctor-info">Dr. {selectedRecord.doctor_name || 'Unknown'}</span>
          </div>
          
          {error && <div className="error-message">{error}</div>}

          <div className="record-detail-section">
            <h3>Visit Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Date</span>
                <span className="detail-value">{formatDate(selectedRecord.date)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Visit Type</span>
                <span className="detail-value">{getVisitTypeLabel(selectedRecord.visit_type)}</span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label">Chief Complaint</span>
                <span className="detail-value">{selectedRecord.chief_complaint}</span>
              </div>
            </div>
          </div>
          
          <div className="record-detail-section">
            <h3>Medical Assessment</h3>
            <div className="detail-grid">
              <div className="detail-item full-width">
                <span className="detail-label">Diagnosis</span>
                <span className="detail-value">{selectedRecord.diagnosis}</span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label">Treatment</span>
                <span className="detail-value">{selectedRecord.treatment}</span>
              </div>
              {selectedRecord.notes && (
                <div className="detail-item full-width">
                  <span className="detail-label">Additional Notes</span>
                  <span className="detail-value">{selectedRecord.notes}</span>
                </div>
              )}
            </div>
          </div>
          
          {selectedRecord.vitals && (
            <div className="record-detail-section">
              <h3>Vital Signs</h3>
              <div className="detail-grid">
                {selectedRecord.vitals.temperature && (
                  <div className="detail-item">
                    <span className="detail-label">Temperature</span>
                    <span className="detail-value">{selectedRecord.vitals.temperature}°C</span>
                  </div>
                )}
                {(selectedRecord.vitals.blood_pressure_systolic && selectedRecord.vitals.blood_pressure_diastolic) && (
                  <div className="detail-item">
                    <span className="detail-label">Blood Pressure</span>
                    <span className="detail-value">{selectedRecord.vitals.blood_pressure_systolic}/{selectedRecord.vitals.blood_pressure_diastolic} mmHg</span>
                  </div>
                )}
                {selectedRecord.vitals.pulse_rate && (
                  <div className="detail-item">
                    <span className="detail-label">Heart Rate</span>
                    <span className="detail-value">{selectedRecord.vitals.pulse_rate} BPM</span>
                  </div>
                )}
                {selectedRecord.vitals.respiratory_rate && (
                  <div className="detail-item">
                    <span className="detail-label">Respiratory Rate</span>
                    <span className="detail-value">{selectedRecord.vitals.respiratory_rate} breaths/min</span>
                  </div>
                )}
                {selectedRecord.vitals.oxygen_saturation && (
                  <div className="detail-item">
                    <span className="detail-label">Oxygen Saturation</span>
                    <span className="detail-value">{selectedRecord.vitals.oxygen_saturation}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {selectedRecord.follow_up_required && (
            <div className="record-detail-section follow-up">
              <h3>Follow-Up Information</h3>
              <div className="follow-up-details">
                <span className="follow-up-label">Follow-up required by:</span>
                <span className="follow-up-date">{formatDate(selectedRecord.follow_up_date)}</span>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Display medical records list
  return (
    <DashboardLayout title="Medical Records">
      <div className="medical-records-container">
        <div className="records-header">
          <h2>Your Medical History</h2>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {records.length === 0 && !loading && !error ? (
          <div className="no-records">
            <p>No medical records found.</p>
          </div>
        ) : (
          <div className="records-list">
            <div className="records-table">
              <div className="table-header">
                <div className="header-cell date">Date</div>
                <div className="header-cell visit-type">Visit Type</div>
                <div className="header-cell diagnosis">Diagnosis</div>
                <div className="header-cell doctor">Doctor</div>
                <div className="header-cell follow-up">Follow Up</div>
                <div className="header-cell actions">Actions</div>
              </div>
              
              {records.map((record) => (
                <div className="table-row" key={record.id}>
                  <div className="cell date">{formatDate(record.date)}</div>
                  <div className="cell visit-type">{getVisitTypeLabel(record.visit_type)}</div>
                  <div className="cell diagnosis">{record.diagnosis}</div>
                  <div className="cell doctor">Dr. {record.doctor_name || 'Unknown'}</div>
                  <div className="cell follow-up">
                    {record.follow_up_required ? (
                      <span className="follow-up-badge">
                        {formatDate(record.follow_up_date)}
                      </span>
                    ) : (
                      <span className="no-follow-up">None</span>
                    )}
                  </div>
                  <div className="cell actions">
                    <button 
                      className="view-button" 
                      onClick={() => handleViewDetails(record.id)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MedicalRecords;
