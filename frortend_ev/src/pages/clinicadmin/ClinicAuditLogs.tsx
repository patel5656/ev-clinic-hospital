import { useState } from 'react';
import { FiFileText, FiSearch, FiDownload, FiFilter } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addClinicHeader } from '../../utils/pdfUtils';
import './ClinicAuditLogs.css';

const ClinicAuditLogs = () => {
    const { selectedClinic } = useAuth() as any;
    const { auditLogs } = useApp() as any;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');

    // Filter logs for current clinic only
    const clinicLogs = (auditLogs || []).filter((log: any) => {
        if (!log || !log.action || !log.performedBy) return false;

        // Only show logs related to this clinic
        const isClinicRelated = log.details?.clinicId === selectedClinic?.id ||
            log.action.includes('Staff') ||
            log.action.includes('Form') ||
            log.action.includes('Booking');

        if (!isClinicRelated) return false;

        const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.performedBy.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterAction === 'all' || log.action.includes(filterAction);
        return matchesSearch && matchesFilter;
    });

    const handleExport = async () => {
        const doc = new jsPDF();

        // Add Professional Branding Header with Logo
        const startY = await addClinicHeader(doc, selectedClinic, 'Clinic Audit Log Report');

        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, startY + 5);
        doc.text(`Total Records: ${clinicLogs.length}`, 14, startY + 10);

        // Map data for table
        const tableBody = clinicLogs.map((log: any) => [
            new Date(log.timestamp).toLocaleString(),
            log.action,
            log.performedBy,
            log.ipAddress || 'N/A',
            typeof log.details === 'object' && log.details
                ? Object.entries(log.details)
                    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                    .join('\n')
                : log.details || 'N/A'
        ]);

        // Generate Table
        autoTable(doc, {
            startY: startY + 20,
            head: [['Timestamp', 'Action', 'Performed By', 'IP Address', 'Details']],
            body: tableBody,
            headStyles: {
                fillColor: [45, 59, 174], // #2D3BAE
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            styles: {
                fontSize: 8,
                cellPadding: 3,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 40 },
                2: { cellWidth: 30 },
                3: { cellWidth: 25 },
                4: { cellWidth: 'auto' }
            },
            theme: 'striped'
        });

        // Save PDF
        doc.save(`${selectedClinic?.name?.toLowerCase().replace(/\s+/g, '-')}-audit-logs-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="clinic-audit-logs-page">
            <div className="page-header">
                <div>
                    <h1>Audit Logs</h1>
                    <p>Track all activities and changes made in your clinic</p>
                </div>
                <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={handleExport}>
                    <FiDownload />
                    <span>Export Logs</span>
                </button>
            </div>

            <div className="table-controls card">
                <div className="search-box">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search by action or user..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-box">
                    <FiFilter />
                    <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                        <option value="all">All Actions</option>
                        <option value="Staff">Staff Actions</option>
                        <option value="Form">Form Actions</option>
                        <option value="Booking">Booking Actions</option>
                        <option value="Settings">Settings Changes</option>
                    </select>
                </div>
            </div>

            <div className="table-container card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>Performed By</th>
                            <th>IP Address</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clinicLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="empty-state">
                                    <FiFileText size={48} />
                                    <p>No audit logs found</p>
                                </td>
                            </tr>
                        ) : (
                            clinicLogs.map((log: any) => (
                                <tr key={log.id}>
                                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td>
                                        <span className="action-badge">{log.action}</span>
                                    </td>
                                    <td>{log.performedBy}</td>
                                    <td><code>{log.ipAddress}</code></td>
                                    <td className="details-cell">
                                        {typeof log.details === 'object'
                                            ? Object.entries(log.details).map(([key, value]) => (
                                                <span key={key} className="detail-item">
                                                    <strong>{key}:</strong> {String(value)}
                                                </span>
                                            ))
                                            : log.details
                                        }
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClinicAuditLogs;
