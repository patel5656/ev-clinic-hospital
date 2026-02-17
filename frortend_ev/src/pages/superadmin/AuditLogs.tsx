import { useState, useEffect } from 'react';
import { FiFileText, FiSearch, FiDownload, FiFilter } from 'react-icons/fi';
import { superService } from '../../services/super.service';
import './AuditLogs.css';

const AuditLogs = () => {
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAuditLogs();
    }, [searchTerm, filterAction]);

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (searchTerm) filters.search = searchTerm;
            if (filterAction !== 'all') filters.action = filterAction;

            const res: any = await superService.getAuditLogs(filters);
            setAuditLogs(res.data?.logs || []);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const csv = [
            ['Timestamp', 'Action', 'Performed By', 'IP Address', 'Details'].join(','),
            ...auditLogs.map((log: any) => [
                new Date(log.timestamp).toISOString(),
                log.action,
                log.performedBy,
                log.ipAddress || 'N/A',
                JSON.stringify(log.details || {})
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="audit-logs-page">
            <div className="page-header">
                <div>
                    <h1>Audit Logs</h1>
                    <p>Track all system activities and administrative actions.</p>
                </div>
                <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={handleExport} disabled={auditLogs.length === 0}>
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
                        <option value="Clinic">Clinic Actions</option>
                        <option value="Admin">Admin Actions</option>
                        <option value="Module">Module Actions</option>
                        <option value="Login">Login Actions</option>
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
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="empty-state">
                                    <p>Loading...</p>
                                </td>
                            </tr>
                        ) : auditLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="empty-state">
                                    <FiFileText size={48} />
                                    <p>No audit logs found</p>
                                </td>
                            </tr>
                        ) : (
                            auditLogs.map((log: any) => (
                                <tr key={log.id}>
                                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td>
                                        <span className="action-badge">{log.action}</span>
                                    </td>
                                    <td>{log.performedBy}</td>
                                    <td><code>{log.ipAddress || 'N/A'}</code></td>
                                    <td className="details-cell">
                                        {typeof log.details === 'object' && log.details
                                            ? Object.entries(log.details).map(([key, value]) => (
                                                <span key={key} className="detail-item">
                                                    <strong>{key}:</strong> {String(value)}
                                                </span>
                                            ))
                                            : log.details || 'N/A'
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

export default AuditLogs;
