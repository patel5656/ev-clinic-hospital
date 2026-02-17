import api from './api';

export const patientService = {
    getMyAppointments: () => api.get('/patient/appointments'),
    getMyMedicalRecords: () => api.get('/patient/records'),
    getMyInvoices: () => api.get('/patient/invoices'),
    getMyClinics: () => api.get('/patient/clinics'),
    getPublicClinics: () => api.get('/patient/public-clinics'),
    publicBookAppointment: (data: any) => api.post('/patient/public-book', data),
    bookAppointment: (data: any) => api.post('/patient/book', data),
    getClinicDoctors: (clinicId: number) => api.get(`/patient/doctors/${clinicId}`),
    getClinicBookingDetails: (clinicId: number) => api.get(`/patient/booking-details/${clinicId}`),

    // New Public Booking System
    getPublicClinic: (subdomain: string) => api.get(`/public/clinic/${subdomain}`),
    getPublicDoctors: (clinicId: number) => api.get(`/public/clinic/${clinicId}/doctors`),
    getPublicAvailability: (doctorId: number, date: string) => api.get(`/public/doctor/${doctorId}/availability?date=${date}`),
    submitPublicBooking: (data: any) => api.post('/public/book', data),

    getMyDocuments: () => api.get('/patient/documents'),
    uploadDocument: (clinicId: number, patientId: number, data: any) => api.post(`/patient/clinics/${clinicId}/patients/${patientId}/documents`, data),
};
