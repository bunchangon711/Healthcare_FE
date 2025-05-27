import api from './api';

export interface Patient {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_type?: string;
  allergies?: string;
  medical_conditions?: string;
  phone_number?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  doctor_id: number;
  date: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  doctor_name?: string;
  visit_type?: string;
  chief_complaint?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  vitals?: {
    temperature?: number;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    pulse_rate?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
  };
}

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

export interface Prescription {
  id: number;
  patient_id: number;
  doctor_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  date_prescribed: string;
  refills: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface Bill {
  id: number;
  invoice_number: string;
  patient_id: number;
  issue_date: string;
  due_date: string;
  total_amount: number;
  balance_due: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  items?: BillItem[];
}

export interface BillItem {
  id: number;
  bill_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Payment {
  id: number;
  bill_id: number;
  amount: number;
  payment_method: string;
  payment_date: string;
  transaction_id?: string;
}

const patientService = {
  // Get patient's appointments
  getAppointments: async (signal?: AbortSignal): Promise<Appointment[]> => {
    console.log('Calling getAppointments API endpoint for patient');
    try {
      // First get the patient profile to get their ID
      const profile = await patientService.getProfile(signal);
      
      // Get both potential ID fields
      const patientId = profile.id;
      
      console.log('Fetching appointments for patient ID:', patientId);
      
      // Make a single request with the patient_id (which matches what we used in appointment creation)
      const response = await api.get('/appointments/appointments/', { 
        params: { patient_id: patientId },
        signal 
      });
      
      console.log('Patient appointments API response:', response.data);
      
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
      console.error('Error in patient getAppointments:', error);
      return [];
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

  // Get patient profile
  getProfile: async (signal?: AbortSignal): Promise<any> => {
    console.log('Calling getProfile API endpoint for patient');
    try {
      const response = await api.get('/patients/profile/', { signal });
      console.log('Patient profile API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in patient getProfile:', error);
      throw error;
    }
  },

  // Update patient profile
  updateProfile: async (profileData: any): Promise<any> => {
    console.log('Calling updateProfile API endpoint for patient');
    try {
      const response = await api.put('/patients/profile/', profileData);
      console.log('Update patient profile API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in patient updateProfile:', error);
      throw error;
    }
  },

  // Get patient's medical records
  getMedicalRecords: async (signal?: AbortSignal): Promise<MedicalRecord[]> => {
    console.log('Calling getMedicalRecords API endpoint for patient');
    try {
      const response = await api.get('/patients/medical-records/', { signal });
      console.log('Patient medical records API response:', response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error in patient getMedicalRecords:', error);
      throw error;
    }
  },

  // Get specific medical record
  getMedicalRecord: async (recordId: number): Promise<MedicalRecord> => {
    console.log(`Calling getMedicalRecord API endpoint for record ID: ${recordId}`);
    try {
      const response = await api.get(`/patients/medical-records/${recordId}/`);
      console.log('Patient medical record API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error in patient getMedicalRecord for ID ${recordId}:`, error);
      throw error;
    }
  }
};

export default patientService;
