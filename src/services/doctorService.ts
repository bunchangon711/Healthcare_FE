import api from './api';
import authService from './authService';

export interface Doctor {
  id: number;
  user_id: number;
  full_name?: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth?: string;
  email?: string;
  phone_number?: string;
  license_number?: string;
  specialization: string;
  department: string;
  qualifications?: string;
  experience_years: number;
  is_available: boolean;
  bio?: string;
  profile_image?: string;
  hospital_affiliation?: string;
  consultation_fee?: number;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Diagnosis {
  id: number;
  patient_id: number;
  patient_name: string;
  visit_type: string;
  symptoms: string;
  diagnosis: string;
  treatment_plan: string;
  notes?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  created_at: string;
}

export interface AvailabilitySlot {
  id?: number;
  doctor_id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

// Add a type for slots that definitely have an id
export interface ExistingAvailabilitySlot extends AvailabilitySlot {
  id: number;
}

export interface PatientHistory {
  patient_id: number;
  patient_details: any;
  medical_records: any[];
  appointments: any[];
  prescriptions: any[];
  lab_tests: any[];
}

export interface TimeOffPeriod {
  id?: number;
  doctor_id?: number;
  start_date: string;
  end_date: string;
  reason: string;
}

const doctorService = {
  // Profile management
  getProfile: async (): Promise<Doctor> => {
    console.log('Calling getProfile API endpoint');
    try {
      const response = await api.get('/doctors/profile/');
      console.log('Doctor profile API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  },

  updateProfile: async (profileData: Partial<Doctor>): Promise<Doctor> => {
    console.log('Calling updateProfile API endpoint with data:', profileData);
    try {
      const response = await api.put('/doctors/profile/', profileData);
      console.log('Update profile API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  },

  // Availability management
  getAvailability: async (): Promise<AvailabilitySlot[]> => {
    console.log('Calling getAvailability API endpoint');
    try {
      const response = await api.get('/doctors/availability/');
      
      // Ensure we return an array
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object with results property
        if (Array.isArray(response.data.results)) {
          return response.data.results;
        }
        // If it's an empty object or doesn't have results
        return [];
      }
      // Default fallback
      return [];
    } catch (error) {
      console.error('Error in getAvailability:', error);
      return [];
    }
  },

  setAvailability: async (availabilityData: Omit<AvailabilitySlot, 'id' | 'doctor_id'>): Promise<AvailabilitySlot> => {
    console.log('Calling setAvailability API endpoint with data:', availabilityData);
    try {
      const response = await api.post('/doctors/set-availability/', availabilityData);
      console.log('Set availability API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in setAvailability:', error);
      throw error;
    }
  },

  updateAvailability: async (availabilityData: AvailabilitySlot): Promise<AvailabilitySlot> => {
    console.log('Calling updateAvailability API endpoint with data:', availabilityData);
    try {
      const response = await api.patch('/doctors/update-availability/', availabilityData);
      console.log('Update availability API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in updateAvailability:', error);
      throw error;
    }
  },

  // Time off management
  getTimeOff: async (): Promise<TimeOffPeriod[]> => {
    console.log('Calling getTimeOff API endpoint');
    try {
      // Check if token is expired and needs refresh
      if (authService.isTokenExpired()) {
        try {
          await authService.refreshToken();
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          return [];
        }
      }
      
      // Proceed with the API call
      const response = await api.get('/doctors/time-off/');
      console.log('Time off API response:', response.data);
      
      // Ensure we return an array
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object with results property
        if (Array.isArray(response.data.results)) {
          return response.data.results;
        }
        // If it's an empty object or doesn't have results
        return [];
      }
      // Default fallback
      return [];
    } catch (error: any) {
      console.error('Error in getTimeOff:', error);
      
      // Handle auth errors
      if (error.response && error.response.status === 401) {
        console.log('Authentication error in getTimeOff - token may be expired');
        
        // Clear tokens on auth failure and return empty result
        if (error.response.data?.code === 'token_not_valid') {
          authService.clearTokens();
        }
      }
      
      // Return empty array instead of throwing
      return [];
    }
  },

  addTimeOff: async (timeOffData: Omit<TimeOffPeriod, 'id' | 'doctor_id'>): Promise<TimeOffPeriod> => {
    try {
      const response = await api.post('/doctors/add-time-off/', timeOffData);
      return response.data;
    } catch (error) {
      console.error('Error adding time off:', error);
      throw error;
    }
  },

  // Patient management
  getPatients: async (): Promise<any[]> => {
    console.log('Calling getPatients API endpoint');
    try {
      const response = await api.get('/patients/');
      console.log('Patients API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getPatients:', error);
      throw error;
    }
  },

  getPatient: async (patientId: number): Promise<any> => {
    console.log(`Calling getPatient API endpoint for ID: ${patientId}`);
    try {
      const response = await api.get(`/patients/${patientId}/`);
      console.log('Single patient API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in getPatient for ID ${patientId}:`, error);
      throw error;
    }
  },

  getPatientHistory: async (patientId: number): Promise<PatientHistory> => {
    console.log(`Calling getPatientHistory API endpoint for ID: ${patientId}`);
    try {
      const response = await api.get(`/doctors/doctors/patient_history/?patient_id=${patientId}`);
      console.log('Patient history API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in getPatientHistory for ID ${patientId}:`, error);
      throw error;
    }
  },

  // Diagnosis management
  getPatientDiagnoses: async (patientId: number): Promise<Diagnosis[]> => {
    console.log(`Calling getPatientDiagnoses API endpoint for patient ID: ${patientId}`);
    try {
      const response = await api.get(`/doctors/diagnoses/?patient_id=${patientId}`);
      console.log('Patient diagnoses API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in getPatientDiagnoses for patient ID ${patientId}:`, error);
      throw error;
    }
  },

  createDiagnosis: async (patientId: number, diagnosisData: any): Promise<Diagnosis> => {
    console.log(`Calling createDiagnosis API endpoint for patient ID: ${patientId}`);
    try {
      const response = await api.post(`/doctors/doctors/diagnose_patient/`, {
        ...diagnosisData,
        patient_id: patientId
      });
      console.log('Create diagnosis API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in createDiagnosis for patient ID ${patientId}:`, error);
      throw error;
    }
  },

  // Prescription management
  createPrescription: async (patientId: number, prescriptionData: any): Promise<any> => {
    console.log(`Calling createPrescription API endpoint for patient ID: ${patientId}`);
    try {
      const response = await api.post(`/doctors/doctors/prescribe_medication/`, {
        ...prescriptionData,
        patient_id: patientId
      });
      console.log('Create prescription API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in createPrescription for patient ID ${patientId}:`, error);
      throw error;
    }
  },

  // Appointment management
  getAppointments: async (params?: { 
    start_date?: string; 
    end_date?: string; 
    status?: string;
  }): Promise<any[]> => {
    console.log('Calling getAppointments API endpoint with params:', params);
    try {
      // Get doctor profile to get the ID
      const doctorProfile = await doctorService.getProfile();
      const doctorId = doctorProfile.id || doctorProfile.user_id;
      
      // Add doctor_id to params
      const queryParams = { 
        ...params,
        doctor_id: doctorId 
      };
      
      console.log('Using query params:', queryParams);
      const response = await api.get('/appointments/appointments/', { params: queryParams });
      console.log('Doctor appointments API response:', response.data);
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.results)) {
          return response.data.results;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error in getAppointments:', error);
      return [];
    }
  },

  scheduleAppointment: async (appointmentData: any): Promise<any> => {
    console.log('Calling scheduleAppointment API endpoint with data:', appointmentData);
    try {
      const response = await api.post('/doctors/schedule/', appointmentData);
      console.log('Schedule appointment API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in scheduleAppointment:', error);
      throw error;
    }
  },

  // Order lab test for a patient
  orderLabTest: async (patientId: number, labTestData: any): Promise<any> => {
    console.log(`Calling orderLabTest API endpoint for patient ID: ${patientId}`);
    try {
      const response = await api.post(`/doctors/doctors/${patientId}/order-lab-test/`, labTestData);
      console.log('Order lab test API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in orderLabTest for patient ID ${patientId}:`, error);
      throw error;
    }
  },

  // Create medical report for a patient
  createMedicalReport: async (patientId: number, reportData: any): Promise<any> => {
    console.log(`Calling createMedicalReport API endpoint for patient ID: ${patientId}`);
    try {
      const response = await api.post(`/doctors/doctors/${patientId}/create-medical-report/`, reportData);
      console.log('Create medical report API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in createMedicalReport for patient ID ${patientId}:`, error);
      throw error;
    }
  },

  // Get medical reports for a patient
  getPatientMedicalReports: async (patientId: number): Promise<any[]> => {
    console.log(`Calling getPatientMedicalReports API endpoint for patient ID: ${patientId}`);
    try {
      const response = await api.get(`/doctors/doctors/${patientId}/medical-reports/`);
      console.log('Patient medical reports API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in getPatientMedicalReports for patient ID ${patientId}:`, error);
      throw error;
    }
  },

  // Generate PDF for a medical report
  generateReportPDF: async (reportId: number): Promise<Blob> => {
    console.log(`Calling generateReportPDF API endpoint for report ID: ${reportId}`);
    try {
      const response = await api.get(`/doctors/medical-reports/${reportId}/pdf/`, {
        responseType: 'blob'
      });
      console.log('Generate report PDF API response received');
      return response.data;
    } catch (error) {
      console.error(`Error in generateReportPDF for report ID ${reportId}:`, error);
      throw error;
    }
  },
};

export default doctorService;
