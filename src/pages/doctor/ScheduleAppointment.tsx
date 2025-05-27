import React from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import AppointmentScheduler from '../../components/doctor/AppointmentScheduler';
import '../../styles/doctor.css';

const ScheduleAppointmentPage: React.FC = () => {
  return (
    <DashboardLayout title="Schedule Appointment">
      <AppointmentScheduler />
    </DashboardLayout>
  );
};

export default ScheduleAppointmentPage;
