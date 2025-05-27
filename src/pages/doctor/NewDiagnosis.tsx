import React from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import DiagnosisForm from '../../components/doctor/DiagnosisForm';
import '../../styles/doctor.css';

const NewDiagnosisPage: React.FC = () => {
  return (
    <DashboardLayout title="New Diagnosis">
      <DiagnosisForm />
    </DashboardLayout>
  );
};

export default NewDiagnosisPage;
