import { useState, useEffect } from 'react';
import { FiActivity, FiCheckCircle, FiClock, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { labService } from '../../services/lab.service';
import { useToast } from '../../context/ToastContext';
import '../SharedDashboard.css';

/** Page 1: Laboratory Dashboard – overview only, no tabs */
const LabDashboard = () => {
    const toast = useToast();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ pending: 0, uploadedToday: 0 });
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            setRefreshing(true);
            const response: any = await labService.getOrders('LAB');
            let data = [];
            if (response?.status === 'success' && Array.isArray(response.data)) data = response.data;
            else if (Array.isArray(response)) data = response;
            else if (response?.data !== undefined) data = Array.isArray(response.data) ? response.data : [];

            setOrders(data);

            const today = new Date().toDateString();
            setStats({
                pending: data.filter((o: any) => (o.testStatus || o.status) === 'Pending').length,
                uploadedToday: data.filter((o: any) =>
                    ((o.testStatus || o.status) === 'Published' || (o.testStatus || o.status) === 'Completed' || (o.testStatus || o.status) === 'Result Uploaded') &&
                    new Date(o.updatedAt || o.createdAt).toDateString() === today
                ).length,
            });
        } catch (error) {
            console.error('Failed to fetch lab orders', error);
            toast.error('Failed to load lab requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Laboratory Dashboard</h1>
                    <p>Handle lab test results and reports.</p>
                </div>
                <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchOrders} disabled={refreshing}>
                    <FiRefreshCw className={refreshing ? 'spin' : ''} />
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
            </div>

            <div className="stats-grid mt-lg">
                <div className="stat-card clickable" onClick={() => navigate('/lab/requests')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon orange"><FiClock /></div>
                    <div className="stat-info">
                        <h3>{stats.pending}</h3>
                        <p>Pending Tests</p>
                    </div>
                </div>
                <div className="stat-card clickable" onClick={() => navigate('/lab/history')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon green"><FiCheckCircle /></div>
                    <div className="stat-info">
                        <h3>{stats.uploadedToday}</h3>
                        <p>Completed Today</p>
                    </div>
                </div>
            </div>

            <div className="content-section mt-xl">
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiActivity /> Pending Lab Requests</h2>
                    </div>
                    <div className="table-container mt-md">
                        {loading ? (
                            <div className="p-lg text-center">Loading requests...</div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Test Name</th>
                                        <th>Status</th>
                                        <th>Requested At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.filter((o: any) => (o.testStatus || o.status) === 'Pending').length > 0 ? (
                                        orders.filter((o: any) => (o.testStatus || o.status) === 'Pending').map((order: any) => (
                                            <tr key={order.id}>
                                                <td>{order.patient?.name || 'Unknown'}</td>
                                                <td><strong>{order.testName}</strong></td>
                                                <td><span className={`status-pill ${(order.testStatus || order.status || '').toLowerCase().replace(' ', '-')}`}>{order.testStatus || order.status}</span></td>
                                                <td>{new Date(order.createdAt).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={4} className="text-center p-lg text-muted">No pending lab requests.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <div className="content-section mt-xl">
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiCheckCircle /> Completed Tests & Reports</h2>
                    </div>
                    <div className="table-container mt-md">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Test</th>
                                    <th>Price</th>
                                    <th>Paid Status</th>
                                    <th>Invoice #</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.filter((o: any) => (o.testStatus || o.status) === 'Published' || (o.testStatus || o.status) === 'Completed' || (o.testStatus || o.status) === 'Result Uploaded').length > 0 ? (
                                    orders.filter((o: any) => (o.testStatus || o.status) === 'Published' || (o.testStatus || o.status) === 'Completed' || (o.testStatus || o.status) === 'Result Uploaded').map((order: any) => {
                                        let details: any = {};
                                        try { details = JSON.parse(order.result || '{}'); } catch (e) { }
                                        return (
                                            <tr key={order.id}>
                                                <td>{order.patient?.name || 'Unknown'}</td>
                                                <td>{order.testName}</td>
                                                <td>AED {details.amount ?? order.price ?? '-'}</td>
                                                <td><span className={`status-pill ${details.paid ? 'paid' : 'pending'}`}>{details.paid ? 'PAID' : 'PENDING'}</span></td>
                                                <td>{details.invoiceId || 'N/A'}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan={5} className="text-center p-md text-muted">No completed tests.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabDashboard;
