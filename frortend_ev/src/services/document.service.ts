import api from './api';

export const documentService = {
    getRecords: async (params?: { patientId?: number; archived?: boolean }) => {
        const p: any = {};
        if (params?.patientId != null) p.patientId = params.patientId;
        if (params?.archived) p.archived = 'true';
        return api.get('/document-controller/records', { params: p });
    },

    getStaffRecords: async () => {
        return api.get('/document-controller/staff-records');
    },

    getStats: async () => {
        return api.get('/document-controller/stats');
    },

    createRecord: async (data: { patientId: number; documentType: string; fileName?: string; notes?: string }) => {
        return api.post('/document-controller/records', data);
    },

    createStaffRecord: async (data: { staffId: number; documentType: string; fileName?: string; notes?: string }) => {
        return api.post('/document-controller/staff-records', data);
    }
};
