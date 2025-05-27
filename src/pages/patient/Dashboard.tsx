import React from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout title="Patient Dashboard">
      <div className="dashboard-welcome">
        <h2>Welcome back, {user?.first_name}!</h2>
        <p>Here's an overview of your health information and upcoming appointments.</p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Appointments</h3>
            <span className="card-icon">📅</span>
          </div>
          <div className="card-value">2</div>
          <p className="card-description">You have 2 upcoming appointments this month</p>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Prescriptions</h3>
            <span className="card-icon">💊</span>
          </div>
          <div className="card-value">3</div>
          <p className="card-description">Active prescriptions that need refills</p>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Lab Results</h3>
            <span className="card-icon">🔬</span>
          </div>
          <div className="card-value">1</div>
          <p className="card-description">New lab result available for review</p>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Bills</h3>
            <span className="card-icon">💵</span>
          </div>
          <div className="card-value">$150</div>
          <p className="card-description">Outstanding balance</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <p>No recent activity to display.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
