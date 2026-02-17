import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiDownload, FiArrowLeft, FiPrinter, FiCalendar, FiUser, FiActivity } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import './MedicalReport.css';

const MedicalReport = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { selectedClinic } = useAuth() as any;
    const { formTemplates } = useApp() as any;

    // State to hold report data
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (state && state.assessmentData && state.patient) {
            setReportData({
                patient: state.patient,
                assessment: state.assessmentData,
                doctor: state.doctor || { name: 'Doctor' },
                date: new Date().toISOString()
            });
            setLoading(false);
        } else {
            // If accessed directly without state, redirect back or show empty state
            setLoading(false);
        }
    }, [state]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        if (!reportData) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header - Clinic Info
        if (selectedClinic?.logo) {
            // Ideally we would add the logo here if we have base64 or a public URL
            // doc.addImage(...)
        }

        doc.setFontSize(22);
        doc.setTextColor(35, 40, 107); // Primary color
        doc.text(selectedClinic?.name || 'Medical Clinic', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Medical Report', pageWidth / 2, 28, { align: 'center' });

        doc.setDrawColor(200);
        doc.line(15, 35, pageWidth - 15, 35);

        // Patient Info
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Patient Name: ${reportData.patient.name}`, 15, 45);
        doc.text(`Patient ID: P-${reportData.patient.id}`, 15, 52);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 60, 45);

        // Content
        let yPos = 65;

        doc.setFontSize(14);
        doc.setTextColor(35, 40, 107);
        doc.text('Assessment Detail', 15, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.setTextColor(0);

        // Map through assessment data
        Object.entries(reportData.assessment).forEach(([key, value]: [string, any]) => {
            if (['diagnosis', 'advice', 'followUpDate', 'templateId'].includes(key)) return;

            // Try to find label
            let label = key;
            const template = formTemplates.find((t: any) => t.id === Number(reportData.assessment.templateId));
            if (template && template.fields) {
                try {
                    const fields = Array.isArray(template.fields) ? template.fields : JSON.parse(template.fields);
                    const field = fields.find((f: any) => f.id === key);
                    if (field && field.label) label = field.label;
                } catch (e) { }
            }

            doc.setFont('helvetica', 'bold');
            doc.text(`${label.charAt(0).toUpperCase() + label.slice(1)}:`, 15, yPos);
            doc.setFont('helvetica', 'normal');

            const text = Array.isArray(value) ? value.join(', ') : String(value);
            const splitText = doc.splitTextToSize(text, pageWidth - 60);
            doc.text(splitText, 60, yPos);

            yPos += (splitText.length * 6) + 4;
        });

        yPos += 5;

        // Diagnosis & Advice
        if (reportData.assessment.diagnosis) {
            doc.setFillColor(245, 247, 250);
            doc.rect(15, yPos, pageWidth - 30, 25, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(35, 40, 107);
            doc.text('Diagnosis', 20, yPos + 8);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0);
            doc.text(reportData.assessment.diagnosis, 20, yPos + 18);

            yPos += 35;
        }

        if (reportData.assessment.advice) {
            doc.setFont('helvetica', 'bold');
            doc.text('Advice / Plan:', 15, yPos);

            doc.setFont('helvetica', 'normal');
            const adviceText = doc.splitTextToSize(reportData.assessment.advice, pageWidth - 30);
            doc.text(adviceText, 15, yPos + 8);
            yPos += (adviceText.length * 6) + 15;
        }

        // Footer
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text('This is a computer generated document. No signature required.', pageWidth / 2, pageHeight - 15, { align: 'center' });

        doc.save(`Medical_Report_${reportData.patient.name.replace(/\s+/g, '_')}.pdf`);
    };

    if (loading) return <div className="loading-screen">Loading Report Preview...</div>;

    if (!reportData) return (
        <div className="empty-report-state">
            <FiActivity size={48} />
            <h2>No Report Data Available</h2>
            <p>Please select a completed assessment from the assessments list to generate a report.</p>
            <button className="btn-back" onClick={() => navigate('/doctor/assessments')}>
                <FiArrowLeft /> Back to Assessments
            </button>
        </div>
    );

    return (
        <div className="medical-report-page fade-in">
            <div className="report-header-actions">
                <button className="btn-back" onClick={() => navigate('/doctor/assessments')}>
                    <FiArrowLeft /> Back
                </button>
                <div className="report-actions">
                    <button
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: '#0f172a',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                        onClick={handleDownloadPDF}
                    >
                        <FiDownload /> Download PDF
                    </button>
                </div>
            </div>

            <div className="report-paper">
                {/* Header */}
                <header className="paper-header">
                    <div className="clinic-branding">
                        {selectedClinic?.logo && (
                            <img src={selectedClinic.logo.startsWith('http') ? selectedClinic.logo : `${import.meta.env.VITE_API_URL}${selectedClinic.logo}`} alt="Clinic Logo" />
                        )}
                        <div>
                            <h1>{selectedClinic?.name || 'Medical Clinic'}</h1>
                            <p>Official Medical Report</p>
                        </div>
                    </div>
                    <div className="report-meta">
                        <div className="meta-item">
                            <label>Date</label>
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="meta-item">
                            <label>Report ID</label>
                            <span>#{Math.floor(Math.random() * 100000)}</span>
                        </div>
                    </div>
                </header>

                <hr className="divider" />

                {/* Patient Info */}
                <section className="patient-section">
                    <div className="patient-info-card">
                        <div className="avatar-placeholder">
                            {reportData.patient.name.charAt(0)}
                        </div>
                        <div className="patient-details-grid">
                            <div>
                                <label>Patient Name</label>
                                <h3>{reportData.patient.name}</h3>
                            </div>
                            <div>
                                <label>Patient ID</label>
                                <p>P-{reportData.patient.id}</p>
                            </div>
                            <div>
                                <label>Age / Gender</label>
                                <p>{reportData.patient.age || 'N/A'} / {reportData.patient.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <label>Phone</label>
                                <p>{reportData.patient.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Assessment Body */}
                <section className="report-body">
                    <h2>Clinical Assessment</h2>

                    <div className="assessment-fields">
                        {Object.entries(reportData.assessment).map(([key, value]) => {
                            if (['diagnosis', 'advice', 'followUpDate', 'templateId', 'patientId', 'ordersSnapshot'].includes(key)) return null;

                            let label = key;
                            // Label resolution
                            try {
                                const template = formTemplates.find((t: any) => t.id === Number(reportData.assessment.templateId));
                                if (template) {
                                    const fields = Array.isArray(template.fields) ? template.fields :
                                        (typeof template.fields === 'string' ? JSON.parse(template.fields) : []);
                                    const field = fields.find((f: any) => f.id === key);
                                    if (field && field.label) label = field.label;
                                }
                            } catch (e) { }

                            if (!value || (Array.isArray(value) && value.length === 0)) return null;

                            return (
                                <div key={key} className="field-row">
                                    <span className="field-label">{label}:</span>
                                    <span className="field-value">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                                </div>
                            );
                        })}
                    </div>

                    {(reportData.assessment.diagnosis) && (
                        <div className="diagnosis-box">
                            <h3>Diagnosis</h3>
                            <p>{reportData.assessment.diagnosis}</p>
                        </div>
                    )}

                    {(reportData.assessment.advice) && (
                        <div className="advice-section">
                            <h3>Medical Advice / Plan</h3>
                            <p>{reportData.assessment.advice}</p>
                        </div>
                    )}
                </section>

                {/* Footer / Signature */}
                <footer className="paper-footer">
                    <div className="doctor-signature">
                        <p>Treating Doctor</p>
                        <div className="signature-line"></div>
                        <h4>Dr. {reportData.doctor?.name || 'Physician'}</h4>
                    </div>
                    <p className="disclaimer">This is a computer generated document. Valid without signature.</p>
                </footer>
            </div>
        </div>
    );
};

export default MedicalReport;
