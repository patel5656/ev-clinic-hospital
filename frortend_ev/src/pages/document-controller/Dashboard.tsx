import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiSearch, FiFileText, FiClock, FiRefreshCw, FiEye, FiDownload } from 'react-icons/fi';
import { documentService } from '../../services/document.service';
import { receptionService } from '../../services/reception.service';
import Modal from '../../components/Modal';

import '../SharedDashboard.css';

const parseRecordData = (r: any) => {
    try {
        const d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {};
        return { notes: d.notes || '', fileName: d.fileName || '' };
    } catch {
        return { notes: '', fileName: '' };
    }
};

const downloadRecord = (r: any) => {
    const { notes, fileName } = parseRecordData(r);
    const lines = [
        `Patient: ${r.patientName || '—'}`,
        `Patient ID: #${r.patientId ?? '—'}`,
        `Document Type: ${r.type || '—'}`,
        `Date: ${r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}`,
        fileName ? `File Name: ${fileName}` : '',
        notes ? `Notes: ${notes}` : '',
        `Record ID: ${r.id}`
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${r.patientName || 'patient'}-${r.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
};

const DocumentControllerDashboard = () => {
    const navigate = useNavigate();
    const [patientId, setPatientId] = useState('');
    const [records, setRecords] = useState<any[]>([]);
    const [stats, setStats] = useState<{ total: number; pending: number; completed: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewRecord, setViewRecord] = useState<any>(null);
    const [uploadDocType, setUploadDocType] = useState('Previous History');
    const [uploadNotes, setUploadNotes] = useState('');
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [patients, setPatients] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            setRefreshing(true);
            const [recRes, statsRes, patRes]: any[] = await Promise.all([
                documentService.getRecords(),
                documentService.getStats(),
                receptionService.getPatients().catch(() => ({ data: [] }))
            ]);
            setRecords(recRes?.data ?? recRes ?? []);
            setStats(statsRes?.data ?? statsRes ?? null);
            const pList = patRes?.data ?? (Array.isArray(patRes) ? patRes : []);
            setPatients(pList);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId) return alert('Please select a patient.');
        if (uploadFiles.length === 0) return alert('Please select at least one file.');

        try {
            // Upload multiple files
            for (const file of uploadFiles) {
                await documentService.createRecord({
                    patientId: Number(patientId),
                    documentType: uploadDocType,
                    fileName: file.name,
                    notes: uploadNotes
                });
            }

            alert(`${uploadFiles.length} document(s) uploaded successfully! Records linked to the system.`);
            setPatientId('');
            setUploadNotes('');
            setUploadFiles([]);
            fetchData();
        } catch (err: any) {
            alert(err?.message || 'Upload failed.');
        }
    };

    const filteredRecords = records.filter(r =>
        (r.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.patientId).includes(searchTerm)
    );

    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Document Controller Dashboard</h1>
                    <p>Manage and track clinical records and uploads.</p>
                </div>
                <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchData} disabled={refreshing}>
                    <FiRefreshCw className={refreshing ? 'spin' : ''} />
                    <span>Refresh Data</span>
                </button>
            </div>

            <div className="stats-grid mt-lg">
                <div
                    className="stat-card"
                    onClick={() => navigate('/documents/archive')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="stat-icon purple"><FiFileText /></div>
                    <div className="stat-info">
                        <h3>{stats != null ? stats.total : (loading ? '—' : records.length)}</h3>
                        <p>Total Clinical Records</p>
                    </div>
                </div>
                <div
                    className="stat-card"
                    onClick={() => navigate('/documents/upload')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="stat-icon orange"><FiClock /></div>
                    <div className="stat-info">
                        <h3>{stats != null ? stats.pending : (loading ? '—' : records.filter(r => !r.isClosed).length)}</h3>
                        <p>Pending Processing</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', marginTop: '3rem' }}>
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiUpload /> Upload External Document</h2>
                    </div>
                    <form onSubmit={handleUpload} style={{ padding: '2rem' }}>
                        <div className="form-group">
                            <label>Patient *</label>
                            <select
                                className="form-control"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                required
                            >
                                <option value="">Select Patient</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (ID: {p.mrn || p.id})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Document Type</label>
                            <select
                                className="form-control"
                                value={uploadDocType}
                                onChange={(e) => setUploadDocType(e.target.value)}
                            >
                                <option value="Previous History">Previous History</option>
                                <option value="Outside Lab Report">Outside Lab Report</option>
                                <option value="Passport Copy">Passport Copy</option>
                                <option value="Insurance Card">Insurance Card</option>
                                <option value="Consent Form">Consent Form</option>
                                <option value="Any Other Custom Document">Any Other Custom Document</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Notes</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Add notes (optional)..."
                                value={uploadNotes}
                                onChange={(e) => setUploadNotes(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Select Files (Multiple allowed)</label>
                            <input
                                type="file"
                                className="form-control"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setUploadFiles(Array.from(e.target.files));
                                    }
                                }}
                            />
                            <small style={{ color: '#64748B', display: 'block', marginTop: '0.5rem' }}>
                                Supported: PDF, JPG, PNG, DOCX. Select multiple files to upload at once.
                            </small>
                        </div>
                        <div className="files-preview" style={{ marginBottom: '1rem' }}>
                            {uploadFiles.length > 0 && (
                                <ul style={{ listStyle: 'none', padding: '0.5rem', fontSize: '0.9rem', color: '#334155', maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                    {uploadFiles.map((f, i) => (
                                        <li key={i} style={{ padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                                            • {f.name} ({(f.size / 1024).toFixed(1)} KB)
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                background: '#2563EB',
                                borderColor: '#2563EB',
                                transform: 'none',
                                transition: 'none',
                                boxShadow: 'none'
                            }}
                            disabled={uploadFiles.length === 0}
                        >
                            Upload {uploadFiles.length > 0 ? `${uploadFiles.length} Documents` : 'Documents'}
                        </button>
                    </form>
                </div>


                <div className="content-card">
                    <div className="card-header">
                        <h2><FiSearch /> Recent Medical Records</h2>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                        <div className="search-box mb-md">
                            <div className="input-with-icon-simple">
                                <FiSearch />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by Patient Name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Doc Type</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={4} className="text-center">Loading...</td></tr>
                                    ) : filteredRecords.length > 0 ? filteredRecords.map(r => (
                                        <tr key={r.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{r.patientName}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>ID: #{r.patientId}</div>
                                            </td>
                                            <td>{r.type}</td>
                                            <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-secondary btn-sm" title="View" onClick={() => setViewRecord(r)}>
                                                    <FiEye />
                                                </button>
                                                <button className="btn btn-secondary btn-sm" title="Download" onClick={() => downloadRecord(r)}>
                                                    <FiDownload />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="text-center">No records found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} title="Document Details">
                {viewRecord && (() => {
                    // const { notes, fileName } = parseRecordData(viewRecord);
                    return (
                        <div style={{ lineHeight: 1.6 }}>
                            <p><strong>Patient:</strong> {viewRecord.patientName} (ID: #{viewRecord.patientId})</p>
                            <p><strong>Document Type:</strong> {viewRecord.documentType || viewRecord.type || '—'}</p>
                            <p><strong>Date:</strong> {viewRecord.createdAt ? new Date(viewRecord.createdAt).toLocaleString() : '—'}</p>
                            <div style={{ marginTop: '1rem' }}>
                                <button
                                    onClick={() => { downloadRecord(viewRecord); }}
                                    style={{
                                        background: '#0f172a',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'default',
                                        pointerEvents: 'auto'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#0f172a'; }}
                                >
                                    <FiDownload /> Download
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
};

export default DocumentControllerDashboard;
