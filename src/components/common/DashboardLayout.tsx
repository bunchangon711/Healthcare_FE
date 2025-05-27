import React, { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/dashboard.css';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define navigation links based on user role
  const getNavLinks = () => {
    if (user?.role === 'DOCTOR') {
      return [
        { path: '/doctor', label: 'Dashboard', icon: '📊' },
        { path: '/doctor/profile', label: 'Profile', icon: '👤' },
        { path: '/doctor/patients', label: 'Patients', icon: '👥' },
        { path: '/doctor/appointments', label: 'Appointments', icon: '📅' },
        { path: '/doctor/availability', label: 'My Availability', icon: '🕒' },
        { path: '/doctor/prescriptions', label: 'Prescriptions', icon: '💊' },
        { path: '/doctor/lab-results', label: 'Lab Results', icon: '🔬' },
      ];
    } else if (user?.role === 'PATIENT') {
      return [
        { path: '/patient', label: 'Dashboard', icon: '📊' },
        { path: '/patient/profile', label: 'Profile', icon: '👤' },
        { path: '/patient/appointments', label: 'Appointments', icon: '📅' },
        { path: '/patient/records', label: 'Medical Records', icon: '📋' },
        { path: '/patient/prescriptions', label: 'Prescriptions', icon: '💊' },
        { path: '/patient/billing', label: 'Billing', icon: '💵' },
      ];
    } else if (user?.role === 'ADMIN') {
      return [
        { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/admin', label: 'Home', icon: '🏠' },
        { path: '/admin/users', label: 'User Management', icon: '👥' },
        { path: '/admin/doctors', label: 'Doctors', icon: '👨‍⚕️' },
        { path: '/admin/patients', label: 'Patients', icon: '🏥' },
        { path: '/admin/appointments', label: 'Appointments', icon: '📅' },
        { path: '/admin/reports', label: 'Reports', icon: '📈' },
        { path: '/admin/settings', label: 'System Settings', icon: '⚙️' },
      ];
    }
    
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''} ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="app-title">MedCare</h1>
          <div className="header-buttons">
            <button 
              className="toggle-sidebar-btn" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
            <button 
              className="close-mobile-menu" 
              onClick={() => setMobileMenuOpen(false)}
            >
              &times;
            </button>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link 
                  to={link.path} 
                  className={location.pathname === link.path ? 'active' : ''}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-icon">{link.icon}</span>
                  {sidebarOpen && <span className="nav-label">{link.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>
      
      <main className={`content-area ${sidebarOpen ? '' : 'expanded'}`}>
        <header className="content-header">
          <div className="header-left">
            <button 
              className="mobile-menu-toggle" 
              onClick={() => setMobileMenuOpen(true)}
            >
              ☰
            </button>
            
            <h1 className="page-title">{title}</h1>
          </div>
          
          <div className="user-info">
            {user && (
              <>
                <span className="welcome-text">
                  Welcome, {user.first_name} {user.last_name}
                </span>
                <div className="user-avatar">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <div className="user-details">
                  <span className="user-name">
                    {user.role === 'DOCTOR' ? 'Dr. ' : ''}{user.first_name} {user.last_name}
                  </span>
                  <span className="user-role">{user.role}</span>
                </div>
              </>
            )}
          </div>
        </header>
        
        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
