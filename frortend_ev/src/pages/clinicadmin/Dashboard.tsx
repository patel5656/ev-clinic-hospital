import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiCalendar, FiDollarSign, FiFileText, FiPlus, FiCopy, FiBookmark } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { dashboardService } from '../../services/dashboard.service';
import './Dashboard.css';

const ClinicAdminHome = () => {
    const navigate = useNavigate();
    const { selectedClinic } = useAuth() as any;
    const { staff, clinics, refreshTrigger } = useApp() as any;
    const [copySuccess, setCopySuccess] = useState(false);
    const [clinicStats, setClinicStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        dashboardService.getStats('ADMIN')
            .then((res: any) => { if (!cancelled) setClinicStats(res?.data ?? res); })
            .catch(() => { if (!cancelled) setClinicStats({}); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [selectedClinic?.id, refreshTrigger]);

    const currentClinic = (clinics as any[])?.find((c: any) => c.id === selectedClinic?.id) || selectedClinic;
    const clinicStaffList = (staff as any[])?.filter((s: any) => s.clinicId === currentClinic?.id || (s.clinics || []).includes(currentClinic?.id)) ?? [];

    const stats = [
        { label: 'Total Bookings', value: String(clinicStats?.totalAppointments ?? 0), icon: <FiBookmark />, color: '#6366F1' },
        { label: "Today's Appointments", value: String(clinicStats?.todayAppointments ?? 0), icon: <FiCalendar />, color: '#10B981' },
        { label: 'Today Revenue', value: `AED ${Number(clinicStats?.todayRevenue ?? 0).toLocaleString()}`, icon: <FiDollarSign />, color: '#3F46B8' },
        { label: 'Pending Bills', value: String(clinicStats?.pendingBills ?? 0), icon: <FiFileText />, color: '#F59E0B' },
        { label: 'Staff Count', value: String(clinicStats?.totalStaff ?? 0), icon: <FiUsers />, color: '#23286B' },
    ];

    const handleCopyBookingLink = () => {
        const url = `${window.location.origin}/walkin/book/${currentClinic?.id}`;
        navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    if (loading && !clinicStats) {
        return (
            <div className="dashboard-home">
                <div className="page-header"><h2>{currentClinic?.name || 'Clinic'} Dashboard</h2></div>
                <div className="stats-grid" style={{ opacity: 0.7 }}>{[1, 2, 3, 4].map(i => <div key={i} className="stat-card"><p className="stat-label">—</p><h3 className="stat-value">...</h3></div>)}</div>
            </div>
        );
    }

    return (
        <div className="dashboard-home">
            <div className="dashboard-welcome">
                <h2>{currentClinic?.name || 'Clinic'} Dashboard</h2>
                <p>Today&apos;s appointments, revenue, and staff.</p>
            </div>
            <div className="stats-grid">
                {stats.map((s, i) => (
                    <div
                        key={i}
                        className="stat-card"
                        onClick={() => {
                            if (s.label.includes('Staff')) navigate('/clinic-admin/staff');
                            else if (s.label.includes('Bookings') || s.label.includes('Appointments')) navigate('/reception/bookings');
                            else if (s.label.includes('Revenue') || s.label.includes('Bills')) navigate('/reception/billing');
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="stat-icon-square" style={{ backgroundColor: `${s.color}15`, color: s.color }}>{s.icon}</div>
                        <p className="stat-label">{s.label}</p>
                        <h3 className="stat-value">{s.value}</h3>
                    </div>
                ))}
            </div>
            <div className="card mt-lg" style={{ padding: '1rem' }}>
                <button type="button" className="btn btn-primary btn-sm btn-no-hover" onClick={() => navigate('/clinic-admin/staff')}><FiPlus /> Add Staff</button>
                <button type="button" className="btn btn-secondary btn-sm" style={{ marginLeft: '0.5rem' }} onClick={handleCopyBookingLink}>{copySuccess ? 'Copied!' : 'Copy Booking Link'}</button>
                <button type="button" className="btn btn-secondary btn-sm" style={{ marginLeft: '0.5rem' }} onClick={() => navigate('/clinic-admin/booking-link')}><FiCopy /> Booking Link</button>
            </div>
            <div className="card mt-md" style={{ padding: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Recent Staff</h3>
                {clinicStaffList.slice(0, 5).map((s: any) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                        <span>{s.name}</span>
                        <span className="text-muted">{s.role || (s.roles && s.roles[0])}</span>
                    </div>
                ))}
                {clinicStaffList.length === 0 && <p className="text-muted">No staff.</p>}
            </div>
        </div>
    );
};

export default ClinicAdminHome;
