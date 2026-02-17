import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiDollarSign, FiFileText, FiPrinter, FiPlus, FiUser, FiCheck, FiDownload, FiCreditCard } from 'react-icons/fi';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { billingService } from '../../services/billing.service';
import Modal from '../../components/Modal';
import './Dashboard.css';

const CURRENCIES = [
    "USD", "EUR", "GBP", "AED", "INR", "CAD", "AUD", "SGD", "SAR", "QAR",
    "KWD", "OMR", "BHD", "MYR", "THB", "RUB", "ZAR", "PHP", "VND", "IDR",
    "TRY", "BRL", "NZD", "MXN", "HKD", "CNY", "JPY", "CHF", "SEK", "NOK",
    "DKK", "PLN", "HUF", "CZK", "ILS", "CLP", "COP", "PEN", "ARS", "EGP",
    "NGN", "KES", "PKR", "BDT", "LKR"
];

const Billing = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { invoices, patients, addInvoice, updatePatientStatus, refreshData } = useApp() as any;
    const { selectedClinic } = useAuth() as any;
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [focusedPatientId, setFocusedPatientId] = useState<string | null>(null);
    const [isPatientLocked, setIsPatientLocked] = useState(false);

    const pendingBillingRef = useRef<HTMLDivElement>(null);
    const allInvoicesRef = useRef<HTMLDivElement>(null);

    const scrollToPendingBilling = () => {
        pendingBillingRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToInvoices = () => {
        allInvoicesRef.current?.scrollIntoView({ behavior: 'smooth' });
    };




    // Currency from Clinic Settings (default to USD if not set)
    const currency = selectedClinic?.currency || 'USD';

    // Handle focus from navigation
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const pId = queryParams.get('focusedPatientId');
        if (pId) {
            setFocusedPatientId(pId);
            // Find the patient and trigger the modal if it exists in pending
            const patient = (patients || []).find((p: any) => p.id === Number(pId));
            if (patient) {
                setNewInvoice(prev => ({
                    ...prev,
                    patientId: pId,
                    service: patient.status === 'Pending Payment' ? 'Consultation Fee' : 'Treatment'
                }));
                setIsPatientLocked(true);
                setIsModalOpen(true);


                // Scroll to the row after a short delay to ensure rendering
                setTimeout(() => {
                    const element = document.getElementById(`pending-row-${pId}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('highlight-row-focus');
                    }
                }, 500);

                // Clear the focusedPatientId from URL without reloading page
                navigate(location.pathname, { replace: true });
            }
        }
    }, [location.search, patients, navigate, location.pathname]);


    // New Invoice State

    const [newInvoice, setNewInvoice] = useState({
        patientId: '',
        service: '',
        amount: '',
        currency: selectedClinic?.currency || 'USD',
        status: 'Pending',
        relatedId: '' // Can be assessmentId or walk-in registration ID
    });

    // Pay Invoice State
    const [invoiceToPay, setInvoiceToPay] = useState<any>(null);

    const clinicInvoices = (invoices as any[]).filter((inv: any) => inv.clinicId === selectedClinic?.id);
    const totalCollected = clinicInvoices
        .filter((inv: any) => inv.status === 'Paid')
        .reduce((sum: number, inv: any) => sum + Number(inv.amount), 0);
    const pendingCount = clinicInvoices.filter((inv: any) => inv.status === 'Pending').length;

    const [isPrinting, setIsPrinting] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

    // Trigger print when isPrinting state changes
    useEffect(() => {
        if (isPrinting) {
            // Small timeout to ensure Portal is rendered
            const timer = setTimeout(() => {
                window.print();
                setIsPrinting(false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isPrinting]);

    const handlePrint = (invoice: any) => {
        const patient = (patients as any[]).find((p: any) => p.id === Number(invoice.patientId)) || { name: 'Unknown' };
        setSelectedInvoice({ ...invoice, patientName: patient.name });
        setIsPrinting(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addInvoice({
                ...newInvoice,
                amount: Number(newInvoice.amount),
                clinicId: selectedClinic?.id
            });

            // Update patient status if payment is completed
            if (newInvoice.status === 'Paid') {
                const patient = (patients || []).find((p: any) => p.id === Number(newInvoice.patientId));
                if (patient && patient.status === 'Pending Payment') {
                    updatePatientStatus(patient.id, 'Active');
                }
            }

            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setIsModalOpen(false);
                setNewInvoice({ patientId: '', service: '', amount: '', currency: selectedClinic?.currency || 'USD', status: 'Pending', relatedId: '' });
                refreshData?.();
            }, 1500);
        } catch (err: any) {
            toast.error(err?.message || 'Failed to create invoice');
        }
    };

    const handleMarkPaid = async () => {
        if (!invoiceToPay) return;
        try {
            await billingService.updateInvoiceStatus(invoiceToPay.id, 'Paid');

            // Check if patient needs status update
            const patient = (patients || []).find((p: any) => p.id === Number(invoiceToPay.patientId));
            if (patient && patient.status === 'Pending Payment') {
                await updatePatientStatus(patient.id, 'Active');
            }

            toast.success('Payment recorded successfully');
            setIsPayModalOpen(false);
            setInvoiceToPay(null);
            refreshData?.();
        } catch (err: any) {
            console.error(err);
            toast.error('Failed to update payment status');
        }
    };

    const exportToCSV = () => {
        const headers = ['Invoice ID', 'Date', 'Patient Name', 'Service', `Amount (${currency})`, 'Status'];
        const rows = clinicInvoices.map((inv: any) => {
            const patient = (patients as any[]).find((p: any) => p.id === Number(inv.patientId)) || { name: 'Unknown' };
            return [
                inv.id,
                inv.date,
                patient.name,
                inv.service,
                inv.amount,
                inv.status
            ];
        });

        const csvContent = [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `invoices_${selectedClinic?.name || 'clinic'}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const pendingPatients = patients.filter((p: any) => p.status === 'Pending Payment' || (p.assessments && p.assessments.some((a: any) => a.isClosed && !a.isBilled)));

    return (
        <div className="reception-dashboard">
            <div className="page-header">
                <div>
                    <h1>Revenue & Billing</h1>
                    <p>Generate invoices and track patient payments.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary btn-with-icon" onClick={exportToCSV}>
                        <FiDownload />
                        <span>Export CSV</span>
                    </button>
                    <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={() => {
                        if ((patients as any[])?.length === 0) refreshData?.();
                        setNewInvoice({
                            patientId: '',
                            service: '',
                            amount: '',
                            currency: selectedClinic?.currency || 'USD',
                            status: 'Pending',
                            relatedId: ''
                        });
                        setIsPatientLocked(false);
                        setIsModalOpen(true);
                    }}>

                        <FiPlus />
                        <span>Create Invoice</span>
                    </button>
                </div>
            </div>

            <div className="stats-grid mt-lg">
                <div className="stat-card" onClick={scrollToInvoices} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                        <FiDollarSign />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Total Collected</p>
                        <h3 className="stat-value">{currency} {totalCollected.toLocaleString()}</h3>
                    </div>
                </div>
                <div className="stat-card" onClick={scrollToInvoices} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                        <FiFileText />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Pending Invoices</p>
                        <h3 className="stat-value">{pendingCount}</h3>
                    </div>
                </div>
                <div className="stat-card" onClick={scrollToPendingBilling} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                        <FiUser />
                    </div>
                    <div className="stat-info">
                        <p className="stat-label">Pending Billing</p>
                        <h3 className="stat-value">{pendingPatients.length}</h3>
                    </div>
                </div>
            </div>

            <div className="section-card card mt-lg" ref={pendingBillingRef}>
                <h3>Pending Billing Actions</h3>
                <div className="table-container mt-md">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Reason</th>
                                <th>Doctor</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingPatients.length > 0 ? pendingPatients.map((p: any) => (
                                <tr key={p.id} id={`pending-row-${p.id}`} className={focusedPatientId === p.id.toString() ? 'highlight-row-focus' : ''}>

                                    <td><strong>{p.name || 'Unknown'}</strong></td>
                                    <td>
                                        {p.status === 'Pending Payment' ? 'Walk-in / Registration Fee' : 'Completed Assessment'}
                                    </td>
                                    <td>{p.doctorId || 'N/A'}</td>
                                    <td>
                                        <button
                                            className="btn btn-primary btn-sm btn-no-hover"
                                            onClick={() => {
                                                setNewInvoice({ ...newInvoice, patientId: p.id.toString(), service: p.status === 'Pending Payment' ? 'Consultation Fee' : 'Treatment' });
                                                setIsPatientLocked(true);
                                                setIsModalOpen(true);
                                            }}

                                        >
                                            Generate Invoice
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center p-md text-secondary italic">No pending billing actions.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="section-card card mt-lg" ref={allInvoicesRef}>
                <h3>All Invoices</h3>
                <div className="table-container mt-md">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Patient</th>
                                <th>Service</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clinicInvoices.length > 0 ? clinicInvoices.map((inv: any) => {
                                const patient = (patients as any[]).find((p: any) => p.id === Number(inv.patientId)) || { name: 'Unknown' };
                                return (
                                    <tr key={inv.id}>
                                        <td><strong>{inv.id}</strong></td>
                                        <td>{patient.name}</td>
                                        <td>{inv.service}</td>
                                        <td>{currency} {inv.amount}</td>
                                        <td>
                                            <span className={`status-pill ${inv.status.toLowerCase()}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <FiPrinter className="clickable action-icon" onClick={() => handlePrint(inv)} title="Print Invoice" />
                                                {inv.status === 'Pending' && (
                                                    <FiCreditCard className="clickable action-icon text-success" onClick={() => {
                                                        setInvoiceToPay(inv);
                                                        setIsPayModalOpen(true);
                                                    }} title="Mark Paid" />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="text-center p-lg">No invoices found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Invoice">
                {isSuccess ? (
                    <div className="success-message text-center p-lg">
                        <FiCheck size={48} color="#10B981" />
                        <h3>Invoice Created!</h3>
                        <p>The invoice has been generated successfully.</p>
                    </div>
                ) : (
                    <form className="modal-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label><FiUser className="mr-xs" /> Select Patient *</label>
                            <select
                                required
                                value={newInvoice.patientId}
                                onChange={e => setNewInvoice({ ...newInvoice, patientId: e.target.value })}
                            >

                                {(patients as any[])
                                    .filter((p: any) => !isPatientLocked || p.id.toString() === newInvoice.patientId)
                                    .map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.id.toString().padStart(3, '0')}-{p.name || 'Unknown'}</option>
                                    ))}

                            </select>
                        </div>
                        <div className="form-group">
                            <label>Service Description *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g., General Consultation"
                                value={newInvoice.service}
                                onChange={e => setNewInvoice({ ...newInvoice, service: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Amount *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem' }}>
                                <select
                                    className="form-control"
                                    value={newInvoice.currency}
                                    onChange={e => setNewInvoice({ ...newInvoice, currency: e.target.value })}
                                    style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}
                                >
                                    {CURRENCIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    required
                                    placeholder="0.00"
                                    value={newInvoice.amount}
                                    onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Payment Status</label>
                            <select
                                value={newInvoice.status}
                                onChange={e => setNewInvoice({ ...newInvoice, status: e.target.value })}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </div>
                        <div className="modal-actions mt-lg">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary btn-no-hover">Generate Invoice</button>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Collect Payment" size="sm">
                <div className="p-md text-center">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', color: '#10B981' }}>
                            {currency} {invoiceToPay?.amount}
                        </h2>
                        <p className="text-muted">Total Amount Due</p>
                    </div>

                    <div className="payment-summary" style={{ textAlign: 'left', background: '#F8FAFC', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                        <p><strong>Invoice:</strong> #{invoiceToPay?.id}</p>
                        <p><strong>Service:</strong> {invoiceToPay?.service}</p>
                        <p><strong>Patient:</strong> {(patients as any[]).find((p: any) => p.id === Number(invoiceToPay?.patientId))?.name || 'Unknown'}</p>
                    </div>

                    <div className="modal-actions">
                        <button className="btn btn-secondary" onClick={() => setIsPayModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleMarkPaid}>
                            <FiCheck /> Confirm Payment
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Print Portal - Renders outside the main root div */}
            {isPrinting && selectedInvoice && createPortal(
                <div className="invoice-print-layout">
                    <div style={{ width: '100%', maxWidth: '100%', background: 'white', fontFamily: 'Inter, sans-serif' }}>
                        {/* Header */}
                        {/* Branded Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                                    <img
                                        src={selectedClinic?.logo ? (selectedClinic.logo.startsWith('http') ? selectedClinic.logo : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selectedClinic.logo}`) : "/sidebar-logo.jpg"}
                                        alt="Logo"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e1b4b', margin: 0, lineHeight: 1 }}>{selectedClinic?.name || 'EV Clinic'}</h2>
                                    <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>HEALTHCARE FACILITY</p>
                                </div>

                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#000', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>TAX INVOICE</h1>
                                <p style={{ color: '#000', marginTop: '5px', fontSize: '13px', fontWeight: 600 }}>{selectedClinic?.name || 'Exclusive Vision Clinic'}</p>
                                <p style={{ color: '#444', fontSize: '12px', margin: '2px 0 0' }}>{selectedClinic?.location || 'Healthcare City, Dubai'}</p>
                                {selectedClinic?.contact && <p style={{ color: '#444', fontSize: '12px', margin: '2px 0 0' }}>Tel: {selectedClinic.contact}</p>}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                            <div>
                                <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666', letterSpacing: '0.05em', marginBottom: '8px' }}>Bill To</h3>
                                <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', margin: 0 }}>{selectedInvoice.patientName}</p>
                                <p style={{ color: '#000', marginTop: '5px', fontSize: '13px' }}>Date: {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666', letterSpacing: '0.05em', marginBottom: '8px' }}>Invoice Details</h3>
                                <p style={{ color: '#000', fontWeight: 'bold', margin: 0 }}>#{selectedInvoice.id}</p>
                                <span style={{
                                    display: 'inline-block',
                                    marginTop: '8px',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid #000',
                                    color: '#000',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    {selectedInvoice.status}
                                </span>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #000', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 0', fontSize: '13px', textTransform: 'uppercase', color: '#000' }}>Description</th>
                                    <th style={{ padding: '10px 0', textAlign: 'right', fontSize: '13px', textTransform: 'uppercase', color: '#000' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px 0', color: '#000', fontSize: '14px' }}>
                                        {selectedInvoice.service}
                                    </td>
                                    <td style={{ padding: '15px 0', textAlign: 'right', fontWeight: 'bold', color: '#000', fontSize: '14px' }}>
                                        {currency} {selectedInvoice.amount}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #000', paddingTop: '15px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '13px', color: '#000', marginBottom: '5px' }}>Total Amount</p>
                                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#000' }}>
                                    {currency} {selectedInvoice.amount}
                                </p>
                            </div>
                        </div>

                        <div style={{ marginTop: '50px', textAlign: 'center', color: '#000', fontSize: '11px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                            <p style={{ margin: 0 }}>Thank you for choosing {selectedClinic?.name || 'Exclusive Vision Clinic'}.</p>
                            <p style={{ margin: '5px 0 0' }}>This is a computer-generated invoice.</p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Billing;
