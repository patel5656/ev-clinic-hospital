import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useToast } from './ToastContext';

interface AuditLog {
    timestamp: string;
    email: string;
    success: boolean;
    ip: string;
    device: string;
    selectedClinic?: string;
    roles?: string[];
    reason?: string;
}

interface AuthContextType {
    user: any;
    selectedClinic: any;
    isAuthenticated: boolean;
    loading: boolean;
    failedAttempts: number;
    lockoutUntil: number | null;
    showCaptcha: boolean;
    login: (email: string, password: string) => Promise<{
        success: boolean;
        otpRequired?: boolean;
        error?: string;
    }>;
    confirmOTP: (email: string, otp: string) => Promise<{
        success: boolean;
        user?: any;
        error?: string;
    }>;
    loginAsClinic: (clinic: any) => void;
    logout: () => void;
    selectClinic: (clinic: any) => Promise<void>;
    getUserClinics: () => Promise<any[]>;
    resetFailedAttempts: () => void;
    getAuditLogs: () => AuditLog[];
    impersonate: (userId: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const [user, setUser] = useState<any>(null);
    const [selectedClinic, setSelectedClinic] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutUntil] = useState<number | null>(null);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [auditLogs] = useState<AuditLog[]>([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('ev_user');
        const storedClinic = localStorage.getItem('ev_clinic');
        let parsedUser: any = null;

        if (storedUser) {
            parsedUser = JSON.parse(storedUser);
            if (parsedUser.roles && Array.isArray(parsedUser.roles)) {
                parsedUser.roles = parsedUser.roles.map((r: string) => r.toUpperCase());
            }
            setUser(parsedUser);
            setIsAuthenticated(true);
        }

        // Clinic-scoped data isolation: use stored clinic ONLY if it's in user's allowed clinics
        if (storedClinic && parsedUser) {
            try {
                const clinic = JSON.parse(storedClinic);
                const userClinics = parsedUser.clinics || [];
                const clinicIds = userClinics.map((c: any) => (typeof c === 'object' ? c.id : c));
                if (clinic?.id && (clinicIds.length === 0 || clinicIds.includes(clinic.id))) {
                    setSelectedClinic(clinic);
                } else {
                    localStorage.removeItem('ev_clinic');
                }
            } catch {
                localStorage.removeItem('ev_clinic');
            }
        } else if (storedClinic && !parsedUser) {
            localStorage.removeItem('ev_clinic');
        }

        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            console.log('Attempting login for:', email);
            const response: any = await authService.login({ email, password });
            console.log('Login response:', response);

            if (response.success && response.data) {
                if (response.data.otpRequired) {
                    return { success: true, otpRequired: true };
                } else {
                    // Direct login success path
                    const userData = response.data.user;
                    if (userData.roles && Array.isArray(userData.roles)) {
                        userData.roles = userData.roles.map((r: string) => r.toUpperCase());
                    }
                    const token = response.data.token;

                    localStorage.setItem('ev_token', token);
                    localStorage.setItem('ev_user', JSON.stringify(userData));

                    setUser(userData);
                    setIsAuthenticated(true);

                    // Auto-select clinic if only one is available and not a super_admin
                    const isSuperAdmin = userData.roles?.some((r: string) => r.toUpperCase() === 'SUPER_ADMIN');
                    if (!isSuperAdmin && userData.clinics?.length === 1) {
                        try {
                            await selectClinicById(userData.clinics[0]);
                        } catch (err) {
                            console.error('Auto-select clinic failed:', err);
                        }
                    }

                    return { success: true, otpRequired: false, user: userData };
                }
            }

            return {
                success: false,
                error: response.message || 'Authorization failed. Please check your credentials.'
            };
        } catch (error: any) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.message || 'Unable to connect to service.'
            };
        }
    };

    const confirmOTP = async (email: string, otp: string) => {
        try {
            const response: any = await authService.verifyOTP({ email, otp });
            if (response.success) {
                const userData = response.data.user;
                if (userData.roles && Array.isArray(userData.roles)) {
                    userData.roles = userData.roles.map((r: string) => r.toUpperCase());
                }
                const token = response.data.token;

                localStorage.setItem('ev_token', token);
                localStorage.setItem('ev_user', JSON.stringify(userData));

                setUser(userData);
                setIsAuthenticated(true);

                // Auto-select clinic if only one is available and not a super_admin
                if (!userData.roles.includes('SUPER_ADMIN') && userData.clinics && userData.clinics.length === 1) {
                    await selectClinicById(userData.clinics[0]);
                }

                return { success: true, user: userData };
            }
            return { success: false, error: 'Verification failed' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    const selectClinicById = async (clinicId: number, role?: string) => {
        try {
            // Extract role from clinic list if not provided
            let targetRole = role;
            const clinics = await getUserClinics();
            const clinic = clinics.find((c: any) => c.id === clinicId);

            if (!targetRole && clinic) {
                targetRole = clinic.role;
            }

            const response: any = await authService.selectClinic(clinicId, targetRole || 'RECEPTIONIST');
            if (response.success) {
                const newToken = response.data.token;
                localStorage.setItem('ev_token', newToken);

                if (clinic) {
                    localStorage.setItem('ev_clinic', JSON.stringify(clinic));
                    setSelectedClinic(clinic);
                }
            }
        } catch (error: any) {
            console.error('Clinic selection failed:', error.message);
        }
    };

    const selectClinic = async (clinic: any) => {
        await selectClinicById(clinic.id, clinic.role);
    };

    const getUserClinics = async () => {
        try {
            const response: any = await authService.getMyClinics();
            return response.data || [];
        } catch (error) {
            return [];
        }
    };

    const logout = () => {
        setUser(null);
        setSelectedClinic(null);
        setIsAuthenticated(false);
        localStorage.removeItem('ev_token');
        localStorage.removeItem('ev_user');
        localStorage.removeItem('ev_clinic');
    };

    const handleRedirectByRole = (role: string) => {
        if (!role) {
            navigate('/');
            window.location.reload();
            return;
        }

        const r = role.toString().toUpperCase().trim();
        if (!r) {
            navigate('/');
            return;
        }

        if (r === 'SUPER_ADMIN') window.location.href = '/super-admin';
        else if (r === 'ADMIN' || r === 'CLINIC_ADMIN') window.location.href = '/clinic-admin';
        else if (r === 'DOCTOR') window.location.href = '/doctor';
        else if (r === 'RECEPTIONIST' || r === 'RECEPTION' || r === 'ADMISSION') window.location.href = '/reception';
        else if (r === 'PATIENT') window.location.href = '/patient';
        else if (r === 'PHARMACY') window.location.href = '/pharmacy';
        else if (r === 'LAB' || r === 'LABORATORY') window.location.href = '/lab';
        else if (r === 'RADIOLOGY' || r === 'RADIOLOGIST') window.location.href = '/radiology';
        else if (r === 'DOCUMENT_CONTROLLER') window.location.href = '/documents';
        else if (r === 'ACCOUNTING' || r === 'ACCOUNTS' || r === 'ACCOUNTANT') window.location.href = '/accounting';
        else window.location.href = '/';
    };

    const impersonate = async (userId: number) => {
        try {
            const response: any = await authService.impersonate(userId);
            if (response.success) {
                const userData = response.data.user;
                if (userData.roles && Array.isArray(userData.roles)) {
                    userData.roles = userData.roles.map((r: string) => r.toUpperCase());
                }
                const token = response.data.token;

                localStorage.setItem('ev_token', token);
                localStorage.setItem('ev_user', JSON.stringify(userData));
                localStorage.removeItem('ev_clinic'); // Clear clinic context on impersonation

                setUser(userData);
                setIsAuthenticated(true);

                // Auto-set clinic if available to avoid select-clinic call
                if (userData.clinics && userData.clinics.length > 0) {
                    const firstClinic = userData.clinics[0];
                    const clinicContext = {
                        id: firstClinic.id,
                        role: firstClinic.role,
                        name: 'Managed Clinic'
                    };
                    setSelectedClinic(clinicContext);
                    localStorage.setItem('ev_clinic', JSON.stringify(clinicContext));
                }

                // Redirect based on role
                const targetRole = userData.role || (userData.roles ? userData.roles[0] : null);
                handleRedirectByRole(targetRole);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Impersonation failed:', error);
            return false;
        }
    };

    const loginAsClinic = async (clinic: any) => {
        try {
            const response: any = await authService.impersonateClinic(clinic.id);
            if (response.success) {
                const userData = response.data.user;
                if (userData.roles && Array.isArray(userData.roles)) {
                    userData.roles = userData.roles.map((r: string) => r.toUpperCase());
                }
                const token = response.data.token;

                localStorage.setItem('ev_token', token);
                localStorage.setItem('ev_user', JSON.stringify(userData));

                // Use the clinic info provided or from response
                // CRITICAL: Ensure we have a valid clinic context with a ROLE.
                // The clinic object from Super Admin table might not have 'role'.
                // Since this is 'loginAsClinic', we assume we are becoming the ADMIN.

                let contextObj = clinic;
                if (!contextObj && userData.clinics && userData.clinics.length > 0) {
                    // If no clinic passed, use the first one from user data (which usually has id, role)
                    contextObj = userData.clinics[0];
                }

                if (contextObj) {
                    const cleanContext = {
                        id: contextObj.id,
                        name: contextObj.name || 'Managed Clinic',
                        role: contextObj.role || 'ADMIN', // Force ADMIN if missing
                        modules: contextObj.modules
                    };
                    localStorage.setItem('ev_clinic', JSON.stringify(cleanContext));
                    // setSelectedClinic(cleanContext); // Skipped to prevent React render cycle
                }

                // setUser(userData); // Skipped
                // setIsAuthenticated(true); // Skipped

                // Redirect based on role
                const targetRole = userData.role || (userData.roles ? userData.roles[0] : null);

                // Immediate hard redirect
                handleRedirectByRole(targetRole);

                return true;
            }
            return false;
        } catch (error) {
            console.error('Clinic impersonation failed:', error);
            toast.error('Failed to login as clinic admin. Please ensure the clinic has at least one staff member.');
            return false;
        }
    };

    const resetFailedAttempts = () => {
        setFailedAttempts(0);
        setShowCaptcha(false);
    };

    const getAuditLogs = () => auditLogs;

    const changePassword = async (data: any) => {
        return await authService.changePassword(data);
    };

    const value = {
        user,
        selectedClinic,
        isAuthenticated,
        loading,
        failedAttempts,
        lockoutUntil,
        showCaptcha,
        login,
        confirmOTP,
        loginAsClinic,
        logout,
        selectClinic,
        getUserClinics,
        resetFailedAttempts,
        getAuditLogs,
        impersonate,
        handleRedirectByRole,
        changePassword,
        selectClinicById,
        verifyOTP: confirmOTP // Assuming verifyOTP is confirmOTP based on the context
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
