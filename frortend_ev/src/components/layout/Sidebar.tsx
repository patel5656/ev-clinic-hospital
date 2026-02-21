import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FiHome,
    FiUsers,
    FiCalendar,
    FiFileText,
    FiActivity,
    FiSettings,
    FiLogOut,
    FiPackage,
    FiUserPlus,
    FiGrid,
    FiUpload,
    FiBriefcase,
    FiDollarSign,
    FiPieChart,
    FiEdit2,
    FiList
} from 'react-icons/fi';
import './Sidebar.css';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user, selectedClinic, logout } = useAuth() as any;

    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isPatientPath = location.pathname.startsWith('/patient') || location.pathname.startsWith('/book');

    const renderMenuItems = () => {
        if (!user) return null;

        const userRoles = Array.isArray(user.roles) ? user.roles.map((r: string) => r.toUpperCase()) : [];
        const sections: any[] = [];

        userRoles.forEach((role: string) => {
            switch (role) {
                case 'SUPER_ADMIN':
                    sections.push({
                        title: 'DASHBOARD',
                        items: [
                            { name: 'Overview', path: '/super-admin', icon: <FiHome /> },
                        ]
                    });
                    sections.push({
                        title: 'MANAGEMENT',
                        items: [
                            { name: 'Clinic Management', path: '/super-admin/clinics', icon: <FiGrid /> },
                            { name: 'Modules', path: '/super-admin/modules', icon: <FiPackage /> },
                            { name: 'Admins', path: '/super-admin/admins', icon: <FiUserPlus /> },
                            { name: 'Invoices & Plans', path: '/super-admin/invoices', icon: <FiFileText /> },
                        ]
                    });
                    sections.push({
                        title: 'SYSTEM',
                        items: [
                            { name: 'Audit Logs', path: '/super-admin/audit-logs', icon: <FiFileText /> },
                            { name: 'System Settings', path: '/super-admin/settings', icon: <FiSettings /> },
                        ]
                    });
                    break;
                case 'ADMIN':
                case 'CLINIC_ADMIN':
                    sections.push({
                        title: 'MANAGEMENT',
                        items: [
                            { name: 'Dashboard', path: '/clinic-admin', icon: <FiHome /> },
                            { name: 'Staff', path: '/clinic-admin/staff', icon: <FiUsers /> },
                            { name: 'Departments', path: '/clinic-admin/departments', icon: <FiBriefcase /> },
                            { name: 'Booking Links', path: '/clinic-admin/booking-link', icon: <FiGrid /> },
                            { name: 'Modules', path: '/clinic-admin/modules', icon: <FiPackage /> },
                        ]
                    });
                    sections.push({
                        title: 'OPERATIONS',
                        items: [
                            { name: 'Patients', path: '/reception/patients', icon: <FiUsers /> },
                            { name: 'Billing', path: '/reception/billing', icon: <FiDollarSign /> },
                            { name: 'Assessment Form Settings', path: '/clinic-admin/forms', icon: <FiFileText /> },
                        ]
                    });
                    sections.push({
                        title: 'SYSTEM',
                        items: [
                            { name: 'Audit Logs', path: '/clinic-admin/audit-logs', icon: <FiFileText /> },
                            { name: 'Settings', path: '/clinic-admin/settings', icon: <FiSettings /> },
                        ]
                    });
                    break;
                case 'DOCTOR':
                    sections.push({
                        title: 'MEDICAL',
                        items: [
                            { name: 'Overview', path: '/doctor', icon: <FiHome /> },
                            { name: 'Patients', path: '/doctor/patients', icon: <FiUsers /> },
                            { name: 'Assessments', path: '/doctor/assessments', icon: <FiActivity /> },
                            { name: 'Orders', path: '/doctor/orders', icon: <FiFileText /> },
                            { name: 'Medical Report', path: '/doctor/medical-report', icon: <FiFileText /> },
                        ]
                    });
                    break;
                case 'RECEPTIONIST':
                    sections.push({
                        title: 'RECEPTION',
                        items: [
                            { name: 'Dashboard', path: '/reception', icon: <FiHome /> },
                            { name: 'Calendar', path: '/reception/calendar', icon: <FiCalendar /> },
                            { name: 'Bookings', path: '/reception/bookings', icon: <FiGrid /> },
                            { name: 'Patients', path: '/reception/patients', icon: <FiUsers /> },
                            { name: 'Billing', path: '/reception/billing', icon: <FiDollarSign /> },
                            { name: 'Token Queue', path: '/reception/token-queue', icon: <FiList /> },
                        ]
                    });
                    break;
                case 'ACCOUNTANT':
                case 'ACCOUNTING':
                    sections.push({
                        title: 'FINANCE',
                        items: [
                            { name: 'Dashboard', path: '/accounting', icon: <FiHome /> },
                            { name: 'Billing', path: '/accounting/billing', icon: <FiPieChart /> },
                            { name: 'Reports', path: '/accounting/reports', icon: <FiFileText /> },
                        ]
                    });
                    break;
                case 'PHARMACY':
                    sections.push({
                        title: 'PHARMACY',
                        items: [
                            { name: 'Dashboard', path: '/pharmacy', icon: <FiHome /> },
                            { name: 'Prescriptions', path: '/pharmacy/prescriptions', icon: <FiFileText /> },
                            { name: 'Inventory', path: '/pharmacy/inventory', icon: <FiPackage /> },
                            { name: 'Reports', path: '/pharmacy/reports', icon: <FiPieChart /> },

                        ]
                    });
                    break;
                case 'LAB':
                case 'LABORATORY':
                    sections.push({
                        title: 'LABORATORY',
                        items: [
                            { name: 'Dashboard', path: '/lab', icon: <FiHome /> },
                            { name: 'Requests', path: '/lab/requests', icon: <FiFileText /> },
                            { name: 'Collection', path: '/lab/sample-collection', icon: <FiPackage /> },
                            { name: 'Results', path: '/lab/enter-results', icon: <FiEdit2 /> },
                            { name: 'Reports', path: '/lab/reports', icon: <FiPieChart /> },
                        ]
                    });
                    break;
                case 'RADIOLOGY':
                case 'RADIOLOGIST':
                    sections.push({
                        title: 'RADIOLOGY',
                        items: [
                            { name: 'Dashboard', path: '/radiology', icon: <FiHome /> },
                            { name: 'Requests', path: '/radiology/requests', icon: <FiFileText /> },
                            { name: 'Uploads', path: '/radiology/upload-images', icon: <FiUpload /> },
                            { name: 'Reports', path: '/radiology/reports', icon: <FiPieChart /> },
                        ]
                    });
                    break;
                case 'DOCUMENT_CONTROLLER':
                    sections.push({
                        title: 'DOCUMENTS',
                        items: [
                            { name: 'Dashboard', path: '/documents', icon: <FiHome /> },
                            { name: 'Upload', path: '/documents/upload', icon: <FiUpload /> },
                            { name: 'Archive', path: '/documents/archive', icon: <FiList /> },
                        ]
                    });
                    break;
                case 'PATIENT':
                    sections.push({
                        title: 'PATIENT PORTAL',
                        items: [
                            { name: 'Dashboard', path: '/patient', icon: <FiHome /> },
                            { name: 'Reports & Records', path: '/patient/reports', icon: <FiFileText /> },
                            { name: 'Book Appointment', path: '/patient/book', icon: <FiCalendar /> },
                            { name: 'My Appointments', path: '/patient/status', icon: <FiList /> },
                            { name: 'Settings', path: '/patient/settings', icon: <FiSettings /> },
                        ]
                    });
                    break;
            }
        });

        // Merge sections by title and deduplicate items by path
        const mergedSections: Record<string, any> = {};
        sections.forEach(sec => {
            if (!mergedSections[sec.title]) {
                mergedSections[sec.title] = { ...sec, items: [...sec.items] };
            } else {
                sec.items.forEach((item: any) => {
                    if (!mergedSections[sec.title].items.some((i: any) => i.path === item.path)) {
                        mergedSections[sec.title].items.push(item);
                    }
                });
            }
        });

        return Object.values(mergedSections).map((section, sidx) => (
            <div key={sidx} className="nav-section-container" style={{ marginBottom: '1.5rem' }}>
                <h4 className="nav-label" style={{ padding: '0 1.5rem', marginBottom: '0.5rem', opacity: 0.6, fontSize: '0.7rem' }}>{section.title}</h4>
                <div className="nav-group">
                    {section.items.map((item: any, idx: number) => (
                        <NavLink key={idx} to={item.path} end={item.path.split('/').length <= 2} className="nav-item">
                            {item.icon} <span>{item.name}</span>
                        </NavLink>
                    ))}
                </div>
            </div>
        ));
    };

    return (
        <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-brand">
                <div className="brand-logo" style={{ background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img
                        src={selectedClinic?.logo ? (selectedClinic.logo.startsWith('http') ? selectedClinic.logo : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selectedClinic.logo}`) : "/sidebar-logo.jpg"}
                        alt="Logo"
                        className="brand-icon-img"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                </div>
                <div className="brand-text">
                    <h2>{isPatientPath ? 'Exclusive Vision' : (selectedClinic?.name || 'EV Clinic')}</h2>
                    <p>{isPatientPath ? 'Patient Portal' : (selectedClinic ? 'CLINIC PANEL' : 'HOSPITAL OS')}</p>
                </div>
                <button className="sidebar-close" onClick={onClose}>×</button>
            </div>


            <nav className="sidebar-nav">
                {renderMenuItems()}
            </nav>

            {user && (
                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <FiLogOut />
                        <span>Sign Out</span>
                    </button>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
