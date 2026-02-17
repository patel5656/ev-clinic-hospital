import api from './api';

export const clinicService = {
    getStats: async () => {
        return api.get('/clinic/stats');
    },

    getClinicDetails: async () => {
        return api.get('/clinic/details');
    },

    getStaff: async () => {
        return api.get('/clinic/staff');
    },

    createStaff: async (data: any) => {
        return api.post('/clinic/staff', data);
    },

    updateStaff: async (id: number, data: any) => {
        return api.patch(`/clinic/staff/${id}`, data);
    },

    deleteStaff: async (id: number) => {
        return api.delete(`/clinic/staff/${id}`);
    },

    getActivities: async () => {
        return api.get('/clinic/activities');
    },

    // Form Templates (New API)
    getFormTemplates: async () => {
        return api.get('/forms/templates');
    },

    createFormTemplate: async (data: any) => {
        return api.post('/forms/templates', data);
    },

    updateFormTemplate: async (id: number, data: any) => {
        return api.patch(`/forms/templates/${id}`, data);
    },

    deleteFormTemplate: async (id: number) => {
        return api.delete(`/forms/templates/${id}`);
    },

    // Form Responses
    submitResponse: async (data: any) => {
        return api.post('/forms/responses', data);
    },

    getPatientResponses: async (patientId: number) => {
        return api.get(`/forms/patient/${patientId}/responses`);
    },

    getResponseById: async (id: number) => {
        return api.get(`/forms/responses/${id}`);
    },

    // Booking Configuration
    getBookingConfig: async () => {
        return api.get('/clinic/booking-config');
    },

    getDoctorAvailability: async (doctorId: number) => {
        return api.get(`/clinic/booking-config/doctor/${doctorId}`);
    },

    updateBookingConfig: async (config: any) => {
        return api.post('/clinic/booking-config', { config });
    }
};
