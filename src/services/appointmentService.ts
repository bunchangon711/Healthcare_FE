import api from './api';
import authService from './authService';
import patientService from './patientService';

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  patient_name?: string;
  doctor_name?: string;
  date_time: string;
  duration_minutes: number;
  appointment_type: 'REGULAR' | 'FOLLOW_UP' | 'SPECIALIST' | 'EMERGENCY' | 'PROCEDURE' | 'VACCINATION' | 'THERAPY';
  reason: string;
  notes?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  created_at?: string;
  updated_at?: string;
  reminder_sent?: boolean;
}

export interface AvailabilitySlot {
  id?: number;
  doctor_id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface TimeSlot {
  time: string;
  formatted_time: string;
}

export interface Doctor {
  id: number;
  user_id: number;
  full_name?: string;
  first_name: string;
  last_name: string;
  specialization: string;
  department: string;
  is_available: boolean;
  profile_image?: string;
  qualifications?: string;
  experience_years?: number;
}

const appointmentService = {
  // Get all appointments (with optional filtering)
  getAppointments: async (params?: { 
    patient_id?: number; 
    doctor_id?: number; 
    status?: string;
    signal?: AbortSignal;
  }): Promise<Appointment[]> => {
    console.log('Calling getAppointments API endpoint with params:', params);
    try {
      const { signal, ...queryParams } = params || {};
      
      // Ensure we're sending the correct parameters format
      const response = await api.get('/appointments/appointments/', { 
        params: queryParams, 
        signal 
      });
      
      console.log('Appointments API response:', response.data);
      
      // Handle different response formats
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

  // Update the method for getting today's appointments with better token handling
  getTodayAppointments: async (signal?: AbortSignal): Promise<Appointment[]> => {
    console.log('Calling getTodayAppointments API endpoint');
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
      
      const response = await api.get('/appointments/appointments/today/', { signal });
      console.log('Today appointments API response:', response.data);
      return response.data;
    } catch (error: any) {
      // Check if this is a canceled request (AbortError)
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('Request was canceled', error);
        return []; // Return empty array for canceled requests
      }
      
      // Handle auth errors
      if (error.response && error.response.status === 401) {
        console.log('Authentication error in getTodayAppointments - token may be expired');
        
        // Clear tokens on auth failure and return empty result
        if (error.response.data?.code === 'token_not_valid') {
          authService.clearTokens();
        }
      }
      
      console.error('Error in getTodayAppointments:', error);
      // Return empty array instead of throwing to prevent component crashes
      return [];
    }
  },

  // Get a single appointment by ID
  getAppointment: async (appointmentId: number): Promise<Appointment> => {
    console.log(`Calling getAppointment API endpoint for ID: ${appointmentId}`);
    try {
      const response = await api.get(`/appointments/appointments/${appointmentId}/`);
      console.log('Single appointment API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in getAppointment for ID ${appointmentId}:`, error);
      throw error;
    }
  },

  // Create a new appointment
  createAppointment: async (appointmentData: Partial<Appointment>): Promise<Appointment> => {
    console.log('=== CREATE APPOINTMENT DEBUG ===');
    console.log('Original appointment data:', appointmentData);
    
    try {

    // Get patient profile to ensure consistent ID usage
    const patientProfile = await patientService.getProfile();
    // Create a copy with the correct patient ID (same one used for retrieval)
    const formattedData = { 
      ...appointmentData,
      patient_id: patientProfile.id // Use the same ID field used for retrieving appointments
    };

    // Log the formatted data before sending
    console.log('Formatted data being sent to API:', formattedData);
    console.log('Request headers that will be sent:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    });
      
      // Enhanced patient_id handling - ensure it's a number, not an array
      if (formattedData.patient_id !== undefined) {
        if (Array.isArray(formattedData.patient_id)) {
          // If it's an array, take the first element
          formattedData.patient_id = Number(formattedData.patient_id[0]);
          console.log('Converted patient_id from array to number:', formattedData.patient_id);
        } else if (typeof formattedData.patient_id === 'string') {
          // If it's a string, convert to number
          formattedData.patient_id = Number(formattedData.patient_id);
          console.log('Converted patient_id from string to number:', formattedData.patient_id);
        }
      } else {
        // Patient ID is required for appointment creation
        throw new Error('Patient ID is required for appointment creation');
      }
      
      // Enhanced doctor_id handling - ensure it's a number, not an array
      if (formattedData.doctor_id !== undefined) {
        if (Array.isArray(formattedData.doctor_id)) {
          // If it's an array, take the first element
          formattedData.doctor_id = Number(formattedData.doctor_id[0]);
          console.log('Converted doctor_id from array to number:', formattedData.doctor_id);
        } else if (typeof formattedData.doctor_id === 'string') {
          // If it's a string, convert to number
          formattedData.doctor_id = Number(formattedData.doctor_id);
          console.log('Converted doctor_id from string to number:', formattedData.doctor_id);
        }
      } else {
        // Doctor ID is required for appointment creation
        throw new Error('Doctor ID is required for appointment creation');
      }
      
      // Validate that both IDs are valid numbers
      if (isNaN(formattedData.patient_id) || isNaN(formattedData.doctor_id)) {
        throw new Error('Invalid patient_id or doctor_id provided');
      }
      
      console.log('Sending formatted data:', formattedData);
      const response = await api.post('/appointments/appointments/', formattedData);
      console.log('Create appointment API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in createAppointment:', error);
      console.error('Request config:', error.config);
      console.error('Response status:', error.response?.status);
      console.error('Response headers:', error.response?.headers);
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
      throw error;
    }
  },

  // Update an existing appointment
  updateAppointment: async (appointmentId: number, appointmentData: Partial<Appointment>): Promise<Appointment> => {
    console.log(`Calling updateAppointment API endpoint for ID: ${appointmentId}`);
    try {
      const response = await api.put(`/appointments/appointments/${appointmentId}/`, appointmentData);
      console.log('Update appointment API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in updateAppointment for ID ${appointmentId}:`, error);
      throw error;
    }
  },

  // Cancel an appointment
  cancelAppointment: async (appointmentId: number): Promise<Appointment> => {
    console.log(`Calling cancelAppointment API endpoint for ID: ${appointmentId}`);
    try {
      const response = await api.patch(`/appointments/appointments/${appointmentId}/cancel/`, {});
      console.log('Cancel appointment API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in cancelAppointment for ID ${appointmentId}:`, error);
      throw error;
    }
  },

  // Mark an appointment as completed
  completeAppointment: async (appointmentId: number): Promise<Appointment> => {
    console.log(`Calling completeAppointment API endpoint for ID: ${appointmentId}`);
    try {
      const response = await api.patch(`/appointments/appointments/${appointmentId}/complete/`, {});
      console.log('Complete appointment API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in completeAppointment for ID ${appointmentId}:`, error);
      throw error;
    }
  },

  // Mark a patient as no-show
  markNoShow: async (appointmentId: number): Promise<Appointment> => {
    console.log(`Calling markNoShow API endpoint for ID: ${appointmentId}`);
    try {
      const response = await api.patch(`/appointments/appointments/${appointmentId}/no-show/`, {});
      console.log('No-show appointment API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in markNoShow for ID ${appointmentId}:`, error);
      throw error;
    }
  },

  // Get available appointment slots for a doctor
  getAvailableSlots: async (doctorId: number, date?: string): Promise<TimeSlot[]> => {
    console.log(`Calling getAvailableSlots API endpoint for doctor ${doctorId}, date ${date}`);
    try {
      // Construct proper query parameters
      const params: any = {
        doctor_id: doctorId
      };
      
      if (date) {
        params.date = date;
      }
      
      // Use the direct endpoint path instead of the nested one for more reliable routing
      const url = '/available-slots/';
      console.log(`Making request to: ${url} with params:`, params);
      console.log(`Authorization header present: ${!!localStorage.getItem('access_token')}`);
      
      const response = await api.get(url, { params });
      
      // Check if response is valid
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response data:', response.data);
      
      if (!response.data) {
        console.log('Empty response from available slots API');
        return [];
      }
      
      console.log('Available time slots API response:', response.data);
      console.log('Is response an array?', Array.isArray(response.data));
      console.log('Response length:', Array.isArray(response.data) ? response.data.length : 'not an array');
      
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error(`Error in getAvailableSlots for doctor ${doctorId}:`, error);
      console.error(`Error response status: ${error.response?.status}`);
      console.error(`Error response data:`, error.response?.data);
      console.error(`Request URL: ${error.config?.url}`);
      console.error(`Request params: ${JSON.stringify(error.config?.params)}`);
      // Return empty array instead of throwing to prevent component crashes
      return [];
    }
  },

  // Doctor availability management
  getDoctorAvailability: async (doctorId: number): Promise<AvailabilitySlot[]> => {
    console.log('Calling getDoctorAvailability API endpoint');
    try {
      const response = await api.get(`/doctors/doctors/${doctorId}/availability/`);
      console.log('Doctor availability API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getDoctorAvailability:', error);
      throw error;
    }
  },

  setDoctorAvailability: async (availabilityData: Partial<AvailabilitySlot>): Promise<AvailabilitySlot> => {
    console.log('Calling setDoctorAvailability API endpoint with data:', availabilityData);
    try {
      const response = await api.post('/doctors/set-availability/', availabilityData);
      console.log('Set doctor availability API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in setDoctorAvailability:', error);
      throw error;
    }
  },

  updateDoctorAvailability: async (slotId: number, availabilityData: Partial<AvailabilitySlot>): Promise<AvailabilitySlot> => {
    console.log('Calling updateDoctorAvailability API endpoint with data:', availabilityData);
    try {
      const response = await api.patch('/doctors/update-availability/', { ...availabilityData, id: slotId });
      console.log('Update doctor availability API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in updateDoctorAvailability:', error);
      throw error;
    }
  },

  // Get available doctors for appointments with availability checking
  getAvailableDoctors: async (params?: { 
    specialization?: string;
    department?: string;
    date?: string;
  }): Promise<Doctor[]> => {
    console.log('Calling getAvailableDoctors API endpoint with params:', params);
    try {
      // Use the doctors endpoint with availability filters
      const response = await api.get('/doctors/doctors/available_doctors/', {
        params: {
          is_available: true,
          ...params
        }
      });
      console.log('Available doctors API response:', response.data);
      // Ensure we always return an array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error in getAvailableDoctors:', error);
      // Return empty array on error to prevent map function error
      return [];
    }
  },

  // Get doctor availability slots
  getDoctorAvailabilitySlots: async (doctorId: number): Promise<AvailabilitySlot[]> => {
    console.log(`Calling getDoctorAvailabilitySlots for doctor: ${doctorId}`);
    try {
      const response = await api.get('/doctors/doctors/availability/', {
        params: { doctor_id: doctorId }
      });
      console.log('Doctor availability slots response:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`Error getting availability slots for doctor ${doctorId}:`, error);
      return [];
    }
  }
};

export default appointmentService;
