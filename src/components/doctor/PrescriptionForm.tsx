import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import doctorService from '../../services/doctorService';
import '../../styles/doctor.css';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
}

interface Diagnosis {
  id: number;
  diagnosis: string;
  created_at: string;
}

const PrescriptionForm: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    diagnosis_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    refills: 0,
    instructions: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        // Fetch patient details
        const patientData = await doctorService.getPatient(parseInt(patientId));
        setPatient(patientData);
        
        // Fetch patient diagnoses
        const diagnosesData = await doctorService.getPatientDiagnoses(parseInt(patientId));
        setDiagnoses(diagnosesData);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'refills' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const prescriptionData = {
        ...formData,
        patient_id: parseInt(patientId),
        diagnosis_id: formData.diagnosis_id ? parseInt(formData.diagnosis_id) : null
      };
      
      await doctorService.createPrescription(parseInt(patientId), prescriptionData);
      setSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        diagnosis_id: '',
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        refills: 0,
        instructions: '',
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/doctor/patients/${patientId}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating prescription:', err);
      setError(err.response?.data?.detail || 'Failed to create prescription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!patient) return <div className="error-message">Patient not found</div>;

  return (
    <div className="prescription-form-container">
      <div className="form-header">
        <button 
          onClick={() => navigate(`/doctor/patients/${patientId}`)}
          className="back-button"
        >
          &larr; Back to Patient
        </button>
        <h2>Prescribe Medication for {patient.first_name} {patient.last_name}</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Prescription created successfully!</div>}
      
      <form onSubmit={handleSubmit} className="prescription-form">
        <div className="form-group">
          <label htmlFor="diagnosis_id">Related Diagnosis (Optional)</label>
          <select 
            id="diagnosis_id" 
            name="diagnosis_id"
            value={formData.diagnosis_id}
            onChange={handleChange}
          >
            <option value="">-- Select a diagnosis --</option>
            {diagnoses.map(diagnosis => (
              <option key={diagnosis.id} value={diagnosis.id}>
                {diagnosis.diagnosis} ({new Date(diagnosis.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="medication_name">Medication Name*</label>
          <input
            type="text"
            id="medication_name"
            name="medication_name"
            value={formData.medication_name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dosage">Dosage*</label>
            <input
              type="text"
              id="dosage"
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
              placeholder="e.g., 500mg"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="frequency">Frequency*</label>
            <input
              type="text"
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              placeholder="e.g., Twice daily"
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="duration">Duration*</label>
            <input
              type="text"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 10 days"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="refills">Refills</label>
            <input
              type="number"
              id="refills"
              name="refills"
              min="0"
              value={formData.refills}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="instructions">Special Instructions</label>
          <textarea
            id="instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            placeholder="Additional instructions for patient (e.g., Take with food)"
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
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Create Prescription'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrescriptionForm;
