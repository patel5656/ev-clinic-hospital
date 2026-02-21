import { useState, useEffect } from 'react';
import { FiSearch, FiDollarSign, FiFileText, FiCheckCircle, FiAlertCircle, FiFilter, FiCalendar } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { superService } from '../../services/super.service';
import Modal from '../../components/Modal';
import './Invoices.css';

const Invoices = () => {
    const { clinics } = useApp() as any;
    const [searchTerm, setSearchTerm] = useState('');
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        startDate: '',
        endDate: '',
        clinicId: ''
    });
    const [reports, setReports] = useState<any>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchInvoices();
        fetchReports();
    }, [filters]);

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const res = await superService.getInvoices({
                ...filters,
                search: searchTerm
            });
            setInvoices(res.data || []);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchReports = async () => {
        try {
            const res = await superService.getReports(filters);
            setReports(res.data);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        }
    };

    const handleFilterChange = (e: any) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (date: string) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const parseInvoiceDescription = (desc: string) => {
        try {
            const parsed = JSON.parse(desc);
            return typeof parsed === 'object' ? parsed : { note: desc, base: 0, tax: 0, percent: 0 };
        } catch {
            return { note: desc, base: 0, tax: 0, percent: 0 };
        }
    };

    const handleViewInvoice = (invoice: any) => {
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const handlePrintInvoice = () => {
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            await superService.updateInvoiceStatus(id, newStatus);
            // Update local state
            setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
            setSelectedInvoice((prev: any) => ({ ...prev, status: newStatus }));
            fetchReports(); // Refresh stats
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update invoice status');
        }
    };

    return (
        <div className="invoices-page fade-in">
            <div className="page-header">
                <div>
                    <h2>Subscription & Revenue</h2>
                    <p>Track clinic payments, generate invoices, and monitor financial health</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-square" style={{ backgroundColor: '#10B98115', color: '#10B981' }}>
                        <FiDollarSign />
                    </div>
                    <div>
                        <p className="stat-label">Total Revenue</p>
                        <h3 className="stat-value">{formatCurrency(reports?.totalRevenue || 0)}</h3>
                        <span className="stat-sub text-success">Paid Invoices</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-square" style={{ backgroundColor: '#3F46B815', color: '#3F46B8' }}>
                        <FiFileText />
                    </div>
                    <div>
                        <p className="stat-label">Total Invoices</p>
                        <h3 className="stat-value">{reports?.totalInvoices || 0}</h3>
                        <span className="stat-sub text-muted">All Time</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-square" style={{ backgroundColor: '#10B98115', color: '#10B981' }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <p className="stat-label">Paid</p>
                        <h3 className="stat-value">{reports?.paidInvoices || 0}</h3>
                        <span className="stat-sub text-success">Collected</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-square" style={{ backgroundColor: '#EF444415', color: '#EF4444' }}>
                        <FiAlertCircle />
                    </div>
                    <div>
                        <p className="stat-label">Unpaid</p>
                        <h3 className="stat-value">{reports?.unpaidInvoices || 0}</h3>
                        <span className="stat-sub text-danger">Pending</span>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filters-container mt-lg">
                <div className="filters-header">
                    <div className="search-box-wrap">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Search by invoice number or clinic name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && fetchInvoices()}
                        />
                    </div>
                    <div className="filters-actions">
                        <div className="filter-item">
                            <label>Invoice Status</label>
                            <div className="filter-input-group">
                                <FiFilter />
                                <select name="status" value={filters.status} onChange={handleFilterChange}>
                                    <option value="all">Global (All)</option>
                                    <option value="Paid">Paid Only</option>
                                    <option value="Unpaid">Unpaid Only</option>
                                </select>
                            </div>
                        </div>
                        <div className="filter-item">
                            <label>Date Range</label>
                            <div className="filter-input-group">
                                <FiCalendar />
                                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                                <span className="text-muted">→</span>
                                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                            </div>
                        </div>
                        <div className="filter-item">
                            <label>Select Facility</label>
                            <div className="filter-input-group">
                                <select name="clinicId" value={filters.clinicId} onChange={handleFilterChange}>
                                    <option value="">All Facilities</option>
                                    {clinics.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button className="btn-apply" onClick={fetchInvoices}>Filter Result</button>
                    </div>
                </div>

                {/* Invoices Table */}
                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-state">
                            <div className="loader"></div>
                            <p>Querying financial records...</p>
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="empty-state">
                            <FiFileText size={48} />
                            <p>No invoices found matching your criteria</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Ref #</th>
                                    <th>Facility</th>
                                    <th>Billing Description</th>
                                    <th>Total Amount</th>
                                    <th>Issue Date</th>
                                    <th>Current Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id}>
                                        <td><span className="invoice-number">{invoice.invoiceNumber}</span></td>
                                        <td>
                                            <div className="clinic-info-cell">
                                                <strong>{invoice.clinic?.name || 'N/A'}</strong>
                                                <span className="text-xs text-muted">{invoice.clinic?.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm">{parseInvoiceDescription(invoice.description).note || invoice.description}</div>
                                            <div className="text-xs text-muted">Plan: {invoice.clinic?.subscriptionPlan || 'Monthly'}</div>
                                        </td>
                                        <td><span className="amount-display">{formatCurrency(Number(invoice.amount))}</span></td>
                                        <td>
                                            <div className="text-sm font-semibold">{formatDate(invoice.issuedDate)}</div>
                                            <div className="text-xs text-danger">Due: {formatDate(invoice.dueDate)}</div>
                                        </td>
                                        <td>
                                            <span
                                                className={`status-pill ${invoice.status.toLowerCase()} clickable-status`}
                                                title="Click to toggle status"
                                                onClick={() => handleUpdateStatus(invoice.id, invoice.status === 'Paid' ? 'Unpaid' : 'Paid')}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="action-btns">
                                            <button
                                                className={`action-btn-mini ${invoice.status === 'Paid' ? 'btn-mark-unpaid' : 'btn-mark-paid'}`}
                                                title={`Mark as ${invoice.status === 'Paid' ? 'Unpaid' : 'Paid'}`}
                                                onClick={() => handleUpdateStatus(invoice.id, invoice.status === 'Paid' ? 'Unpaid' : 'Paid')}
                                            >
                                                {invoice.status === 'Paid' ? <FiAlertCircle /> : <FiCheckCircle />}
                                            </button>
                                            <button
                                                className="action-btn-mini btn-view-invoice"
                                                title="View & Print Statement"
                                                onClick={() => handleViewInvoice(invoice)}
                                            >
                                                <FiFileText />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Invoice Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Invoice Details"
                size="lg"
            >
                {selectedInvoice && (
                    <div className="invoice-modal-content-wrapper">
                        <div id="print-area" className="invoice-print-layout">
                            <div className="view-header-main no-print-mt">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-md">
                                    <div>
                                        <h1 style={{ color: '#2D3BAE', fontWeight: 800, margin: 0, fontSize: '2.5rem', lineHeight: 1 }}>INVOICE</h1>
                                        <p className="text-muted" style={{ fontSize: '1.1rem', marginTop: '5px' }}># <strong>{selectedInvoice.invoiceNumber}</strong></p>
                                    </div>
                                    <div className="text-right-sm">
                                        <div className="invoice-logo-text" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E1B4B' }}>EV Clinic</div>
                                        <p className="text-muted text-sm">Exclusive Vision HIS Platform</p>
                                        <p className="text-xs text-muted">evclinic.com | support@evclinic.com</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-2 mt-xl" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '2rem' }}>
                                <div>
                                    <h4 className="text-muted text-uppercase text-xs" style={{ letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: 800 }}>Billed To</h4>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#1E1B4B' }}>{selectedInvoice.clinic?.name}</h3>
                                    <p className="text-sm text-muted" style={{ marginBottom: '0.25rem' }}>{selectedInvoice.clinic?.location || 'Registered Facility'}</p>
                                    <p className="text-sm" style={{ color: '#2D3BAE', fontWeight: 600 }}>{selectedInvoice.clinic?.email}</p>
                                </div>
                                <div className="text-right-sm">
                                    <h4 className="text-muted text-uppercase text-xs" style={{ letterSpacing: '0.1em', marginBottom: '0.75rem', fontWeight: 800 }}>Invoice Details</h4>
                                    <div className="invoice-info-row">
                                        <span className="text-sm text-muted">Issue Date:</span>
                                        <span className="text-sm font-semibold ml-sm">{formatDate(selectedInvoice.issuedDate)}</span>
                                    </div>
                                    <div className="invoice-info-row mt-xs">
                                        <span className="text-sm text-muted">Due Date:</span>
                                        <span className="text-sm font-semibold ml-sm text-danger">{formatDate(selectedInvoice.dueDate)}</span>
                                    </div>
                                    <div className="invoice-info-row mt-sm">
                                        <span
                                            className={`status-pill ${selectedInvoice.status.toLowerCase()}`}
                                            style={{ padding: '0.35rem 1.25rem', fontSize: '0.7rem' }}
                                        >
                                            {selectedInvoice.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="table-container-minimal mt-xl" style={{ borderRadius: '16px', border: '1.5px solid #F1F5F9', overflow: 'hidden' }}>
                                <table className="data-table-minimal w-full">
                                    <thead style={{ background: '#F8FAFC' }}>
                                        <tr>
                                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                                            <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const details = parseInvoiceDescription(selectedInvoice.description);
                                            return (
                                                <tr>
                                                    <td style={{ padding: '1.5rem' }}>
                                                        <div className="font-bold" style={{ fontSize: '1rem', color: '#1E1B4B', marginBottom: '0.5rem' }}>
                                                            {details.note || selectedInvoice.description}
                                                        </div>
                                                        <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
                                                            {details.base ? `Base Amount: ${formatCurrency(details.base)} | ` : ''}
                                                            Standard Subscription Plan access for EV Clinic platform modules and support systems.
                                                        </p>
                                                    </td>
                                                    <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                                                        <span className="font-bold" style={{ fontSize: '1.25rem', color: '#1E1B4B' }}>
                                                            {formatCurrency(details.base || Number(selectedInvoice.amount))}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-xl d-flex justify-content-end">
                                {(() => {
                                    const details = parseInvoiceDescription(selectedInvoice.description);
                                    const subtotal = details.base || Number(selectedInvoice.amount);
                                    const tax = details.tax || 0;
                                    const total = Number(selectedInvoice.amount);

                                    return (
                                        <div className="billing-summary-card" style={{ width: '100%', maxWidth: '320px', background: '#F8FAFC', padding: '1.5rem', borderRadius: '16px' }}>
                                            <div className="d-flex justify-content-between mb-xs">
                                                <span className="text-sm text-muted">Subtotal</span>
                                                <span className="text-sm font-semibold">{formatCurrency(subtotal)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-sm">
                                                <span className="text-sm text-muted">Tax (GST {details.percent || 0}%)</span>
                                                <span className="text-sm font-semibold">{formatCurrency(tax)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between pt-sm" style={{ borderTop: '2px solid #E2E8F0' }}>
                                                <h4 style={{ margin: 0, color: '#1E1B4B' }}>Total Amount</h4>
                                                <h3 style={{ margin: 0, color: '#2D3BAE', fontWeight: 800 }}>{formatCurrency(total)}</h3>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="mt-2xl pt-xl" style={{ borderTop: '1px solid #f1f5f9' }}>
                                <div className="grid grid-2">
                                    <div className="footer-notes">
                                        <h4 className="text-xs text-uppercase text-muted" style={{ letterSpacing: '0.1em', fontWeight: 800 }}>Notes & Terms</h4>
                                        <p className="text-xs text-muted mt-sm" style={{ maxWidth: '350px', lineHeight: 1.6 }}>
                                            Please make payment by the due date to ensure continued access.
                                            Contact accounts@evclinic.com for support.
                                        </p>
                                    </div>
                                    <div className="text-right-sm d-flex flex-column justify-content-end align-items-end-sm">
                                        <div className="signature-line" style={{ borderBottom: '2px solid #1E1B4B', width: '180px', marginBottom: '0.5rem' }}></div>
                                        <p className="font-bold text-sm" style={{ color: '#1E1B4B', margin: 0 }}>Authorized Signatory</p>
                                        <p className="text-xs text-muted">EV Clinic Finance Dept.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions mt-xl d-flex gap-md no-print" style={{ background: 'white', position: 'sticky', bottom: 0, paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Close Window</button>
                            <button className="btn btn-primary btn-no-hover" style={{ flex: 1 }} onClick={handlePrintInvoice}>
                                <FiFileText style={{ marginRight: '8px' }} /> Print Invoice
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Invoices;
