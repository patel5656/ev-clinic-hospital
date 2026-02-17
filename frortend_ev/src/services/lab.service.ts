import api from './api';

export const labService = {
    getOrders: (type: 'LAB' | 'RADIOLOGY' = 'LAB', status?: string) => {
        const params = new URLSearchParams({ type });
        if (status) params.append('status', status);
        return api.get(`/lab/orders?${params.toString()}`);
    },
    completeOrder: (orderId: number, result: string, price: number, paid: boolean = false) => api.post('/lab/orders/complete', { orderId, result, price, paid }),
    rejectOrder: (orderId: number) => api.post('/lab/orders/reject', { orderId }),
    collectSample: (orderId: number) => api.post('/lab/orders/collect-sample', { orderId }),
};
