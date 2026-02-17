import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiCheckCircle, FiCreditCard } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { dashboardService } from '../../services/dashboard.service';
import './Dashboard.css';

const SuperAdminHome = () => {
    const navigate = useNavigate();
    const { refreshTrigger } = useApp() as any;
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        dashboardService.getStats('SUPER_ADMIN')
            .then((res: any) => { if (!cancelled) setStats(res?.data ?? res); })
            .catch(() => { if (!cancelled) setStats({}); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [refreshTrigger]);

    if (loading) {
        return (
            <div className="dashboard-home">
                <div className="page-header"><h2>Super Admin</h2></div>
                <div className="stats-grid" style={{ opacity: 0.7 }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="stat-card"><div className="stat-label">—</div><div className="stat-value">...</div></div>
                    ))}
                </div>
            </div>
        );
    }

    const cards = [
        { label: 'TOTAL CLINICS', value: String(stats?.totalClinics ?? 0), icon: <FiHome />, color: '#23286B', path: '/super-admin/clinics' },
        { label: 'ACTIVE CLINICS', value: String(stats?.activeClinics ?? 0), icon: <FiCheckCircle />, color: '#10B981', path: '/super-admin/clinics' },
        { label: 'TOTAL USERS', value: String(stats?.totalUsers ?? 0), icon: <FiUsers />, color: '#3F46B8', path: '/super-admin/admins' },
        { label: 'SUBSCRIPTION STATUS', value: stats?.subscriptionStatus ?? '—', icon: <FiCreditCard />, color: '#F59E0B', path: '/super-admin/invoices' },
    ];

    return (
        <div className="dashboard-home">
            <div className="page-header">
                <h2>Super Admin</h2>
                <p>Manage all clinics and system settings.</p>
            </div>
            <div className="stats-grid">
                {cards.map((c, i) => (
                    <div key={i} className="stat-card" onClick={() => c.path && navigate(c.path)} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon-square" style={{ backgroundColor: `${c.color}15`, color: c.color }}>{c.icon}</div>
                        <p className="stat-label">{c.label}</p>
                        <h3 className="stat-value">{c.value}</h3>
                    </div>
                ))}
            </div>
            <div className="card mt-lg" style={{ padding: '1.25rem' }}>
                <button type="button" className="btn btn-primary btn-no-hover" onClick={() => navigate('/super-admin/clinics')}>Clinics Management</button>
                <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Plans & Pricing · Users · Settings · Reports</span>
            </div>
        </div>
    );
};

export default SuperAdminHome;
