import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patient.service';
import { FiFileText, FiSearch, FiPrinter, FiEye, FiDownload, FiInfo } from 'react-icons/fi';
import Modal from '../../components/Modal';
import '../SharedDashboard.css';

const PatientRecords = () => {
    const { user, selectedClinic } = useAuth() as any;
    const [records, setRecords] = useState<any>({ assessments: [], serviceOrders: [], prescriptions: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Detailed View Logic
    const [selectedRecord, setSelectedRecord] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const res = await patientService.getMyMedicalRecords();
                setRecords(res.data || { assessments: [], serviceOrders: [], prescriptions: [] });
            } catch (error) {
                console.error('Failed to fetch medical records', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchRecords();
    }, [user]);

    const allRecords = [
        ...records.assessments.map((a: any) => ({
            ...a,
            displayType: 'Assessment',
            date: a.visitDate || a.createdAt,
            unifiedType: 'assessment'
        })),
        ...records.serviceOrders.map((s: any) => ({
            ...s,
            displayType: s.type,
            date: s.createdAt,
            unifiedType: 'order'
        })),
        ...records.prescriptions.map((p: any) => ({
            ...p,
            displayType: 'Prescription',
            date: p.createdAt,
            unifiedType: 'prescription'
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredRecords = allRecords.filter(item => {
        const matchesSearch =
            item.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.displayType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.formtemplate?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'all' || item.unifiedType === filterType;

        return matchesSearch && matchesType;
    });

    const openView = (record: any) => {
        setSelectedRecord(record);
        setIsViewModalOpen(true);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Medical Reports & Records</h1>
                    <p>View your complete health history, lab results, and prescriptions.</p>
                </div>
            </div>

            <div className="content-card">
                <div className="card-header no-print" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
                        <div className="input-with-icon-simple" style={{ flex: 1 }}>
                            <FiSearch />
                            <input
                                type="text"
                                placeholder="Search records, tests, or visits..."
                                className="form-control"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="form-control"
                            style={{ width: '180px' }}
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">All Records</option>
                            <option value="assessment">Assessments</option>
                            <option value="prescription">Prescriptions</option>
                            <option value="order">Lab & Radiology</option>
                        </select>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Description / Item</th>
                                <th>Facility</th>
                                <th>Status</th>
                                <th className="no-print">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center p-lg">Loading records...</td></tr>
                            ) : filteredRecords.length > 0 ? (
                                filteredRecords.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(item.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-pill ${item.unifiedType}`}>
                                                {item.displayType}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>
                                            {item.unifiedType === 'assessment' ? (
                                                item.formtemplate?.name || 'Clinical Evaluation'
                                            ) : item.unifiedType === 'prescription' ? (
                                                item.data?.diagnosis || 'Medication Prescription'
                                            ) : (
                                                item.testName
                                            )}
                                        </td>
                                        <td>{item.clinic?.name || 'EV Clinic'}</td>
                                        <td>
                                            <span className={`status-pill ${(item.testStatus || item.status || 'Completed').toLowerCase()}`}>
                                                {item.testStatus || item.status || 'Completed'}
                                            </span>
                                        </td>
                                        <td className="no-print">
                                            <button className="btn btn-secondary btn-sm btn-with-icon" onClick={() => openView(item)}>
                                                <FiEye /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="text-center p-lg text-muted">No records matching your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={selectedRecord?.displayType + " Details"}
                size="lg"
            >
                {selectedRecord && (
                    <div className="record-details-modal">
                        {/* Branded Header for Modal/Print */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ margin: 0 }}>{selectedClinic?.name || 'EV Clinic'}</h2>
                                <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Patient Medical Report</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: 0 }}><strong>Date:</strong> {new Date(selectedRecord.date).toLocaleDateString()}</p>
                                <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Ref: #{selectedRecord.id}</p>
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Patient Name</label>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{user?.name}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Type</label>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#4338ca', textAlign: 'right' }}>{selectedRecord.displayType}</div>
                            </div>
                        </div>

                        <div className="details-content">
                            {selectedRecord.unifiedType === 'assessment' ? (
                                <div className="assessment-data">
                                    <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Clinical Findings</h4>
                                    {(() => {
                                        const data = typeof selectedRecord.data === 'string' ? JSON.parse(selectedRecord.data) : (selectedRecord.data || selectedRecord.answers || {});
                                        const fields = selectedRecord.formtemplate?.fields ? (typeof selectedRecord.formtemplate.fields === 'string' ? JSON.parse(selectedRecord.formtemplate.fields) : selectedRecord.formtemplate.fields) : [];

                                        return Object.keys(data).filter(k => k !== 'ordersSnapshot' && k !== 'templateId' && k !== 'patientId').map(key => {
                                            const fieldDef = fields.find((f: any) => f.id === key);
                                            const label = fieldDef ? fieldDef.label : key.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
                                            const value = data[key];
                                            if (!value || (Array.isArray(value) && value.length === 0)) return null;

                                            return (
                                                <div key={key} style={{ marginBottom: '1rem' }}>
                                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>{label}</label>
                                                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '6px' }}>
                                                        {Array.isArray(value) ? value.join(', ') : String(value)}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            ) : selectedRecord.unifiedType === 'prescription' ? (
                                <div className="prescription-data">
                                    <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Prescription Details</h4>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Diagnosis</label>
                                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '6px' }}>{selectedRecord.data?.diagnosis || 'N/A'}</div>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Doctor's Advice</label>
                                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '6px' }}>{selectedRecord.data?.advice || 'No specific advice provided.'}</div>
                                    </div>
                                    {selectedRecord.data?.ordersSnapshot && selectedRecord.data.ordersSnapshot.filter((o: any) => o.type === 'PHARMACY').length > 0 && (
                                        <div style={{ marginTop: '1.5rem' }}>
                                            <h5 style={{ marginBottom: '0.75rem' }}>Medications</h5>
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Medicine</th>
                                                        <th>Qty</th>
                                                        <th>Instructions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedRecord.data.ordersSnapshot.filter((o: any) => o.type === 'PHARMACY').map((med: any, i: number) => (
                                                        <tr key={i}>
                                                            <td>{med.testName}</td>
                                                            <td>{med.quantity} {med.unit}</td>
                                                            <td>{med.details || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="order-data">
                                    <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Test Results</h4>
                                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>{selectedRecord.testName}</div>
                                        <div style={{ color: '#64748b' }}>Facility: {selectedRecord.clinic?.name || 'EV Clinic'}</div>
                                    </div>

                                    {(() => {
                                        try {
                                            const result = selectedRecord.result;
                                            const parsed = typeof result === 'string' && result.startsWith('{') ? JSON.parse(result) : null;

                                            if (parsed) {
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                        {parsed.findings && (
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Findings / Interpretation</label>
                                                                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>{parsed.findings}</div>
                                                            </div>
                                                        )}
                                                        {parsed.reportUrl && (
                                                            <div style={{ textAlign: 'center', padding: '1.5rem', border: '2px dashed #e2e8f0', borderRadius: '8px' }}>
                                                                <FiFileText size={40} style={{ color: '#94a3b8', marginBottom: '0.75rem' }} />
                                                                <p>A full digital report is available for this scan.</p>
                                                                <a href={parsed.reportUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                                    <FiDownload /> Download Full Report
                                                                </a>
                                                            </div>
                                                        )}
                                                        {!parsed.findings && !parsed.reportUrl && (
                                                            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                                                <FiInfo size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                                                <p>Result details are still being processed or were entered in a legacy format.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Clinical Note</label>
                                                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '6px' }}>{String(result || 'Completed')}</div>
                                                </div>
                                            );
                                        } catch (e) {
                                            return <div>{String(selectedRecord.result)}</div>;
                                        }
                                    })()}
                                </div>
                            )}
                        </div>

                        <div className="modal-actions no-print" style={{ marginTop: '2.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>Close</button>
                            <button className="btn btn-primary btn-with-icon" onClick={handlePrint} style={{ background: '#1e293b' }}>
                                <FiPrinter /> Print Report
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PatientRecords;
