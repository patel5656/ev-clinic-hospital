import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiCheck, FiMapPin, FiBriefcase } from 'react-icons/fi';
import './ClinicSelection.css';

const ClinicSelection = () => {
    const { user, selectClinic, getUserClinics, handleRedirectByRole } = useAuth() as any;
    // const navigate = useNavigate();
    const [clinics, setClinics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClinics = async () => {
            const data = await getUserClinics();
            setClinics(data);
            setLoading(false);
        };
        fetchClinics();
    }, [getUserClinics]);

    const getRoleDisplayName = (role: string) => {
        const roleNames: Record<string, string> = {
            SUPER_ADMIN: 'System Administrator',
            ADMIN: 'Clinic Administrator',
            DOCTOR: 'Medical Doctor',
            RECEPTIONIST: 'Admissions Desk',
            PATIENT: 'Patient'
        };
        return roleNames[role] || role;
    };

    const handleSelect = async (clinic: any) => {
        await selectClinic(clinic);
        // Correctly redirect based on the role ASSIGNED to this specific clinic
        handleRedirectByRole(clinic.role);
    };

    return (
        <div className="selection-container">
            <div className="selection-card fade-in-up">
                <div className="selection-header">
                    <div className="brand-logo-small mb-md">
                        <img src="/sidebar-logo.jpg" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '50%' }} />
                    </div>
                    <h1>Select Your Facility</h1>
                    <p className="selection-subtitle">Welcome back, <strong>{user?.name}</strong></p>
                </div>

                <div className="clinics-list mt-lg">
                    {loading ? (
                        <p className="text-center">Identifying accessible facilities...</p>
                    ) : clinics.length === 0 ? (
                        <div className="no-clinics-message">
                            <FiMapPin size={48} />
                            <h3>No Clinics Assigned</h3>
                            <p>Contact System Administrator for access.</p>
                        </div>
                    ) : (
                        clinics.map((clinic: any) => (
                            <div key={clinic.id} className="clinic-option-card" onClick={() => handleSelect(clinic)}>
                                <div className="clinic-card-content">
                                    <div className="clinic-info">
                                        <h3>{clinic.name}</h3>
                                        <div className="clinic-meta">
                                            <span className="clinic-location"><FiMapPin size={14} /> {clinic.location}</span>
                                            <span className="clinic-role"><FiBriefcase size={14} /> {getRoleDisplayName(clinic.role)}</span>
                                        </div>
                                    </div>
                                    <div className="select-icon"><FiCheck /></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClinicSelection;
