import api from './api';

export const departmentService = {
    getDepartments: () => api.get('/departments'),
    createDepartment: (data: any) => api.post('/departments', data),
    deleteDepartment: (id: number) => api.delete(`/departments/${id}`),
    updateNotificationStatus: (id: number, status: string) => api.patch(`/departments/notifications/${id}`, { status }),
    getNotifications: () => api.get('/departments/notifications'),
    getUnreadCount: (department?: string) => api.get('/departments/unread-count', { params: department ? { department } : {} })
};
