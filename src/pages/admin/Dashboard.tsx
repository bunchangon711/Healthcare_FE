import React from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';

const AdminDashboard: React.FC = () => {
  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="dashboard-welcome">
        <h2>System Overview</h2>
        <p>Monitor and manage the healthcare system from this dashboard.</p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Active Users</h3>
            <span className="card-icon">👥</span>
          </div>
          <div className="card-value">152</div>
          <p className="card-description">Total active users in the system</p>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Appointments Today</h3>
            <span className="card-icon">📅</span>
          </div>
          <div className="card-value">47</div>
          <p className="card-description">Scheduled for today across all doctors</p>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">System Health</h3>
            <span className="card-icon">💓</span>
          </div>
          <div className="card-value">100%</div>
          <p className="card-description">All services operational</p>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Pending Approvals</h3>
            <span className="card-icon">⏳</span>
          </div>
          <div className="card-value">3</div>
          <p className="card-description">Doctor accounts awaiting approval</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>System Notifications</h3>
        <div className="notifications-list">
          <p>No critical notifications at this time.</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
