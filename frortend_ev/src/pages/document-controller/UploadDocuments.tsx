import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiFileText, FiUser, FiUsers } from 'react-icons/fi';
import { documentService } from '../../services/document.service';
import { receptionService } from '../../services/reception.service';
import { clinicService } from '../../services/clinic.service';
import '../SharedDashboard.css';

const DOC_TYPES = [
    'Outside Lab Report',
    'Outside Radiology Report',
    'Sick Leave',
    'Medical Report',
    'Previous History',
    'Consent Form',
    'Insurance Card'
];

type UploadFor = 'patient' | 'staff';

const UploadDocuments = () => {
    const navigate = useNavigate();
    const [uploadFor, setUploadFor] = useState<UploadFor>('patient');
    const [patientId, setPatientId] = useState<string>('');
    const [staffId, setStaffId] = useState<string>('');
    const [docType, setDocType] = useState('Outside Lab Report');
    const [fileName, setFileName] = useState('');
    const [notes, setNotes] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [patients, setPatients] = useState<{ id: number; name: string; phone?: string }[]>([]);
    const [staffList, setStaffList] = useState<{ id: number; name: string }[]>([]);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [loadingStaff, setLoadingStaff] = useState(true);

    useEffect(() => {
        receptionService.getPatients()
            .then((res: any) => {
                const list = res?.data ?? res ?? [];
                setPatients(Array.isArray(list) ? list : []);
            })
            .catch(() => setPatients([]))
            .finally(() => setLoadingPatients(false));
    }, []);

    useEffect(() => {
        clinicService.getStaff()
            .then((res: any) => {
                const raw = res?.data ?? res ?? [];
                const list = Array.isArray(raw) ? raw : [];
                setStaffList(list.map((s: any) => ({
                    id: s.id,
                    name: s.user?.name || s.name || s.email || `Staff #${s.id}`
                })));
            })
            .catch(() => setStaffList([]))
            .finally(() => setLoadingStaff(false));
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitted(true);
        try {
            if (uploadFor === 'patient') {
                const pid = Number(patientId);
                if (!pid) {
                    setError('Please select a patient.');
                    setSubmitted(false);
                    return;
                }
                const res: any = await documentService.createRecord({
                    patientId: pid,
                    documentType: docType,
                    fileName: fileName || undefined,
                    notes: notes || undefined
                });
                const created = res?.data ?? res;
                alert(`Document uploaded successfully! ${created?.patientName ?? 'Patient'} – ${docType}. Record linked to the system.`);
                setPatientId('');
                navigate('/documents/patient-documents');
            } else {
                const sid = Number(staffId);
                if (!sid) {
                    setError('Please select a staff member.');
                    setSubmitted(false);
                    return;
                }
                await documentService.createStaffRecord({
                    staffId: sid,
                    documentType: docType,
                    fileName: fileName || undefined,
                    notes: notes || undefined
                });
                alert(`Staff document uploaded successfully! ${docType}. Record saved.`);
                setStaffId('');
                navigate('/documents/staff-documents');
            }
            setDocType('Outside Lab Report');
            setFileName('');
            setNotes('');
        } catch (err: any) {
            setError(err?.message || 'Upload failed.');
        } finally {
            setSubmitted(false);
        }
    };

    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Upload Documents</h1>
                    <p>Upload external documents and link them to patients or staff.</p>
                </div>
            </div>
            <div className="content-card">
                <div className="card-header">
                    <h2><FiUpload /> Upload External Document</h2>
                </div>
                <form onSubmit={handleUpload} style={{ padding: '2rem' }}>
                    {error && <div className="form-group" style={{ color: 'var(--danger, #dc3545)' }}>{error}</div>}

                    <div className="form-group">
                        <label>Upload for</label>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="uploadFor"
                                    checked={uploadFor === 'patient'}
                                    onChange={() => setUploadFor('patient')}
                                />
                                <FiUser /> Patient
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="uploadFor"
                                    checked={uploadFor === 'staff'}
                                    onChange={() => setUploadFor('staff')}
                                />
                                <FiUsers /> Staff
                            </label>
                        </div>
                    </div>

                    {uploadFor === 'patient' && (
                        <div className="form-group">
                            <label>Patient *</label>
                            <select
                                className="form-control"
                                value={patientId}
                                onChange={(e) => setPatientId(e.target.value)}
                                required={uploadFor === 'patient'}
                                disabled={loadingPatients}
                            >
                                <option value="">{loadingPatients ? 'Loading...' : 'Select patient'}</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} {p.phone ? `(${p.phone})` : ''}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {uploadFor === 'staff' && (
                        <div className="form-group">
                            <label>Staff *</label>
                            <select
                                className="form-control"
                                value={staffId}
                                onChange={(e) => setStaffId(e.target.value)}
                                required={uploadFor === 'staff'}
                                disabled={loadingStaff}
                            >
                                <option value="">{loadingStaff ? 'Loading...' : 'Select staff'}</option>
                                {staffList.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Document Type</label>
                        <select className="form-control" value={docType} onChange={(e) => setDocType(e.target.value)}>
                            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Select File (optional – name will be recorded)</label>
                        <input
                            type="file"
                            className="form-control"
                            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
                        />
                    </div>
                    <div className="form-group">
                        <label>Notes (optional)</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
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
                        disabled={submitted}
                    >
                        <FiFileText /> {uploadFor === 'patient' ? 'Save to Patient File' : 'Save to Staff File'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UploadDocuments;
