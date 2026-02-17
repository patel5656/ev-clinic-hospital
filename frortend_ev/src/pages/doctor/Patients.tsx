import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiCheckCircle } from 'react-icons/fi';
import { doctorService } from '../../services/doctor.service';
import PatientProfileModal from '../../components/PatientProfileModal';
import './Dashboard.css';
import './Patients.css';

const DoctorPatients = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    // Profile Modal State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedPatientForProfile, setSelectedPatientForProfile] = useState<any>(null);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await doctorService.getPatients();
                setPatients(res.data || []);
            } catch (error) {
                console.error('Failed to fetch patients', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const openProfile = (patient: any) => {
        setSelectedPatientForProfile(patient);
        setIsProfileOpen(true);
    };

    const tabs = [
        { id: 'all', label: 'All', count: patients.length },
        { id: 'active', label: 'Active', count: patients.filter(p => p.status === 'Active').length },
        { id: 'followup', label: 'Follow-up', count: 0 },
        { id: 'discharged', label: 'Discharged', count: 0 }
    ];

    const filteredPatients = patients.filter((p: any) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="doctor-dashboard">
            {/* Page Header */}
            <div className="patients-page-header">
                <h1 className="patients-title">My Patients</h1>
                <p className="patients-subtitle">Manage and view your assigned patients</p>
            </div>

            {/* Search and Filter Card */}
            <div className="patients-filter-card">
                <div className="search-bar-centered">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input-large"
                    />
                </div>

                <div className="filter-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Patients List */}
            <div className="patients-results-card">
                {loading ? (
                    <div className="p-20 text-center">Loading patients...</div>
                ) : filteredPatients.length > 0 ? (
                    <div className="patients-grid">
                        {filteredPatients.map((patient: any) => (
                            <div key={patient.id} className="patient-card-modern">
                                <div className="patient-avatar-large">
                                    {patient.name.charAt(0)}
                                </div>
                                <div className="patient-info-block">
                                    <h3 className="patient-name">{patient.name}</h3>
                                    <p className="patient-meta">ID: P-{patient.id} • {patient.age || 35} Y • {patient.gender || 'Male'}</p>
                                    <div className="patient-contact">
                                        <span>{patient.email || 'No email'}</span>
                                        <span>{patient.contact || patient.phone || 'No phone'}</span>
                                    </div>
                                    {patient.medicalrecord && patient.medicalrecord.length > 0 && (
                                        <div className="last-visit-tag">
                                            <FiCheckCircle size={12} />
                                            <span>Last: {new Date(patient.medicalrecord[0].createdAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="patient-actions">
                                    <button
                                        className="btn btn-primary btn-sm btn-start-consulting-static"
                                        onClick={() => navigate('/doctor/assessments', { state: { patientId: patient.id, patientName: patient.name, openNew: true } })}
                                    >
                                        Start Consultation
                                    </button>
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b' }}
                                        onClick={() => openProfile(patient)}
                                    >
                                        View Full File
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state-patients">
                        <div className="empty-icon-large">
                            <FiUser />
                        </div>
                        <h3>No patients found</h3>
                        <p>No patients match your search criteria</p>
                    </div>
                )}
            </div>

            {/* Patient Profile Modal */}
            {selectedPatientForProfile && (
                <PatientProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    patientId={selectedPatientForProfile.id}
                    patientName={selectedPatientForProfile.name}
                />
            )}
        </div>
    );
};

export default DoctorPatients;
