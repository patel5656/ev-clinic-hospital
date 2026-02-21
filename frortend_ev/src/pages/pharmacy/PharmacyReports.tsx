import { useState, useEffect } from 'react';
import { FiCalendar, FiDollarSign, FiClock, FiList, FiDownload } from 'react-icons/fi';
import { pharmacyService } from '../../services/pharmacy.service';
import { useToast } from '../../context/ToastContext';
import '../SharedDashboard.css';

const PharmacyReports = () => {
    const toast = useToast();
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res: any = await pharmacyService.getReports(date);
            setReport(res.data || res);
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || 'Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [date]);

    const handlePrint = () => {
        window.print();
    };

    const MedicineRow = ({ name, qty }: { name: string, qty: number }) => (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem 0.75rem',
            borderBottom: '1px solid #f1f5f9',
            fontSize: '0.85rem',
            alignItems: 'center'
        }}>
            <span style={{ fontWeight: 500, color: '#334155' }}>{name}</span>
            <span style={{ fontWeight: 600, background: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>x{qty}</span>
        </div>
    );

    const ReportColumn = ({ title, icon, data, color }: { title: string, icon: any, data: any, color: string }) => {
        const hasMedicines = data?.medicines && data.medicines.length > 0;

        return (
            <div className="content-card" style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                margin: 0,
                padding: '0',
                overflow: 'hidden',
                borderTop: `4px solid ${color}`
            }}>
                <div style={{ padding: '1rem', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', margin: 0, color: '#0f172a' }}>
                        {icon} {title}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                        <div style={{ background: `${color}15`, padding: '0.5rem', borderRadius: '6px' }}>
                            <small style={{ color: color, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Orders</small>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>{data?.count || data?.totalCount || 0}</div>
                        </div>
                        <div style={{ background: `${color}15`, padding: '0.5rem', borderRadius: '6px' }}>
                            <small style={{ color: color, fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Revenue</small>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>
                                <span style={{ fontSize: '0.7rem', verticalAlign: 'top', marginRight: '2px' }}>AED</span>
                                {data?.revenue || data?.totalRevenue ? Number(data?.revenue || data?.totalRevenue).toFixed(2) : '0.00'}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '0.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiList size={14} className="text-muted" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Sold Items</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
                    {hasMedicines ? (
                        data.medicines.map((m: any, idx: number) => (
                            <MedicineRow key={idx} name={m.name} qty={m.quantity} />
                        ))
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                            No items sold
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="report-container" style={{
            height: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* INLINE STYLES FOR PRINTING */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .printable-report, .printable-report * {
                        visibility: visible;
                    }
                    .printable-report {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        padding: 20px;
                        color: black !important;
                    }
                    .dashboard-layout, .sidebar, .top-bar {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Header (Screen Only) */}
            <div className="page-header screen-only" style={{ marginBottom: '1rem', flexShrink: 0 }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem' }}>Pharmacy Daily Report</h1>
                    <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>Sales and shift breakdown for {new Date(date).toDateString()}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="date-picker-wrapper" style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        <FiCalendar className="text-muted" style={{ marginRight: '0.5rem' }} />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{ border: 'none', outline: 'none', color: '#334155', fontWeight: 500, fontFamily: 'inherit' }}
                        />
                    </div>
                    <button
                        className="btn btn-secondary btn-sm btn-with-icon"
                        onClick={handlePrint}
                        disabled={loading}
                        style={{
                            width: 'auto',
                            minWidth: 'fit-content',
                            whiteSpace: 'nowrap',
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #e2e8f0',
                            transform: 'none',
                            transition: 'none',
                            boxShadow: 'none'
                        }}
                    >
                        <FiDownload />
                        <span>Download PDF</span>
                    </button>
                </div>
            </div>

            {/* Content Grid (Screen Only) */}
            <div className="screen-only" style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(240px, 1fr) minmax(240px, 1fr) minmax(240px, 1fr)',
                gap: '1rem',
                flex: 1,
                minHeight: 0,
                paddingBottom: '0.5rem'
            }}>
                <ReportColumn
                    title="Total Daily Sales"
                    icon={<FiDollarSign />}
                    data={report?.daily}
                    color="#2563eb"
                />
                <ReportColumn
                    title="Morning (6AM - 2PM)"
                    icon={<FiClock />}
                    data={report?.shifts?.Morning}
                    color="#f59e0b"
                />
                <ReportColumn
                    title="Evening (2PM - 10PM)"
                    icon={<FiClock />}
                    data={report?.shifts?.Evening}
                    color="#f97316"
                />
                <ReportColumn
                    title="Night (10PM - 6AM)"
                    icon={<FiClock />}
                    data={report?.shifts?.Night}
                    color="#6366f1"
                />
            </div>

            {/* Printable Section (Hidden on Screen) */}
            <div className="printable-report" style={{ display: 'none' }}>
                <div style={{ borderBottom: '2px solid #334155', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E293B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Sales Report</h1>
                        <p style={{ margin: '5px 0 0 0', color: '#64748B' }}>Date: {new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p style={{ margin: '5px 0 0 0', color: '#64748B' }}>Department: Pharmacy</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Exclusive Vision Clinic</h2>
                        <p style={{ color: '#64748B', fontSize: '14px', margin: '5px 0 0 0' }}>Healthcare City, Dubai</p>
                        <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>Phone: +971 4 000 0000</p>
                    </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #E2E8F0' }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #CBD5E1', paddingBottom: '10px' }}>Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Total Orders</p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#0F172A' }}>{report?.daily?.totalCount || 0}</p>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>Total Revenue</p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>AED {report?.daily?.totalRevenue ? Number(report.daily.totalRevenue).toFixed(2) : '0.00'}</p>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #CBD5E1', paddingBottom: '10px' }}>Shift Breakdown</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#F1F5F9', color: '#475569' }}>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #E2E8F0' }}>Shift</th>
                                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>Orders</th>
                                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #E2E8F0' }}>Revenue (AED)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '10px', border: '1px solid #E2E8F0' }}>Morning (6AM - 2PM)</td>
                                <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>{report?.shifts?.Morning?.count || 0}</td>
                                <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #E2E8F0' }}>{report?.shifts?.Morning?.revenue ? Number(report.shifts.Morning.revenue).toFixed(2) : '0.00'}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px', border: '1px solid #E2E8F0' }}>Evening (2PM - 10PM)</td>
                                <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>{report?.shifts?.Evening?.count || 0}</td>
                                <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #E2E8F0' }}>{report?.shifts?.Evening?.revenue ? Number(report.shifts.Evening.revenue).toFixed(2) : '0.00'}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px', border: '1px solid #E2E8F0' }}>Night (10PM - 6AM)</td>
                                <td style={{ padding: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>{report?.shifts?.Night?.count || 0}</td>
                                <td style={{ padding: '10px', textAlign: 'right', border: '1px solid #E2E8F0' }}>{report?.shifts?.Night?.revenue ? Number(report.shifts.Night.revenue).toFixed(2) : '0.00'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #CBD5E1', paddingBottom: '10px' }}>Itemized Medicine Sales</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#F1F5F9', color: '#475569' }}>
                                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #E2E8F0' }}>Medicine Name</th>
                                <th style={{ padding: '10px', textAlign: 'right', border: '1px solid #E2E8F0', width: '100px' }}>Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report?.daily?.medicines && report.daily.medicines.length > 0 ? (
                                report.daily.medicines.map((m: any, idx: number) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '8px 10px', border: '1px solid #E2E8F0' }}>{m.name}</td>
                                        <td style={{ padding: '8px 10px', textAlign: 'right', border: '1px solid #E2E8F0' }}>{m.quantity}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} style={{ padding: '20px', textAlign: 'center', border: '1px solid #E2E8F0', fontStyle: 'italic', color: '#94A3B8' }}>No items sold on this date.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94A3B8' }}>
                    <div>
                        Generated by System on {new Date().toLocaleString()}
                    </div>
                    <div>
                        Page 1 of 1
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacyReports;
