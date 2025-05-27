import React from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import '../../styles/doctor.css';

const DoctorPrescriptions: React.FC = () => {
  return (
    <DashboardLayout title="Prescriptions">
      <div className="prescriptions-container">
        <h2>Prescription Management</h2>
        <p>View and manage all prescriptions you've created.</p>
        
        {/* Prescription list UI will be implemented here */}
        <div className="placeholder-message">
          Prescription management features coming soon...
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorPrescriptions;
