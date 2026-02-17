import api from './api';

export const receptionService = {
    getPatients: async (search?: string) => {
        return api.get('/reception/patients', { params: { search } });
    },

    registerPatient: async (data: any) => {
        return api.post('/reception/patients', data);
    },

    updatePatient: async (id: number, data: any) => {
        return api.patch(`/reception/patients/${id}`, data);
    },

    getAppointments: async (date?: string, patientId?: number) => {
        return api.get('/reception/appointments', { params: { date, patientId } });
    },

    getPatientAppointments: async (patientId: number) => {
        return api.get(`/reception/patients/${patientId}/appointments`);
    },

    createAppointment: async (data: any) => {
        return api.post('/reception/appointments', data);
    },

    updateStatus: async (id: number, status: string) => {
        return api.patch(`/reception/appointments/${id}/status`, { status });
    },

    getStats: async () => {
        return api.get('/reception/stats');
    },

    getActivities: async () => {
        return api.get('/reception/activities');
    },

    resetPassword: async (patientId: number, password: string) => {
        return api.patch(`/reception/patients/${patientId}/password`, { password });
    },

    checkIn: async (id: number) => {
        return api.post(`/reception/appointments/${id}/check-in`);
    }
};
