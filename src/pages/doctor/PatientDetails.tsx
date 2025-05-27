import React from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import PatientDetail from '../../components/doctor/PatientDetail';
import '../../styles/doctor.css';

const PatientDetailsPage: React.FC = () => {
  return (
    <DashboardLayout title="Patient Details">
      <PatientDetail />
    </DashboardLayout>
  );
};

export default PatientDetailsPage;
