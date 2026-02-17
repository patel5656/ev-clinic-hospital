import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patient.service';
import { FiCalendar, FiActivity, FiFileText } from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import '../SharedDashboard.css';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth() as any;
    const [bookings, setBookings] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [records, setRecords] = useState<any>({ assessments: [], serviceOrders: [], prescriptions: [] });
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bookingsRes, recordsRes, invoicesRes, docsRes] = await Promise.all([
                    patientService.getMyAppointments(),
                    patientService.getMyMedicalRecords(),
                    patientService.getMyInvoices(),
                    patientService.getMyDocuments()
                ]);
                setBookings(bookingsRes.data || []);
                setRecords(recordsRes.data || { assessments: [], serviceOrders: [], prescriptions: [] });
                setInvoices(invoicesRes.data || []);
                setDocuments(docsRes.data || []);
            } catch (error) {
                console.error('Failed to fetch patient data', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    if (loading) {
        return <div className="p-20 text-center">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Welcome back, {user?.name || 'Patient'}</h1>
                    <p>Access your reports, prescriptions, and health history.</p>
                </div>
                <div className="header-actions">
                    <NavLink
                        to="/patient/book"
                        className="btn btn-with-icon"
                        style={{
                            background: '#0f172a',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            textDecoration: 'none',
                            cursor: 'default'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                    >
                        <FiCalendar /> <span>Book New Appointment</span>
                    </NavLink>
                </div>
            </div>

            <div className="stats-grid mt-lg">
                <div
                    className="stat-card"
                    onClick={() => navigate('/patient/status')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="stat-icon blue">
                        <FiCalendar />
                    </div>
                    <div className="stat-info">
                        <h3>{bookings.length}</h3>
                        <p>Total Bookings</p>
                    </div>
                </div>
                <div
                    className="stat-card"
                    onClick={() => navigate('/patient/status')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="stat-icon green">
                        <FiActivity />
                    </div>
                    <div className="stat-info">
                        <h3>{bookings[0]?.status || 'No history'}</h3>
                        <p>Last Status</p>
                    </div>
                </div>
                <div
                    className="stat-card"
                    onClick={() => document.getElementById('medical-timeline')?.scrollIntoView({ behavior: 'smooth' })}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="stat-icon purple">
                        <FiFileText />
                    </div>
                    <div className="stat-info">
                        <h3>{records.assessments.length + records.serviceOrders.length + records.prescriptions.length}</h3>
                        <p>Total Clinical Records</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-sections mt-lg" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                <div className="content-card" id="medical-timeline">
                    <div className="card-header">
                        <h2>Your Medical Timeline</h2>
                    </div>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Details / Results</th>
                                    <th>Provider</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ...records.assessments.map((a: any) => ({ ...a, displayType: 'Assessment', date: a.visitDate })),
                                    ...records.serviceOrders.map((s: any) => ({ ...s, displayType: s.type, date: s.createdAt })),
                                    ...records.prescriptions.map((p: any) => ({ ...p, displayType: 'Prescription', date: p.createdAt }))
                                ]
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td>{new Date(item.date).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-pill ${item.displayType.toLowerCase()}`}>
                                                    {item.displayType}
                                                </span>
                                            </td>
                                            <td>
                                                {item.displayType === 'Assessment' ? (
                                                    <strong>{item.formtemplate?.name || 'Clinical Notes'}</strong>
                                                ) : item.displayType === 'Prescription' ? (
                                                    <div>
                                                        <strong>{item.data?.diagnosis || 'Prescription Details'}</strong>
                                                        <div className="text-secondary text-sm">
                                                            {item.data?.advice || ''}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <strong>{item.testName}</strong>
                                                        <div className="text-secondary text-sm">
                                                            {(() => {
                                                                try {
                                                                    const parsed = typeof item.result === 'string' && item.result.startsWith('{') ? JSON.parse(item.result) : null;
                                                                    if (parsed && (parsed.findings || parsed.reportUrl)) {
                                                                        return (
                                                                            <>
                                                                                <p>{parsed.findings || 'No notes'}</p>
                                                                                {parsed.reportUrl && (
                                                                                    <a href={parsed.reportUrl} target="_blank" rel="noreferrer" className="text-link-blue" style={{ display: 'inline-block', marginTop: '4px' }}>
                                                                                        📄 View Full Report
                                                                                    </a>
                                                                                )}
                                                                            </>
                                                                        );
                                                                    }
                                                                    return typeof item.result === 'string' ? item.result : 'Processing...';
                                                                } catch (e) {
                                                                    return String(item.result);
                                                                }
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td>{item.clinic?.name}</td>
                                            <td><span className={`status-pill ${item.testStatus?.toLowerCase() || item.status?.toLowerCase() || 'completed'}`}>{item.testStatus || item.status || 'Completed'}</span></td>
                                        </tr>
                                    ))}
                                {records.assessments.length === 0 && records.serviceOrders.length === 0 && records.prescriptions.length === 0 && (
                                    <tr><td colSpan={5} className="text-center p-md">No history found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                    <div className="content-card">
                        <div className="card-header">
                            <h2>Invoices & Billing</h2>
                        </div>
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Invoice #</th>
                                        <th>Description</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.length > 0 ? invoices.map((inv: any) => (
                                        <tr key={inv.id}>
                                            <td>{inv.id}</td>
                                            <td>{inv.service}</td>
                                            <td>{inv.clinic?.currency || 'AED'} {inv.amount}</td>
                                            <td><span className={`status-pill ${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                                            <td>{new Date(inv.date).toLocaleDateString()}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="text-center p-md">No payment history found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="content-card">
                        <div className="card-header">
                            <h2>Clinical Documents</h2>
                        </div>
                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>Name</th>
                                        <th>Clinic</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {documents.length > 0 ? documents.map((doc: any) => (
                                        <tr key={doc.id}>
                                            <td>
                                                <span className={`status-pill ${doc.type.toLowerCase()}`}>{doc.type}</span>
                                            </td>
                                            <td>{doc.name}</td>
                                            <td>{doc.clinic?.name}</td>
                                            <td>
                                                <a href={doc.path} target="_blank" rel="noreferrer" className="btn-primary-mini">View</a>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="text-center p-md">No documents uploaded.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
