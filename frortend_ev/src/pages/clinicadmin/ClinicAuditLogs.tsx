import { useState } from 'react';
import { FiFileText, FiSearch, FiDownload, FiFilter } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
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

    const handleExport = () => {
        const csv = [
            ['Timestamp', 'Action', 'Performed By', 'IP Address', 'Details'].join(','),
            ...clinicLogs.map((log: any) => [
                log.timestamp,
                log.action,
                log.performedBy,
                log.ipAddress,
                JSON.stringify(log.details)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clinic-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
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
