import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import doctorService from '../../services/doctorService';
import '../../styles/doctor.css';

interface Patient {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  email?: string;
  phone_number?: string;
  last_visit_date?: string;
}

const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await doctorService.getPatients();
        // Ensure data is an array before setting state
        setPatients(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients. Please try again later.');
        // Set empty array on error to prevent filter function error
        setPatients([]);
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handlePatientClick = (patientId: number) => {
    navigate(`/doctor/patients/${patientId}`);
  };

  const filteredPatients = patients.filter(patient => 
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone_number?.includes(searchTerm)
  );

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) return <div className="loading-state">Loading patients...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="patient-list-container">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search patients by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <div className="no-results">No patients found matching your search.</div>
      ) : (
        <div className="patient-grid">
          {filteredPatients.map(patient => (
            <div 
              key={patient.id} 
              className="patient-card"
              onClick={() => handlePatientClick(patient.id)}
            >
              <div className="patient-avatar">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div className="patient-info">
                <h3>{patient.first_name} {patient.last_name}</h3>
                <p>Age: {calculateAge(patient.date_of_birth)}</p>
                <p>Gender: {patient.gender}</p>
                {patient.phone_number && <p>Phone: {patient.phone_number}</p>}
              </div>
              <div className="patient-actions">
                <button className="view-records-btn">View Records</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientList;
