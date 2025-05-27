import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import doctorService from '../../services/doctorService';
import '../../styles/doctor.css';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
}

const DiagnosisForm: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    visit_type: 'ROUTINE',
    symptoms: '',
    diagnosis: '',
    treatment_plan: '',
    notes: '',
    follow_up_required: false,
    follow_up_date: '',
  });

  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        const patientData = await doctorService.getPatient(parseInt(patientId));
        setPatient(patientData);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching patient:', err);
        setError('Failed to load patient data. Please try again later.');
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const diagnosisData = {
        ...formData,
        patient_id: parseInt(patientId),
        patient_name: patient ? `${patient.first_name} ${patient.last_name}` : ''
      };
      
      await doctorService.createDiagnosis(parseInt(patientId), diagnosisData);
      setSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        visit_type: 'ROUTINE',
        symptoms: '',
        diagnosis: '',
        treatment_plan: '',
        notes: '',
        follow_up_required: false,
        follow_up_date: '',
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/doctor/patients/${patientId}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating diagnosis:', err);
      setError(err.response?.data?.detail || 'Failed to create diagnosis. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!patient) return <div className="error-message">Patient not found</div>;

  return (
    <div className="diagnosis-form-container">
      <div className="form-header">
        <button 
          onClick={() => navigate(`/doctor/patients/${patientId}`)}
          className="back-button"
        >
          &larr; Back to Patient
        </button>
        <h2>New Diagnosis for {patient.first_name} {patient.last_name}</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Diagnosis created successfully!</div>}
      
      <form onSubmit={handleSubmit} className="diagnosis-form">
        <div className="form-group">
          <label htmlFor="visit_type">Visit Type*</label>
          <select 
            id="visit_type" 
            name="visit_type"
            value={formData.visit_type}
            onChange={handleChange}
            required
          >
            <option value="ROUTINE">Routine Check-up</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="SPECIALIST">Specialist Consultation</option>
            <option value="SURGERY">Surgery</option>
            <option value="VACCINATION">Vaccination</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="symptoms">Symptoms / Chief Complaint*</label>
          <textarea
            id="symptoms"
            name="symptoms"
            value={formData.symptoms}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="diagnosis">Diagnosis*</label>
          <textarea
            id="diagnosis"
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="treatment_plan">Treatment Plan*</label>
          <textarea
            id="treatment_plan"
            name="treatment_plan"
            value={formData.treatment_plan}
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
        
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="follow_up_required"
              checked={formData.follow_up_required}
              onChange={handleChange}
            />
            Follow-up Required
          </label>
        </div>
        
        {formData.follow_up_required && (
          <div className="form-group">
            <label htmlFor="follow_up_date">Follow-up Date*</label>
            <input
              type="date"
              id="follow_up_date"
              name="follow_up_date"
              value={formData.follow_up_date}
              onChange={handleChange}
              required={formData.follow_up_required}
              min={new Date().toISOString().split('T')[0]} // Today's date as minimum
            />
          </div>
        )}
        
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
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Save Diagnosis'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DiagnosisForm;
