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

const OrderLabTest: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    test_type: 'BLOOD',
    description: '',
    notes: '',
    priority: 'NORMAL',
    required_fasting: false,
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
      const orderLabTestData = {
        ...formData,
        patient_id: parseInt(patientId),
      };
      
      await doctorService.orderLabTest(parseInt(patientId), orderLabTestData);
      setSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        test_type: 'BLOOD',
        description: '',
        notes: '',
        priority: 'NORMAL',
        required_fasting: false,
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/doctor/patients/${patientId}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error ordering lab test:', err);
      setError(err.response?.data?.detail || 'Failed to order lab test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!patient) return <div className="error-message">Patient not found</div>;

  return (
    <DashboardLayout title="Order Lab Test">
      <div className="lab-test-form-container">
        <div className="form-header">
          <button 
            onClick={() => navigate(`/doctor/patients/${patientId}`)}
            className="back-button"
          >
            &larr; Back to Patient
          </button>
          <h2>Order Lab Test for {patient.first_name} {patient.last_name}</h2>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Lab test ordered successfully!</div>}
        
        <form onSubmit={handleSubmit} className="lab-test-form">
          <div className="form-group">
            <label htmlFor="test_type">Test Type*</label>
            <select 
              id="test_type" 
              name="test_type"
              value={formData.test_type}
              onChange={handleChange}
              required
            >
              <option value="BLOOD">Blood Test</option>
              <option value="URINE">Urine Test</option>
              <option value="IMAGING">Imaging (X-Ray, CT, MRI)</option>
              <option value="PATHOLOGY">Pathology</option>
              <option value="CARDIOLOGY">Cardiology Test</option>
              <option value="NEUROLOGY">Neurology Test</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Test Description*</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe the specific tests needed"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="priority">Priority*</label>
            <select 
              id="priority" 
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
            >
              <option value="ROUTINE">Routine</option>
              <option value="URGENT">Urgent</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>
          
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="required_fasting"
                checked={formData.required_fasting}
                onChange={handleChange}
              />
              Fasting Required
            </label>
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special instructions or information"
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
              {submitting ? 'Ordering...' : 'Order Lab Test'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default OrderLabTest;
