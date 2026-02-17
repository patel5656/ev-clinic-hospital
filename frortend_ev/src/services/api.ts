import axios from 'axios';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ev-cline-backend-6-fab-production.up.railway.app/';
//const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ev-cline-backend-6-fab-production.up.railway.app/api';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('ev_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const storedClinic = localStorage.getItem('ev_clinic');
        if (storedClinic) {
            const clinic = JSON.parse(storedClinic);
            if (clinic && clinic.id) {
                config.headers['X-Clinic-ID'] = clinic.id.toString();
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || 'Something went wrong';

        // Auto-logout if token expired (401)
        if (error.response?.status === 401) {
            localStorage.removeItem('ev_token');
            localStorage.removeItem('ev_user');
            localStorage.removeItem('ev_clinic');
            window.location.href = '/login';
        }

        return Promise.reject(new Error(message));
    }
);

export default api;
