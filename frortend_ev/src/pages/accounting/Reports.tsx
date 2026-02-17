import { useState } from 'react';
import { FiDownload, FiFilter, FiCalendar, FiSearch } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import '../reception/Dashboard.css';

const AccountingReports = () => {
    const { invoices, patients } = useApp() as any;
    const { selectedClinic } = useAuth() as any;
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const clinicInvoices = (invoices as any[]).filter((inv: any) => inv.clinicId === selectedClinic?.id);

    const filteredInvoices = clinicInvoices.filter((inv: any) => {
        const matchesStatus = filterStatus === 'All' || inv.status === filterStatus;
        const patient = (patients || []).find((p: any) => p.id === Number(inv.patientId));
        const matchesSearch = patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.service.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesDate = true;
        if (dateRange.start) {
            matchesDate = matchesDate && new Date(inv.date) >= new Date(dateRange.start);
        }
        if (dateRange.end) {
            matchesDate = matchesDate && new Date(inv.date) <= new Date(dateRange.end);
        }

        return matchesStatus && matchesSearch && matchesDate;
    });

    const exportToCSV = () => {
        const headers = ['Invoice ID', 'Date', 'Patient Name', 'Service', 'Amount (AED)', 'Status'];
        const rows = filteredInvoices.map(inv => {
            const patient = (patients || []).find((p: any) => p.id === Number(inv.patientId));
            return [
                inv.id,
                inv.date,
                patient?.name || 'Unknown',
                inv.service,
                inv.amount,
                inv.status
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reports_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="reception-dashboard">
            <div className="page-header">
                <div>
                    <h1>Financial Reports</h1>
                    <p>Analyze invoices, payments, and export records.</p>
                </div>
                <button className="btn btn-secondary btn-with-icon" onClick={exportToCSV}>
                    <FiDownload />
                    <span>Export CSV</span>
                </button>
            </div>

            <div className="section-card card mt-lg">
                <div className="report-filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div className="form-group mb-0">
                        <label><FiSearch className="mr-xs" /> Search</label>
                        <input
                            type="text"
                            placeholder="Patient or Invoice #"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="form-group mb-0">
                        <label><FiFilter className="mr-xs" /> Status</label>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="All">All Statuses</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="form-group mb-0">
                        <label><FiCalendar className="mr-xs" /> Start Date</label>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="form-group mb-0">
                        <label><FiCalendar className="mr-xs" /> End Date</label>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="section-card card mt-lg">
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Invoice #</th>
                                <th>Patient</th>
                                <th>Service</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.length > 0 ? filteredInvoices.map((inv: any) => {
                                const patient = patients.find((p: any) => p.id === Number(inv.patientId));
                                return (
                                    <tr key={inv.id}>
                                        <td>{inv.date}</td>
                                        <td><strong>{inv.id}</strong></td>
                                        <td>{patient?.name || 'Unknown'}</td>
                                        <td>{inv.service}</td>
                                        <td>AED {inv.amount}</td>
                                        <td>
                                            <span className={`status-pill ${inv.status.toLowerCase()}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="text-center p-lg">No records found matching filters.</td>
                                </tr>
                            )}
                        </tbody>
                        {filteredInvoices.length > 0 && (
                            <tfoot>
                                <tr>
                                    <td colSpan={4} className="text-right"><strong>Total:</strong></td>
                                    <td colSpan={2}>
                                        <strong>
                                            AED {filteredInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0).toLocaleString()}
                                        </strong>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccountingReports;
