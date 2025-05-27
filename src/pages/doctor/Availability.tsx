import React from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import AvailabilityManager from '../../components/doctor/AvailabilityManager';
import '../../styles/doctor.css';

const AvailabilityPage: React.FC = () => {
  return (
    <DashboardLayout title="Manage Availability">
      <div className="availability-page-container">
        <div className="page-header">
          <h2>Manage Your Availability</h2>
          <p>Set your working hours and time off periods to help patients schedule appointments efficiently.</p>
        </div>
        <AvailabilityManager />
      </div>
    </DashboardLayout>
  );
};

export default AvailabilityPage;
