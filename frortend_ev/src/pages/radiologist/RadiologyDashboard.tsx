import { useState, useEffect, useRef } from 'react';
import { FiActivity, FiCheckCircle, FiClock } from 'react-icons/fi';
import { labService } from '../../services/lab.service';
import { useToast } from '../../context/ToastContext';
import '../SharedDashboard.css';

/** Page 1: Radiology Dashboard – overview only */
const RadiologyDashboard = () => {
    const toast = useToast();
    const [stats, setStats] = useState({ pending: 0, completedToday: 0 });
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);


    const pendingRef = useRef<HTMLDivElement>(null);
    const completedRef = useRef<HTMLDivElement>(null);

    const scrollToPending = () => {
        pendingRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToCompleted = () => {
        completedRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchOrders = async () => {
        try {

            const response: any = await labService.getOrders('RADIOLOGY');
            let data = [];
            if (response?.status === 'success' && Array.isArray(response.data)) data = response.data;
            else if (Array.isArray(response)) data = response;
            else if (response?.data !== undefined) data = Array.isArray(response.data) ? response.data : [];
            setOrders(data);
            setStats({
                pending: data.filter((o: any) => (o.testStatus || o.status) === 'Pending').length,
                completedToday: data.filter((o: any) => ['Completed', 'Published', 'Result Uploaded'].includes(o.testStatus || o.status)).length,
            });
        } catch (error) {
            console.error('Failed to fetch radiology orders', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);

        }
    };

    useEffect(() => { fetchOrders(); }, []);

    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Radiologist Dashboard</h1>
                    <p>Report and manage imaging results.</p>
                </div>

            </div>

            <div className="stats-grid mt-lg">
                <div className="stat-card" onClick={scrollToPending} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon orange"><FiClock /></div>
                    <div className="stat-info">
                        <h3>{stats.pending}</h3>
                        <p>Pending Reports</p>
                    </div>
                </div>
                <div className="stat-card" onClick={scrollToCompleted} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon green"><FiCheckCircle /></div>
                    <div className="stat-info">
                        <h3>{stats.completedToday}</h3>
                        <p>Completed Today</p>
                    </div>
                </div>
            </div>

            <div className="content-section mt-xl" ref={pendingRef}>
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiActivity /> Pending Radiology Requests</h2>
                    </div>
                    <div className="table-container mt-md">
                        {loading ? (
                            <div className="p-lg text-center">Loading...</div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Test Type</th>
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
                                                <td><span className={`status-pill ${(order.testStatus || order.status || '').toLowerCase()}`}>{order.testStatus || order.status}</span></td>
                                                <td>{new Date(order.createdAt).toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={4} className="text-center p-lg text-muted">No pending radiology requests.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <div className="content-section mt-xl" ref={completedRef}>
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiCheckCircle /> Completed Scans & Reports</h2>
                    </div>
                    <div className="table-container mt-md">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Scan Type</th>
                                    <th>Price</th>
                                    <th>Paid Status</th>
                                    <th>Invoice #</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.filter((o: any) => ['Completed', 'Published', 'Result Uploaded'].includes(o.testStatus || o.status)).length > 0 ? (
                                    orders.filter((o: any) => ['Completed', 'Published', 'Result Uploaded'].includes(o.testStatus || o.status)).map((order: any) => {
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
                                    <tr><td colSpan={5} className="text-center p-md text-muted">No completed scans.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RadiologyDashboard;
