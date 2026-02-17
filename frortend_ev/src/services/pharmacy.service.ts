import api from './api';

export const pharmacyService = {
    getInventory: () => api.get('/pharmacy/inventory'),
    getLowStock: (threshold?: number) => api.get('/pharmacy/inventory/low-stock', { params: threshold != null ? { threshold } : {} }),
    addInventory: (data: any) => api.post('/pharmacy/inventory', data),
    updateInventory: (id: number, data: any) => api.patch(`/pharmacy/inventory/${id}`, data),
    deleteInventory: (id: number) => api.delete(`/pharmacy/inventory/${id}`),
    getOrders: () => api.get('/pharmacy/orders'),
    processOrder: (orderId: number, items: any[] = [], paid: boolean = false, amount: number = 0, source: string = 'ORDER') =>
        api.post('/pharmacy/orders/process', { orderId, items, paid, amount, source }),
    getPosSales: () => api.get('/pharmacy/pos'),
    directSale: (data: any) => api.post('/pharmacy/pos', data),
    updatePosSale: (id: string, data: { status?: string }) => api.patch(`/pharmacy/pos/${id}`, data),
    deletePosSale: (id: string) => api.delete(`/pharmacy/pos/${id}`),
    getNotificationsCount: () => api.get('/pharmacy/notifications'),
    getReports: (date?: string) => api.get('/pharmacy/reports', { params: date ? { date } : {} }),
};
