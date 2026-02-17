import api from './api';

export const dashboardService = {
    getStats: async (role?: string) => {
        const response = await api.get('/dashboard/stats', {
            params: role ? { role } : {}
        });
        return response.data;
    },

    getMenu: async (role: string) => {
        const response = await api.get(`/menu/${role}`);
        return response.data;
    },

    getCurrentMenu: async () => {
        const response = await api.get('/menu');
        return response.data;
    }
};
