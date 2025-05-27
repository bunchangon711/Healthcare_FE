import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import doctorService from '../../services/doctorService';
import '../../styles/doctor.css';

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
}

const CreateMedicalReport: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    report_type: 'GENERAL',
    title: '',
    content: '',
    assessment: '',
    recommendations: '',
    share_with_patient: true,
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
      
      // We need to add this method to doctorService
      const reportData = {
        ...formData,
        patient_id: parseInt(patientId),
      };
      
      await doctorService.createMedicalReport(parseInt(patientId), reportData);
      setSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        report_type: 'GENERAL',
        title: '',
        content: '',
        assessment: '',
        recommendations: '',
        share_with_patient: true,
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/doctor/patients/${patientId}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error creating medical report:', err);
      setError(err.response?.data?.detail || 'Failed to create medical report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!patient) return <div className="error-message">Patient not found</div>;

  return (
    <DashboardLayout title="Create Medical Report">
      <div className="medical-report-form-container">
        <div className="form-header">
          <button 
            onClick={() => navigate(`/doctor/patients/${patientId}`)}
            className="back-button"
          >
            &larr; Back to Patient
          </button>
          <h2>Create Medical Report for {patient.first_name} {patient.last_name}</h2>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Medical report created successfully!</div>}
        
        <form onSubmit={handleSubmit} className="medical-report-form">
          <div className="form-group">
            <label htmlFor="report_type">Report Type*</label>
            <select 
              id="report_type" 
              name="report_type"
              value={formData.report_type}
              onChange={handleChange}
              required
            >
              <option value="GENERAL">General Medical Report</option>
              <option value="PROGRESS">Progress Note</option>
              <option value="DISCHARGE">Discharge Summary</option>
              <option value="CONSULTATION">Consultation Report</option>
              <option value="SURGICAL">Surgical Report</option>
              <option value="PHYSICAL_EXAM">Physical Examination</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="title">Report Title*</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Brief title describing this report"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="content">Report Content*</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Detailed observations, symptoms, and findings"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="assessment">Assessment*</label>
            <textarea
              id="assessment"
              name="assessment"
              value={formData.assessment}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Medical assessment and diagnosis"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="recommendations">Recommendations*</label>
            <textarea
              id="recommendations"
              name="recommendations"
              value={formData.recommendations}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Treatment recommendations and next steps"
            />
          </div>
          
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="share_with_patient"
                checked={formData.share_with_patient}
                onChange={handleChange}
              />
              Share with Patient
            </label>
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
              {submitting ? 'Creating...' : 'Create Medical Report'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateMedicalReport;
