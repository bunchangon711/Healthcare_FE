import React from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import PrescriptionForm from '../../components/doctor/PrescriptionForm';
import '../../styles/doctor.css';

const NewPrescriptionPage: React.FC = () => {
  return (
    <DashboardLayout title="New Prescription">
      <PrescriptionForm />
    </DashboardLayout>
  );
};

export default NewPrescriptionPage;
