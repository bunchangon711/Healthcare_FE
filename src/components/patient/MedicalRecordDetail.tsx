import React from 'react';
import { MedicalRecord } from '../../services/patientService';

interface MedicalRecordDetailProps {
  record: MedicalRecord;
  onBack: () => void;
}

const MedicalRecordDetail: React.FC<MedicalRecordDetailProps> = ({ record, onBack }) => {
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

  return (
    <div className="medical-record-detail">
      <button onClick={onBack} className="back-button">
        ← Back to Records
      </button>
      
      <div className="record-header">
        {/* <h2>{getVisitTypeLabel(record.visit_type)} - {formatDate(record.date)}</h2> */}
        <span className="doctor-info">Dr. {record.doctor_name || 'Unknown'}</span>
      </div>
      
      <div className="record-section">
        <h3>Diagnosis</h3>
        <p className="diagnosis-text">{record.diagnosis}</p>
      </div>
      
      <div className="record-section">
        <h3>Treatment</h3>
        <p className="treatment-text">{record.treatment}</p>
      </div>
      
      {record.notes && (
        <div className="record-section">
          <h3>Additional Notes</h3>
          <p className="notes-text">{record.notes}</p>
        </div>
      )}
      
      {/* {record.follow_up_required && (
        <div className="record-section follow-up-section">
          <h3>Follow-Up Required</h3>
          <div className="follow-up-info">
            <span className="follow-up-date">Date: {formatDate(record.follow_up_date)}</span>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default MedicalRecordDetail;
