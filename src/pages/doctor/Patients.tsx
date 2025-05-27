import React from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import PatientList from '../../components/doctor/PatientList';
import '../../styles/doctor.css';

const PatientsPage: React.FC = () => {
  return (
    <DashboardLayout title="Patients">
      <div className="patients-page-container">
        <div className="page-header">
          <h2>Your Patients</h2>
          <p>View and manage your patients' health records.</p>
        </div>
        <PatientList />
      </div>
    </DashboardLayout>
  );
};

export default PatientsPage;
