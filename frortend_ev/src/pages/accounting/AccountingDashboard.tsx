import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiFileText, FiTrendingUp, FiCreditCard } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { dashboardService } from '../../services/dashboard.service';
import '../SharedDashboard.css';

const AccountingDashboard = () => {
    const { selectedClinic } = useAuth() as any;
    const { refreshTrigger } = useApp() as any;
    const navigate = useNavigate();
    const [stats, setStats] = useState<{
        todayIncome: number;
        pendingPayments: number;
        expenses: number;
        pendingInvoicesCount: number;
        invoices: any[];
    } | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        if (!selectedClinic?.id) return;
        setLoading(true);
        try {
            const res: any = await dashboardService.getStats('ACCOUNTANT');
            const data = res?.data ?? res;
            setStats({
                todayIncome: data.incomeToday ?? 0,
                pendingPayments: data.unpaidTotal ?? 0,
                expenses: 0,
                pendingInvoicesCount: data.pendingInvoices ?? 0,
                invoices: Array.isArray(data.invoices) ? data.invoices : []
            });
        } catch {
            setStats({
                todayIncome: 0,
                pendingPayments: 0,
                expenses: 0,
                pendingInvoicesCount: 0,
                invoices: []
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [selectedClinic?.id, refreshTrigger]);

    const recentInvoices = (stats?.invoices ?? []).slice(0, 5);

    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Accounting Overview</h1>
                    <p>Financial summaries and transaction monitoring for {selectedClinic?.name || 'Clinic'}.</p>
                </div>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={fetchStats}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Refresh Data'}
                </button>
            </div>

            {loading && !stats ? (
                <div className="p-lg text-center">Loading accounting data...</div>
            ) : (
                <>
                    <div className="stats-grid mt-lg">
                        <div
                            className="stat-card"
                            onClick={() => navigate('/accounting/billing')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="stat-icon green">
                                <FiDollarSign />
                            </div>
                            <div className="stat-info">
                                <h3>AED {(stats?.todayIncome ?? 0).toLocaleString()}</h3>
                                <p>Today Income</p>
                            </div>
                        </div>
                        <div
                            className="stat-card"
                            onClick={() => navigate('/accounting/billing')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="stat-icon orange">
                                <FiFileText />
                            </div>
                            <div className="stat-info">
                                <h3>AED {(stats?.pendingPayments ?? 0).toLocaleString()}</h3>
                                <p>Pending Payments</p>
                            </div>
                        </div>
                        <div
                            className="stat-card"
                            onClick={() => navigate('/accounting/reports')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="stat-icon blue">
                                <FiTrendingUp />
                            </div>
                            <div className="stat-info">
                                <h3>AED {(stats?.expenses ?? 0).toLocaleString()}</h3>
                                <p>Expenses</p>
                            </div>
                        </div>
                        <div
                            className="stat-card"
                            onClick={() => navigate('/accounting/billing')}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="stat-icon purple">
                                <FiCreditCard />
                            </div>
                            <div className="stat-info">
                                <h3>{stats?.pendingInvoicesCount ?? 0}</h3>
                                <p>Pending Invoices</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '3rem' }}>
                        <div className="content-card">
                            <div className="card-header">
                                <h2>Recent Financial Activity</h2>
                            </div>
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Inv #</th>
                                            <th>Patient</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentInvoices.map((inv: any) => (
                                            <tr key={inv.id}>
                                                <td>{inv.id}</td>
                                                <td>{inv.patient?.name ?? 'Unknown'}</td>
                                                <td>AED {inv.amount}</td>
                                                <td>
                                                    <span className={`status-pill ${(inv.status || '').toLowerCase()}`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="content-card">
                            <div className="card-header">
                                <h2>Quick Actions</h2>
                            </div>
                            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button className="btn btn-primary btn-no-hover" style={{ justifyContent: 'center' }} onClick={() => navigate('/accounting/reports')}>
                                    View Detailed Reports
                                </button>
                                <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => navigate('/accounting/billing')}>
                                    Manage Invoices
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AccountingDashboard;
