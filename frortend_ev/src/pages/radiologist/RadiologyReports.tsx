import { useState, useEffect } from 'react';
import { FiPieChart, FiSearch, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import { labService } from '../../services/lab.service';
import { useToast } from '../../context/ToastContext';
import '../SharedDashboard.css';

const RadiologyReports = () => {
    const toast = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response: any = await labService.getOrders('RADIOLOGY');
            let data: any[] = [];
            if (response?.status === 'success' && Array.isArray(response.data)) data = response.data;
            else if (Array.isArray(response)) data = response;
            else if (response?.data !== undefined) data = Array.isArray(response.data) ? response.data : [];

            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch radiology orders', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredAndSortedOrders = orders
        .filter((o: any) => {
            const name = (o.patient?.name || '').toLowerCase();
            const id = String(o.patientId || o.patient?.id || '').toLowerCase();
            const search = searchTerm.toLowerCase();
            return name.includes(search) || id.includes(search);
        })
        .sort((a, b) => {
            let valA: any, valB: any;
            if (sortBy === 'date') {
                valA = new Date(a.createdAt).getTime();
                valB = new Date(b.createdAt).getTime();
            } else if (sortBy === 'name') {
                valA = (a.patient?.name || '').toLowerCase();
                valB = (b.patient?.name || '').toLowerCase();
            } else if (sortBy === 'test') {
                valA = (a.testName || '').toLowerCase();
                valB = (b.testName || '').toLowerCase();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Radiology Reports</h1>
                    <p>Comprehensive history of patient imaging scans and reports.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchOrders}>
                        <FiRefreshCw />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            <div className="content-card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2><FiPieChart /> Patient Scan History</h2>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="search-box" style={{ maxWidth: '300px' }}>
                            <div className="input-with-icon-simple">
                                <FiSearch />
                                <input
                                    type="text"
                                    placeholder="Search by Name or ID..."
                                    className="form-control"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <select
                            className="form-control"
                            style={{ width: 'auto' }}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="date">Sort by Date</option>
                            <option value="name">Sort by Name</option>
                            <option value="test">Sort by Scan Type</option>
                        </select>
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem' }}
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Patient ID</th>
                                <th>Patient Name</th>
                                <th>Scan Type</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading reports...</td></tr>
                            ) : filteredAndSortedOrders.length > 0 ? (
                                filteredAndSortedOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td>#{order.patientId || order.patient?.id}</td>
                                        <td style={{ fontWeight: 600 }}>{order.patient?.name || 'Unknown'}</td>
                                        <td>{order.testName}</td>
                                        <td>
                                            <span className={`status-pill ${(order.testStatus || order.status || '').toLowerCase().replace(' ', '-')}`}>
                                                {order.testStatus || order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                                                <FiPrinter /> Print
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RadiologyReports;
