import React, { createContext, useContext, useState, useEffect } from 'react';
import { superService } from '../services/super.service';
import { clinicService } from '../services/clinic.service';
import { departmentService } from '../services/department.service';
import { receptionService } from '../services/reception.service';
import { doctorService } from '../services/doctor.service';
import { billingService } from '../services/billing.service';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface AppContextType {
    clinics: any[];
    staff: any[];
    patients: any[];
    bookings: any[];
    invoices: any[];
    formTemplates: any[];
    auditLogs: any[];
    notifications: any[];
    departments: any[];
    dataLoading: boolean;
    addClinic: (clinic: any) => Promise<any>;
    updateClinic: (clinicId: number, updates: any) => Promise<void>;
    toggleClinicStatus: (clinicId: number) => Promise<void>;
    deleteClinic: (clinicId: number) => Promise<void>;
    updateClinicModules: (clinicId: number, modules: any) => Promise<void>;
    addStaff: (member: any, clinicId?: number) => Promise<any>;
    updateStaff: (staffId: number, updates: any) => Promise<void>;
    toggleStaffStatus: (staffId: number) => Promise<void>;
    deleteStaff: (staffId: number) => Promise<void>;
    addPatient: (patient: any) => Promise<any>;
    updatePatientStatus: (patientId: number, status: string) => Promise<void>;
    addBooking: (booking: any) => Promise<any>;
    approveBooking: (bookingId: number) => Promise<void>;
    rejectBooking: (bookingId: number) => Promise<void>;
    addInvoice: (invoice: any) => Promise<any>;
    updateInvoiceStatus: (id: string, status: string) => Promise<any>;
    addFormTemplate: (template: any) => Promise<any>;
    deleteFormTemplate: (templateId: number) => Promise<void>;
    updateBookingStatus: (bookingId: number, status: string) => Promise<void>;
    addAssessment: (patientId: number, assessment: any) => Promise<void>;
    addDepartment: (department: any) => Promise<any>;
    deleteDepartment: (id: number) => Promise<void>;
    updateNotificationStatus: (id: number, status: string) => Promise<void>;
    bookingConfig: any;
    saveBookingConfig: (config: any) => Promise<void>;
    logAction: (action: string, performedBy: string, details: any) => void;
    refreshData: () => Promise<void>;
    refreshTrigger: number;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, selectedClinic } = useAuth() as any;
    const toast = useToast();

    const [clinics, setClinics] = useState<any[]>([]);
    const [staff, setStaff] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [formTemplates, setFormTemplates] = useState<any[]>([]);
    const [auditLogs] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [bookingConfig, setBookingConfig] = useState<any>(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchData = async () => {
        if (!user) return;

        setDataLoading(true);
        const fetchAndSet = async (fetcher: () => Promise<any>, setter: React.Dispatch<React.SetStateAction<any>>, fallback: any[] = []) => {
            try {
                const res = await fetcher();
                const data = res?.data ?? res;
                setter(Array.isArray(data) ? data : (data || fallback));
            } catch (err) {
                setter(fallback);
            }
        };

        try {
            if (user.roles.includes('SUPER_ADMIN')) {
                await Promise.all([
                    superService.getClinics().then((r: any) => setClinics(r?.data ?? r ?? [])).catch(() => setClinics([])),
                    superService.getStaff().then((r: any) => setStaff(r?.data ?? r ?? [])).catch(() => setStaff([]))
                ]);
            }

            if (selectedClinic) {
                const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
                const isDoctor = user.roles.includes('DOCTOR') && !isAdmin;
                const isSupport = ['RECEPTIONIST', 'ACCOUNTING', 'ACCOUNTS', 'ACCOUNTANT'].some(r => user.roles.includes(r));
                const isDocCtrl = user.roles.includes('DOCUMENT_CONTROLLER') && !isAdmin && !user.roles.includes('DOCTOR');

                if (isAdmin) {
                    await Promise.all([
                        departmentService.getDepartments().then((r: any) => setDepartments(r?.data ?? r ?? [])).catch(() => setDepartments([])),
                        clinicService.getStaff().then((r: any) => setStaff(r?.data ?? r ?? [])).catch(() => setStaff([])),
                        receptionService.getPatients().then((r: any) => setPatients(r?.data ?? r ?? [])).catch(() => setPatients([])),
                        receptionService.getAppointments().then((r: any) => setBookings(r?.data ?? r ?? [])).catch(() => setBookings([])),
                        billingService.getInvoices().then((r: any) => setInvoices(r?.data ?? r ?? [])).catch(() => setInvoices([])),
                        clinicService.getBookingConfig().then((r: any) => setBookingConfig(r?.data ?? r)).catch(() => setBookingConfig(null))
                    ]);
                    clinicService.getFormTemplates().then((res: any) => {
                        const list = res?.data ?? res ?? [];
                        setFormTemplates(Array.isArray(list) ? list.map((t: any) => ({
                            ...t,
                            fields: typeof t.fields === 'string' ? (() => { try { return JSON.parse(t.fields); } catch { return t.fields; } })() : t.fields
                        })) : []);
                    }).catch(() => setFormTemplates([]));
                } else if (isDoctor) {
                    await Promise.all([
                        fetchAndSet(() => doctorService.getPatients(), setPatients),
                        fetchAndSet(() => doctorService.getQueue(), setBookings),
                        clinicService.getStaff().then((r: any) => setStaff(r?.data ?? r ?? [])).catch(() => setStaff([]))
                    ]);
                    doctorService.getTemplates().then((res: any) => {
                        const list = res?.data ?? res ?? [];
                        setFormTemplates(Array.isArray(list) ? list.map((t: any) => ({
                            ...t,
                            fields: typeof t.fields === 'string' ? (() => { try { return JSON.parse(t.fields); } catch { return t.fields; } })() : t.fields
                        })) : []);
                    }).catch(() => setFormTemplates([]));
                } else if (isSupport) {
                    await Promise.all([
                        receptionService.getPatients().then((r: any) => setPatients(r?.data ?? r ?? [])).catch(() => setPatients([])),
                        receptionService.getAppointments().then((r: any) => setBookings(r?.data ?? r ?? [])).catch(() => setBookings([])),
                        billingService.getInvoices().then((r: any) => setInvoices(r?.data ?? r ?? [])).catch(() => setInvoices([])),
                        clinicService.getStaff().then((r: any) => setStaff(r?.data ?? r ?? [])).catch(() => setStaff([]))
                    ]);
                } else if (isDocCtrl) {
                    await fetchAndSet(() => doctorService.getPatients(), setPatients);
                    doctorService.getTemplates().then((res: any) => {
                        const list = res?.data ?? res ?? [];
                        setFormTemplates(Array.isArray(list) ? list.map((t: any) => ({
                            ...t,
                            fields: typeof t.fields === 'string' ? (() => { try { return JSON.parse(t.fields); } catch { return t.fields; } })() : t.fields
                        })) : []);
                    }).catch(() => setFormTemplates([]));
                }
            }
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, selectedClinic]);

    const refreshData = async () => {
        await fetchData();
        setRefreshTrigger(prev => prev + 1);
    };

    const logAction = (action: string, _performedBy: string, details: any) => {
        console.log(`Action: ${action}`, details);
    };

    const addClinic = async (clinic: any) => {
        const res: any = await superService.createClinic(clinic);
        setClinics(prev => [...prev, res.data]);

        // After creating a clinic, a clinic admin is also created. 
        // We need to refetch the staff list to show them in the Admins tab.
        if (user.roles.includes('SUPER_ADMIN')) {
            const sRes: any = await superService.getStaff();
            setStaff(sRes.data || []);
        }

        await refreshData();
        return res.data;
    };

    const updateClinic = async (clinicId: number, updates: any) => {
        const res: any = await superService.updateClinic(clinicId, updates);
        setClinics(prev => prev.map(c => c.id === clinicId ? res.data : c));

        // Update staff list as well in case clinic details used in admins list changed
        if (user.roles.includes('SUPER_ADMIN')) {
            const sRes: any = await superService.getStaff();
            setStaff(sRes.data || []);
        }
        await refreshData();
    };

    const toggleClinicStatus = async (clinicId: number) => {
        const res: any = await superService.toggleClinicStatus(clinicId);
        setClinics(prev => prev.map(c => c.id === clinicId ? res.data : c));
        await refreshData();
    };

    const deleteClinic = async (clinicId: number) => {
        await superService.deleteClinic(clinicId);
        setClinics(prev => prev.filter(c => c.id !== clinicId));

        // Remove associated staff from the local state by refetching
        if (user.roles.includes('SUPER_ADMIN')) {
            const sRes: any = await superService.getStaff();
            setStaff(sRes.data || []);
        }
        await refreshData();
    };

    const updateClinicModules = async (clinicId: number, modules: any) => {
        const res: any = await superService.updateModules(clinicId, modules);
        setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, modules: res.data.modules } : c));
        await refreshData();
    };

    const addStaff = async (member: any, clinicId?: number) => {
        const targetClinicId = clinicId || member.clinicId || selectedClinic?.id;
        if (!targetClinicId) {
            console.error('Cannot create staff: No clinic ID provided.');
            return;
        }

        const res: any = user.roles.includes('SUPER_ADMIN')
            ? await superService.createClinicAdmin(Number(targetClinicId), member)
            : await clinicService.createStaff(member);

        // Flatten the staff object if it has a nested user (common in creation response)
        const staffData = res.data || res;
        const flattenedStaff = {
            ...staffData,
            name: staffData.name || staffData.user?.name,
            email: staffData.email || staffData.user?.email,
            phone: staffData.phone || staffData.user?.phone,
            clinics: staffData.clinics || [staffData.clinicId]
        };

        setStaff(prev => [...prev, flattenedStaff]);
        await refreshData();
        return flattenedStaff;
    };

    const updateStaff = async (staffId: number, updates: any) => {
        const res: any = user.roles.includes('SUPER_ADMIN')
            ? await superService.updateStaff(staffId, updates)
            : await clinicService.updateStaff(staffId, updates);
        setStaff(prev => prev.map(s => s.id === staffId ? (res.data || res) : s));
        await refreshData();
    };

    const addPatient = async (patient: any) => {
        const res: any = await receptionService.registerPatient(patient);
        setPatients(prev => [...prev, res.data]);
        await refreshData();
        return res.data;
    };

    const addBooking = async (booking: any) => {
        const res: any = await receptionService.createAppointment(booking);
        setBookings(prev => [...prev, res.data]);
        await refreshData();
        return res.data;
    };

    const updateBookingStatus = async (bookingId: number, status: string) => {
        try {
            console.log('Updating booking status:', bookingId, status);
            const res: any = status === 'Checked In'
                ? await receptionService.checkIn(bookingId)
                : await receptionService.updateStatus(bookingId, status);
            console.log('Status update response:', res);
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: res.data.status } : b));
            await refreshData();
            toast.success(`Appointment ${status.toLowerCase()} successfully!`);
        } catch (error: any) {
            console.error('Failed to update booking status:', error);
            toast.error(`Failed to update appointment status: ${error.response?.data?.message || error.message}`);
        }
    };

    const approveBooking = async (bookingId: number) => {
        console.log('Approving booking:', bookingId);
        await updateBookingStatus(bookingId, 'Confirmed');
    };

    const rejectBooking = async (bookingId: number) => {
        console.log('Rejecting booking:', bookingId);
        await updateBookingStatus(bookingId, 'Cancelled');
    };

    const addFormTemplate = async (template: any) => {
        const res: any = await clinicService.createFormTemplate(template);
        const newTemplate = {
            ...res.data,
            fields: typeof res.data.fields === 'string' ? JSON.parse(res.data.fields) : res.data.fields
        };
        setFormTemplates(prev => [...prev, newTemplate]);
        return newTemplate;
    };

    const toggleStaffStatus = async (staffId: number) => {
        const staffMember = staff.find(s => s.id === staffId);
        if (!staffMember) return;

        const newStatus = staffMember.status === 'active' ? 'inactive' : 'active';

        let res: any;
        if (user.roles.includes('SUPER_ADMIN')) {
            res = await superService.toggleStaffStatus(staffId);
        } else {
            // For clinic admins, toggle via updateStaff
            res = await clinicService.updateStaff(staffId, { status: newStatus });
        }

        const updatedMember = res.data;
        setStaff(prev => prev.map(s => s.id === staffId ? updatedMember : s));
    };

    const deleteStaff = async (staffId: number) => {
        try {
            if (user.roles.includes('SUPER_ADMIN') && !selectedClinic) {
                await superService.deleteStaff(staffId);
            } else {
                await clinicService.deleteStaff(staffId);
            }
            setStaff(prev => prev.filter(s => s.id !== staffId));
            await refreshData();
            toast.success('Staff member deleted successfully');
        } catch (error: any) {
            console.error('Failed to delete staff:', error);
            const message = error.response?.data?.message || error.message || 'Failed to delete staff member';
            toast.error(message);
        }
    };

    const deleteFormTemplate = async (templateId: number) => {
        await clinicService.deleteFormTemplate(templateId);
        setFormTemplates(prev => prev.filter(t => t.id !== templateId));
    };

    const saveBookingConfig = async (config: any) => {
        const res: any = await clinicService.updateBookingConfig(config);
        setBookingConfig(res.data);
    };

    const updatePatientStatus = async (patientId: number, status: string) => {
        // This would call a backend update patient endpoint
        // For now, we update local state if successful
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, status } : p));
    };

    const addAssessment = async (patientId: number, assessment: any) => {
        await doctorService.submitAssessment({ patientId, ...assessment });
        // Optionally refetch history or update state if needed
    };


    const addDepartment = async (department: any) => {
        const res: any = await departmentService.createDepartment(department);
        setDepartments(prev => [...prev, res.data]);
        return res.data;
    };

    const deleteDepartment = async (id: number) => {
        await departmentService.deleteDepartment(id);
        setDepartments(prev => prev.filter(d => d.id !== id));
    };

    const updateNotificationStatus = async (id: number, status: string) => {
        const res: any = await departmentService.updateNotificationStatus(id, status);
        setNotifications(prev => prev.map(n => n.id === id ? res.data : n));
    };

    const addInvoice = async (data: any) => {
        const res: any = await billingService.createInvoice(data);
        if (res.status === 'success') {
            setInvoices(prev => [res.data, ...prev]);
            return res.data;
        }
    };

    const updateInvoiceStatus = async (id: string, status: string) => {
        const res: any = await billingService.updateInvoiceStatus(id, status);
        if (res.status === 'success') {
            setInvoices(prev => prev.map(inv => inv.id === id ? res.data : inv));
            return res.data;
        }
    };

    const value = {
        clinics, staff, patients, bookings, invoices, formTemplates, auditLogs, notifications, departments, bookingConfig, dataLoading,
        addClinic, updateClinic, toggleClinicStatus, deleteClinic, updateClinicModules,
        addStaff, updateStaff, toggleStaffStatus, deleteStaff, addPatient, updatePatientStatus, addBooking, approveBooking, rejectBooking,
        updateBookingStatus, addInvoice, updateInvoiceStatus, addFormTemplate, deleteFormTemplate, logAction,
        addDepartment, deleteDepartment, updateNotificationStatus, saveBookingConfig, addAssessment, refreshData, refreshTrigger
    };


    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};
