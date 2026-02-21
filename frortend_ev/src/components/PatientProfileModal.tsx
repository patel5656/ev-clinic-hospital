import React, { useState, useEffect } from 'react';
import { FiUser, FiActivity, FiFileText, FiClock, FiX, FiMail, FiPhone, FiCalendar, FiUpload, FiDownload, FiFile, FiShoppingBag, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import { useApp } from '../context/AppContext';
import { doctorService } from '../services/doctor.service';
import { clinicService } from '../services/clinic.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addClinicHeader } from '../utils/pdfUtils';
import './PatientProfileModal.css';

interface PatientProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number;
    patientName?: string;
}

const PatientProfileModal: React.FC<PatientProfileModalProps> = ({ isOpen, onClose, patientId, patientName }) => {
    const { formTemplates } = useApp() as any;
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const displayName = patientName || profile?.patient?.name || 'Patient';
    const [activeTab, setActiveTab] = useState('history'); // history, template-ID, results, info, documents
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadData, setUploadData] = useState({ type: 'PASSPORT', name: '', url: '' });
    const [dynamicDocTypes, setDynamicDocTypes] = useState<string[]>([]);

    useEffect(() => {
        const fetchClinicDetails = async () => {
            try {
                const res = await clinicService.getClinicDetails();
                const clinicData = res.data?.data || res.data;
                if (clinicData?.documentTypes && clinicData.documentTypes.length > 0) {
                    setDynamicDocTypes(clinicData.documentTypes);
                    setUploadData(prev => ({ ...prev, type: clinicData.documentTypes[0] }));
                } else {
                    setDynamicDocTypes(['PASSPORT', 'ID_CARD', 'REPORT', 'OTHER']);
                }
            } catch (err) {
                console.error('Failed to fetch clinic details for doc types:', err);
                setDynamicDocTypes(['PASSPORT', 'ID_CARD', 'REPORT', 'OTHER']);
            }
        };
        if (isOpen) {
            fetchClinicDetails();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && patientId) {
            const fetchProfile = async () => {
                setLoading(true);
                try {
                    const res = await doctorService.getPatientProfile(patientId);
                    setProfile(res.data);
                } catch (error) {
                    console.error('Failed to fetch patient profile:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProfile();
        }
    }, [isOpen, patientId]);

    if (!isOpen) return null;

    const generateInvoicePDF = async (invoice: any) => {
        try {
            const doc = new jsPDF();

            // Fetch clinic details for header
            const clinicRes = await clinicService.getClinicDetails();
            const clinic = clinicRes.data || {};

            // Add Header
            await addClinicHeader(doc, clinic, 'Invoice');

            // Set content start Y
            let yPos = 55;

            // Invoice Details Box
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Invoice Details:', 15, yPos);
            yPos += 7;

            doc.setFont('helvetica', 'normal');
            doc.text(`Invoice Number: INV-${invoice.id}`, 15, yPos);
            // Handle date field (could be date or createdAt based on schema/usage)
            const invDate = invoice.date || invoice.createdAt;
            doc.text(`Date: ${new Date(invDate).toLocaleDateString()}`, 120, yPos);
            yPos += 6;

            doc.text(`Patient: ${displayName}`, 15, yPos);
            doc.text(`Status: ${invoice.status}`, 120, yPos);
            yPos += 10;

            // Determine Amount (Handle schema mismatch if needed)
            // Backend schema: amount. Frontend might expect totalAmount.
            const totalAmount = Number(invoice.amount || invoice.totalAmount || 0);

            // Table
            autoTable(doc, {
                startY: yPos,
                head: [['Service/Description', 'Amount (AED)']],
                body: [
                    [
                        invoice.service || 'Medical Service',
                        totalAmount.toFixed(2)
                    ]
                ],
                theme: 'grid',
                headStyles: { fillColor: [45, 59, 174] }, // Primary color
                styles: { fontSize: 10, cellPadding: 3 },
            });

            // Get final Y
            const finalY = (doc as any).lastAutoTable.finalY || yPos + 30;

            // Totals
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Amount: AED ${totalAmount.toFixed(2)}`, 140, finalY + 10, { align: 'right' });

            // Derived Paid/Due based on Status
            const isPaid = invoice.status === 'Paid';
            const paidAmt = isPaid ? totalAmount : (Number(invoice.paidAmount) || 0);
            const dueAmt = totalAmount - paidAmt;

            doc.text(`Paid Amount: AED ${paidAmt.toFixed(2)}`, 140, finalY + 16, { align: 'right' });
            doc.text(`Balance Due: AED ${dueAmt.toFixed(2)}`, 140, finalY + 22, { align: 'right' });

            // Footer
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.text('Thank you for your business.', 15, finalY + 35);

            doc.save(`Invoice-${invoice.id}.pdf`);

        } catch (error) {
            console.error('Failed to generate invoice PDF:', error);
            alert('Failed to generate invoice PDF');
        }
    };

    // Filter templates to show as tabs - only those that have at least one record for this patient
    // OR show all clinic themes? User said "based on the custom forms created by the clinic".
    // Let's show all published clinic templates.
    const clinicTemplates = formTemplates || [];

    return (
        <div className="profile-modal-overlay">
            <div className="profile-modal-container fade-in">
                <div className="profile-modal-sidebar">
                    <div className="profile-header-brief">
                        <div className="profile-avatar-large">
                            {displayName.charAt(0)}
                        </div>
                        <h2>{displayName}</h2>
                        <p>Patient ID: P-{patientId}</p>
                    </div>

                    <nav className="profile-nav">
                        <button
                            className={`profile-nav-item ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            <FiActivity /> <span>All Assessments</span>
                        </button>

                        <button
                            className={`profile-nav-item ${activeTab === 'visits' ? 'active' : ''}`}
                            onClick={() => setActiveTab('visits')}
                        >
                            <FiCalendar /> <span>Visits & Bookings</span>
                        </button>

                        <button
                            className={`profile-nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('prescriptions')}
                        >
                            <FiShoppingBag /> <span>Medicines</span>
                        </button>

                        {/* Dynamic Template Tabs */}
                        {clinicTemplates.map((template: any) => (
                            <button
                                key={template.id}
                                className={`profile-nav-item ${activeTab === `template-${template.id}` ? 'active' : ''}`}
                                onClick={() => setActiveTab(`template-${template.id}`)}
                            >
                                <FiFileText /> <span>{template.name}</span>
                            </button>
                        ))}

                        <div className="nav-divider" style={{ margin: '10px 0', borderTop: '1px solid #e2e8f0' }}></div>

                        <button
                            className={`profile-nav-item ${activeTab === 'results' ? 'active' : ''}`}
                            onClick={() => setActiveTab('results')}
                        >
                            <FiFileText /> <span>Lab & Radiology</span>
                        </button>
                        <button
                            className={`profile-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reports')}
                        >
                            <FiFile /> <span>Medical Reports</span>
                        </button>
                        <button
                            className={`profile-nav-item ${activeTab === 'billing' ? 'active' : ''}`}
                            onClick={() => setActiveTab('billing')}
                        >
                            <FiCreditCard /> <span>Invoices & Billing</span>
                        </button>
                        <button
                            className={`profile-nav-item ${activeTab === 'info' ? 'active' : ''}`}
                            onClick={() => setActiveTab('info')}
                        >
                            <FiUser /> <span>Personal Info</span>
                        </button>
                        <button
                            className={`profile-nav-item ${activeTab === 'documents' ? 'active' : ''}`}
                            onClick={() => setActiveTab('documents')}
                        >
                            <FiFile /> <span>Documents</span>
                        </button>
                    </nav>

                    <div className="profile-sidebar-footer">
                        <button className="btn-close-profile" onClick={onClose}>
                            <FiX /> Close File
                        </button>
                    </div>
                </div>

                <div className="profile-modal-content">
                    {loading ? (
                        <div className="profile-loading">
                            <div className="spinner"></div>
                            <p>Loading Patient File...</p>
                        </div>
                    ) : (
                        <div className="profile-content-scroll">
                            {/* Combined History or Multi-template filter */}
                            {(activeTab === 'history' || activeTab.startsWith('template-')) && (
                                <div className="profile-tab-content">
                                    <h3>
                                        {activeTab === 'history'
                                            ? 'Clinical Assessments'
                                            : clinicTemplates.find((t: any) => `template-${t.id}` === activeTab)?.name + ' History'
                                        }
                                    </h3>
                                    {profile?.medicalRecords?.length > 0 ? (
                                        <div className="timeline">
                                            {profile.medicalRecords
                                                .filter((record: any) => {
                                                    if (activeTab === 'history') return true;
                                                    const targetTemplateId = Number(activeTab.split('-')[1]);
                                                    return record.templateId === targetTemplateId;
                                                })
                                                .map((record: any) => (
                                                    <div key={record.id} className="timeline-item">
                                                        <div className="timeline-box">
                                                            <div className="timeline-header">
                                                                <h4>{record.formtemplate?.name || record.type}</h4>
                                                                <span className="badge-completed">Completed</span>
                                                            </div>
                                                            <div className="timeline-body">
                                                                <p><strong>Diagnosis:</strong> {record.data?.diagnosis || 'N/A'}</p>
                                                                {record.data?.advice && <p><strong>Advice:</strong> {record.data.advice}</p>}

                                                                {/* Display form specific fields if it's a template record */}
                                                                {record.templateId && record.data && (
                                                                    <div className="record-details-mini" style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                                                                        {Object.keys(record.data)
                                                                            .filter(k => !['diagnosis', 'advice', 'templateId', 'patientId', 'ordersSnapshot', 'followUpDate'].includes(k))
                                                                            .map(key => {
                                                                                // Resolve Label
                                                                                let label = key;
                                                                                // Try to find template in clinicTemplates
                                                                                const template = clinicTemplates.find((t: any) => t.id === record.templateId);
                                                                                if (template && template.fields) {
                                                                                    try {
                                                                                        const fields = Array.isArray(template.fields) ? template.fields : [];
                                                                                        const field = fields.find((f: any) => f.id === key);
                                                                                        if (field && field.label) label = field.label;
                                                                                    } catch (e) { }
                                                                                }

                                                                                // Get Value
                                                                                const val = record.data[key];
                                                                                if (!val || val === 'null' || val === 'undefined' || (Array.isArray(val) && val.length === 0)) return null;

                                                                                return (
                                                                                    <div key={key} className="detail-row">
                                                                                        <span style={{ color: '#64748b' }}>{label.charAt(0).toUpperCase() + label.slice(1)}: </span>
                                                                                        <span>{Array.isArray(val) ? val.join(', ') : String(val)}</span>
                                                                                    </div>
                                                                                );
                                                                            })
                                                                        }
                                                                    </div>
                                                                )}

                                                                {record.formtemplate?.name && activeTab === 'history' && (
                                                                    <p className="template-tag">Form: {record.formtemplate.name}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            {activeTab !== 'history' && profile.medicalRecords.filter((r: any) => r.templateId === Number(activeTab.split('-')[1])).length === 0 && (
                                                <div className="empty-profile-state">
                                                    <FiClock />
                                                    <p>No records found for this specific form.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="empty-profile-state">
                                            <FiClock />
                                            <p>No previous medical records found.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'visits' && (
                                <div className="profile-tab-content">
                                    <h3>Appointment & Visit History</h3>
                                    {profile?.appointments?.length > 0 ? (
                                        <div className="timeline">
                                            {profile.appointments.map((apt: any) => (
                                                <div key={apt.id} className="timeline-item">
                                                    <div className="timeline-date">
                                                        {new Date(apt.date).toLocaleDateString()}
                                                    </div>
                                                    <div className="timeline-box">
                                                        <div className="timeline-header">
                                                            <h4>{apt.serviceType || 'Consultation'}</h4>
                                                            <span className={`status-pill ${apt.status.toLowerCase()}`}>{apt.status}</span>
                                                        </div>
                                                        <div className="timeline-body">
                                                            <p><strong>Time:</strong> {apt.startTime} - {apt.endTime}</p>
                                                            {apt.reason && <p><strong>Reason:</strong> {apt.reason}</p>}
                                                            {apt.notes && <p><strong>Notes:</strong> {apt.notes}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-profile-state">
                                            <FiCalendar />
                                            <p>No appointment records found.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'prescriptions' && (
                                <div className="profile-tab-content">
                                    <h3>Medications & Prescriptions</h3>
                                    {profile?.medicalRecords?.filter((r: any) => String(r.type).toUpperCase().includes('PRESCRIPTION')).length > 0 ? (
                                        <div className="results-list">
                                            {profile.medicalRecords
                                                .filter((r: any) => String(r.type).toUpperCase().includes('PRESCRIPTION'))
                                                .map((record: any) => (
                                                    <div key={record.id} className="prescription-card-modern">
                                                        <div className="card-header-pres">
                                                            <FiShoppingBag />
                                                            <span>Prescribed on {new Date(record.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="card-body-pres">
                                                            {record.data?.medicines?.map((med: any, idx: number) => (
                                                                <div key={idx} className="med-item-row">
                                                                    <div className="med-name">{med.name}</div>
                                                                    <div className="med-dosage">{med.dosage} – {med.duration}</div>
                                                                    {med.instruction && <div className="med-instruction">{med.instruction}</div>}
                                                                </div>
                                                            )) || <p>No specific medicines listed.</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="empty-profile-state">
                                            <FiShoppingBag />
                                            <p>No prescription history found.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'results' && (
                                <div className="profile-tab-content">
                                    <h3>Laboratory & Imaging Results</h3>
                                    {profile?.serviceOrders?.length > 0 ? (
                                        <div className="results-list">
                                            {profile.serviceOrders.map((order: any) => (
                                                <div key={order.id} className="result-card">
                                                    <div className="result-card-header">
                                                        <div className={`result-type ${(order.type || '').toLowerCase()}`}>
                                                            {order.type || 'Unknown'}
                                                        </div>
                                                        <span className={`status-pill ${(order.testStatus || order.status || '').toLowerCase()}`}>
                                                            {order.testStatus || order.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                    <div className="result-card-body">
                                                        <h4>{order.testName}</h4>
                                                        <p className="result-date">Ordered: {new Date(order.createdAt).toLocaleDateString()}</p>

                                                        {(order.testStatus === 'Published' || order.testStatus === 'Result Uploaded' || order.status === 'Completed') ? (
                                                            <div className="result-findings mt-md">
                                                                <strong>Findings:</strong>
                                                                <p style={{ whiteSpace: 'pre-wrap' }}>
                                                                    {typeof order.result === 'object' ? (order.result.findings || order.result.result || 'View attached report') : (order.result || 'View attached report')}
                                                                </p>
                                                                {(order.result?.reportUrl || order.reportUrl) && (
                                                                    <a href={order.result?.reportUrl || order.reportUrl} target="_blank" rel="noreferrer" className="btn-view-report mt-sm">
                                                                        <FiDownload /> View PDF Report
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="pending-note">Result is still pending from the department.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Show external results linked to service orders if any */}
                                            {profile.documents?.filter((d: any) => d.type === 'OUTSIDE_LAB' || d.type === 'OUTSIDE_RAD').map((doc: any) => (
                                                <div key={doc.id} className="result-card external">
                                                    <div className="result-card-header">
                                                        <div className="result-type external">EXTERNAL</div>
                                                        <span className="status-pill completed">Uploaded</span>
                                                    </div>
                                                    <div className="result-card-body">
                                                        <h4>{doc.name}</h4>
                                                        <p className="result-date">Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</p>
                                                        <div className="result-findings mt-md">
                                                            <a href={doc.url} target="_blank" rel="noreferrer" className="btn-view-report">
                                                                <FiDownload /> View External Document
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-profile-state">
                                            <FiFileText />
                                            <p>No lab or radiology orders found.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'reports' && (
                                <div className="profile-tab-content">
                                    <h3>Medical Reports & Official Documents</h3>
                                    {profile?.medicalRecords?.filter((r: any) => ['MEDICAL_REPORT', 'MEDICAL REPORT', 'SICK_LEAVE', 'SICK LEAVE'].includes(String(r.type).toUpperCase())).length > 0 || (profile.documents?.filter((d: any) => d.type === 'REPORT').length > 0) ? (
                                        <div className="timeline">
                                            {/* Internal Generated Reports */}
                                            {profile.medicalRecords
                                                .filter((r: any) => ['MEDICAL_REPORT', 'MEDICAL REPORT', 'SICK_LEAVE', 'SICK LEAVE'].includes(String(r.type).toUpperCase()))
                                                .map((record: any) => (
                                                    <div key={record.id} className="timeline-item">
                                                        <div className="timeline-date">{new Date(record.createdAt).toLocaleDateString()}</div>
                                                        <div className="timeline-box">
                                                            <div className="timeline-header">
                                                                <h4>{record.type.replace('_', ' ')}</h4>
                                                                <FiCheckCircle color="var(--success-color)" />
                                                            </div>
                                                            <div className="timeline-body">
                                                                <p>{record.data?.details || record.data?.diagnosis || record.data?.notes || 'Official medical documentation'}</p>
                                                                <button className="btn-outline-primary btn-sm mt-sm">
                                                                    <FiDownload /> Generate PDF
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                            {/* Uploaded Reports */}
                                            {profile.documents
                                                .filter((d: any) => d.type === 'REPORT')
                                                .map((doc: any) => (
                                                    <div key={doc.id} className="timeline-item">
                                                        <div className="timeline-date">{new Date(doc.createdAt).toLocaleDateString()}</div>
                                                        <div className="timeline-box">
                                                            <div className="timeline-header">
                                                                <h4>{doc.name}</h4>
                                                                <span className="badge-external">External</span>
                                                            </div>
                                                            <div className="timeline-body">
                                                                <a href={doc.url} target="_blank" rel="noreferrer" className="btn-view-report mt-sm">
                                                                    <FiDownload /> Download Report
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="empty-profile-state">
                                            <FiFile />
                                            <p>No medical reports found.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'billing' && (
                                <div className="profile-tab-content">
                                    <h3>Billing & Invoices Summary</h3>
                                    {profile?.invoices?.length > 0 ? (
                                        <div className="billing-summary-grid">
                                            <div className="billing-stats-row">
                                                <div className="stat-card-mini">
                                                    <label>Total Invoiced</label>
                                                    <div className="value">AED {profile.invoices.reduce((sum: number, inv: any) => sum + Number(inv.amount || 0), 0).toFixed(2)}</div>
                                                </div>
                                                <div className="stat-card-mini">
                                                    <label>Total Paid</label>
                                                    <div className="value paid">AED {profile.invoices.reduce((sum: number, inv: any) => sum + (inv.status === 'Paid' ? Number(inv.amount || 0) : 0), 0).toFixed(2)}</div>
                                                </div>
                                                <div className="stat-card-mini">
                                                    <label>Outstanding</label>
                                                    <div className="value pending">AED {profile.invoices.reduce((sum: number, inv: any) => sum + (inv.status !== 'Paid' ? Number(inv.amount || 0) : 0), 0).toFixed(2)}</div>
                                                </div>
                                            </div>

                                            <table className="modern-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Invoice #</th>
                                                        <th>Status</th>
                                                        <th>Total</th>
                                                        <th>Paid</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {profile.invoices.map((inv: any) => (
                                                        <tr key={inv.id}>
                                                            <td>{new Date(inv.date || inv.createdAt).toLocaleDateString()}</td>
                                                            <td>INV-{inv.id}</td>
                                                            <td>
                                                                <span className={`status-pill ${inv.status.toLowerCase()}`}>
                                                                    {inv.status}
                                                                </span>
                                                            </td>
                                                            <td>AED {Number(inv.amount || 0).toFixed(2)}</td>
                                                            <td>AED {inv.status === 'Paid' ? Number(inv.amount || 0).toFixed(2) : '0.00'}</td>
                                                            <td>
                                                                <button
                                                                    className="btn-icon"
                                                                    onClick={() => generateInvoicePDF(inv)}
                                                                    title="Download PDF"
                                                                >
                                                                    <FiDownload />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="empty-profile-state">
                                            <FiCreditCard />
                                            <p>No billing records found.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'info' && (
                                <div className="profile-tab-content">
                                    <h3>Patient Details</h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label><FiUser /> Full Name</label>
                                            <p>{profile.patient.name}</p>
                                        </div>
                                        <div className="info-item">
                                            <label><FiMail /> Email</label>
                                            <p>{profile.patient.email || 'N/A'}</p>
                                        </div>
                                        <div className="info-item">
                                            <label><FiPhone /> Contact</label>
                                            <p>{profile.patient.phone || 'N/A'}</p>
                                        </div>
                                        <div className="info-item">
                                            <label><FiCalendar /> Age / Gender</label>
                                            <p>{profile.patient.age || '35'} Y / {profile.patient.gender || 'Male'}</p>
                                        </div>
                                        {profile.patient.location && (
                                            <div className="info-item">
                                                <label>Address</label>
                                                <p>{profile.patient.location}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className="profile-tab-content">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h3>Patient Documents</h3>
                                        <button
                                            className="btn-primary"
                                            onClick={() => setShowUploadModal(true)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                background: 'var(--primary-color)',
                                                transform: 'none',
                                                boxShadow: 'none'
                                            }}
                                        >
                                            <FiUpload /> Upload Document
                                        </button>
                                    </div>

                                    {profile?.documents?.length > 0 ? (
                                        <div>
                                            {/* Passport Documents */}
                                            {profile.documents.filter((d: any) => d.type === 'PASSPORT').length > 0 && (
                                                <div className="document-section" style={{ marginBottom: '24px' }}>
                                                    <h4 style={{ marginBottom: '12px', color: '#2D3BAE' }}>📘 Passport</h4>
                                                    <div className="documents-grid">
                                                        {profile.documents.filter((d: any) => d.type === 'PASSPORT').map((doc: any) => (
                                                            <div key={doc.id} className="document-card">
                                                                <div className="document-icon">📘</div>
                                                                <div className="document-info">
                                                                    <h5>{doc.name}</h5>
                                                                    <p className="document-date">
                                                                        {new Date(doc.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                <a
                                                                    href={doc.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="btn-download"
                                                                >
                                                                    <FiDownload />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ID Card Documents */}
                                            {profile.documents.filter((d: any) => d.type === 'ID_CARD').length > 0 && (
                                                <div className="document-section" style={{ marginBottom: '24px' }}>
                                                    <h4 style={{ marginBottom: '12px', color: '#2D3BAE' }}>🪪 ID Card</h4>
                                                    <div className="documents-grid">
                                                        {profile.documents.filter((d: any) => d.type === 'ID_CARD').map((doc: any) => (
                                                            <div key={doc.id} className="document-card">
                                                                <div className="document-icon">🪪</div>
                                                                <div className="document-info">
                                                                    <h5>{doc.name}</h5>
                                                                    <p className="document-date">
                                                                        {new Date(doc.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                <a
                                                                    href={doc.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="btn-download"
                                                                >
                                                                    <FiDownload />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Report Documents */}
                                            {profile.documents.filter((d: any) => d.type === 'REPORT').length > 0 && (
                                                <div className="document-section" style={{ marginBottom: '24px' }}>
                                                    <h4 style={{ marginBottom: '12px', color: '#2D3BAE' }}>📋 Reports</h4>
                                                    <div className="documents-grid">
                                                        {profile.documents.filter((d: any) => d.type === 'REPORT').map((doc: any) => (
                                                            <div key={doc.id} className="document-card">
                                                                <div className="document-icon">📋</div>
                                                                <div className="document-info">
                                                                    <h5>{doc.name}</h5>
                                                                    <p className="document-date">
                                                                        {new Date(doc.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                <a
                                                                    href={doc.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="btn-download"
                                                                >
                                                                    <FiDownload />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Other Documents */}
                                            {profile.documents.filter((d: any) => d.type === 'OTHER').length > 0 && (
                                                <div className="document-section" style={{ marginBottom: '24px' }}>
                                                    <h4 style={{ marginBottom: '12px', color: '#2D3BAE' }}>📎 Other Attachments</h4>
                                                    <div className="documents-grid">
                                                        {profile.documents.filter((d: any) => d.type === 'OTHER').map((doc: any) => (
                                                            <div key={doc.id} className="document-card">
                                                                <div className="document-icon">📎</div>
                                                                <div className="document-info">
                                                                    <h5>{doc.name}</h5>
                                                                    <p className="document-date">
                                                                        {new Date(doc.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                <a
                                                                    href={doc.url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="btn-download"
                                                                >
                                                                    <FiDownload />
                                                                </a>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="empty-profile-state">
                                            <FiFile />
                                            <p>No documents uploaded yet.</p>
                                            <button
                                                className="btn-primary"
                                                onClick={() => setShowUploadModal(true)}
                                                style={{
                                                    marginTop: '16px',
                                                    background: 'var(--primary-color)',
                                                    transform: 'none',
                                                    boxShadow: 'none'
                                                }}
                                            >
                                                <FiUpload /> Upload First Document
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Document Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>Upload Document</h3>
                            <button onClick={() => setShowUploadModal(false)} className="btn-close">
                                <FiX />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Document Type</label>
                                <select
                                    value={uploadData.type}
                                    onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                                    className="form-control"
                                >
                                    {dynamicDocTypes.map(type => (
                                        <option key={type} value={type}>
                                            {type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1).toLowerCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Document Name</label>
                                <input
                                    type="text"
                                    value={uploadData.name}
                                    onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                                    placeholder="e.g., Passport Copy"
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Document URL</label>
                                <input
                                    type="text"
                                    value={uploadData.url}
                                    onChange={(e) => setUploadData({ ...uploadData, url: e.target.value })}
                                    placeholder="https://example.com/document.pdf"
                                    className="form-control"
                                />
                                <small style={{ color: '#666', fontSize: '12px' }}>
                                    Upload your file to a cloud storage and paste the link here
                                </small>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowUploadModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                style={{
                                    padding: '0.5rem 1.25rem',
                                    background: '#f1f5f9',
                                    color: '#334155',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    outline: 'none',
                                }}
                                onMouseOver={e => (e.currentTarget.style.background = '#f1f5f9')}
                                onMouseOut={e => (e.currentTarget.style.background = '#f1f5f9')}
                                onClick={async () => {
                                    try {
                                        await doctorService.uploadPatientDocument(patientId, uploadData);
                                        setShowUploadModal(false);
                                        setUploadData({ type: 'PASSPORT', name: '', url: '' });
                                        // Refresh profile
                                        const res = await doctorService.getPatientProfile(patientId);
                                        setProfile(res.data);
                                    } catch (error) {
                                        console.error('Failed to upload document:', error);
                                        alert('Failed to upload document');
                                    }
                                }}
                            >
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientProfileModal;
