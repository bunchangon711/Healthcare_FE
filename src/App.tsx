import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import './App.css';

// Import landing page
import LandingPage from './pages/LandingPage';

// Import pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import PatientDashboard from './pages/patient/Dashboard';
import PatientProfile from './pages/patient/Profile';
import MedicalRecords from './pages/patient/MedicalRecords';
import Appointments from './pages/patient/Appointments';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorProfile from './pages/doctor/DoctorProfile';
import PatientList from './pages/doctor/PatientList';
import PatientDetail from './pages/doctor/PatientDetails';
import NewDiagnosis from './pages/doctor/NewDiagnosis';
import NewPrescription from './pages/doctor/NewPrescription';
import ScheduleAppointment from './pages/doctor/ScheduleAppointment';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorAvailability from './pages/doctor/DoctorAvailability';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';
import LabResults from './pages/doctor/LabResults';
import AdminDashboard from './pages/admin/Dashboard';

// Import new pages
import Bills from './pages/patient/Bills';
import OrderLabTest from './pages/doctor/OrderLabTest';
import CreateMedicalReport from './pages/doctor/CreateMedicalReport';

// Placeholder for pages not yet implemented
const NotFound = () => <div className="not-found"><h1>404 - Page Not Found</h1></div>;
const Unauthorized = () => <div className="unauthorized"><h1>401 - Unauthorized Access</h1></div>;

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/password-reset-confirm/:token" element={<ResetPassword />} />
          
          {/* Dashboard redirect based on role */}
          <Route path="/dashboard" element={<RoleBasedRedirect />} />
          
          {/* Role-based private routes */}
          {/* Patient routes */}
          <Route element={<PrivateRoute allowedRoles={['PATIENT']} />}>
            <Route path="/patient" element={<PatientDashboard />} />
            <Route path="/patient/profile" element={<PatientProfile />} />
            <Route path="/patient/records" element={<MedicalRecords />} />
            <Route path="/patient/appointments" element={<Appointments />} />
            <Route path="/patient/billing" element={<Bills />} />
            <Route path="/patient/bills" element={<Bills />} />
            <Route path="/patient/bills/:billId" element={<Bills />} />
          </Route>
          
          {/* Doctor routes */}
          <Route element={<PrivateRoute allowedRoles={['DOCTOR']} />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/profile" element={<DoctorProfile />} />
            <Route path="/doctor/patients" element={<PatientList />} />
            <Route path="/doctor/patients/:patientId" element={<PatientDetail />} />
            <Route path="/doctor/patients/:patientId/diagnose" element={<NewDiagnosis />} />
            <Route path="/doctor/patients/:patientId/prescribe" element={<NewPrescription />} />
            <Route path="/doctor/patients/:patientId/schedule" element={<ScheduleAppointment />} />
            <Route path="/doctor/patients/:patientId/order-lab-test" element={<OrderLabTest />} />
            <Route path="/doctor/patients/:patientId/create-report" element={<CreateMedicalReport />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/doctor/availability" element={<DoctorAvailability />} />
            <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
            <Route path="/doctor/lab-results" element={<LabResults />} />
          </Route>
          
          {/* Admin routes */}
          <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>
          
          {/* Error routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/not-found" element={<NotFound />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/not-found" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

// Helper component to redirect based on user role
const RoleBasedRedirect: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  switch (user?.role) {
    case 'PATIENT':
      return <Navigate to="/patient" />;
    case 'DOCTOR':
      return <Navigate to="/doctor" />;
    case 'NURSE':
      return <Navigate to="/nurse" />;
    case 'ADMIN':
      return <Navigate to="/admin" />;
    case 'PHARMACIST':
      return <Navigate to="/pharmacy" />;
    case 'INSURANCE_PROVIDER':
      return <Navigate to="/insurance" />;
    case 'LAB_TECHNICIAN':
      return <Navigate to="/lab" />;
    default:
      return <Navigate to="/login" />;
  }
};

export default App;
