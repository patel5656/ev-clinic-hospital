import api from './api';

export const authService = {
    login: async (credentials: any) => {
        return api.post('/auth/login', credentials);
    },
    verifyOTP: async (data: { email: string; otp: string }) => {
        return api.post('/auth/verify-otp', data);
    },

    getMyClinics: async () => {
        return api.get('/auth/clinics/my');
    },

    selectClinic: async (clinicId: number, role: string) => {
        return api.post('/auth/select-clinic', { clinicId, role });
    },

    impersonate: async (userId: number) => {
        return api.post('/super/impersonate/user', { userId });
    },
    impersonateClinic: async (clinicId: number) => {
        return api.post('/super/impersonate/clinic', { clinicId });
    },
    changePassword: async (data: any) => {
        return api.post('/auth/change-password', data);
    }
};
