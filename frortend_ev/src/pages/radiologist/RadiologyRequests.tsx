import { useState, useEffect } from 'react';
import { FiActivity, FiUpload, FiRefreshCw } from 'react-icons/fi';
import { labService } from '../../services/lab.service';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import '../SharedDashboard.css';

/** Page 2: Scan Requests – pending only, with Upload Report / Reject */
const RadiologyRequests = () => {
    const toast = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [resultText, setResultText] = useState('');
    const [price, setPrice] = useState(150);
    const [isPaid, setIsPaid] = useState(false);

    const fetchOrders = async () => {
        try {
            setRefreshing(true);
            const response: any = await labService.getOrders('RADIOLOGY', 'Pending');
            let data = [];
            if (response?.status === 'success' && Array.isArray(response.data)) data = response.data;
            else if (Array.isArray(response)) data = response;
            else if (response?.data !== undefined) data = Array.isArray(response.data) ? response.data : [];
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch radiology orders', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleOpenUpload = (order: any) => {
        setSelectedOrder(order);
        setResultText('');
        setPrice(150);
        setIsPaid(false);
        setIsUploadModalOpen(true);
    };

    const submitResult = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;
        try {
            await labService.completeOrder(selectedOrder.id, resultText, price, isPaid);
            toast.success('Report uploaded successfully');
            setIsUploadModalOpen(false);
            fetchOrders();
        } catch (error) {
            toast.error('Failed to submit report');
        }
    };

    const handleRejectOrder = async (orderId: number) => {
        if (!window.confirm('Reject this radiology request?')) return;
        try {
            await labService.rejectOrder(orderId);
            toast.success('Request rejected');
            fetchOrders();
        } catch (error) {
            toast.error('Failed to reject');
        }
    };

    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Scan Requests</h1>
                    <p>View and manage pending radiology scan requests.</p>
                </div>
                <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchOrders} disabled={refreshing}>
                    <FiRefreshCw className={refreshing ? 'spin' : ''} />
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
            </div>

            <div className="content-section mt-xl">
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
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length > 0 ? orders.map((order: any) => (
                                        <tr key={order.id}>
                                            <td>{order.patient?.name || 'Unknown'}</td>
                                            <td><strong>{order.testName}</strong></td>
                                            <td><span className={`status-pill ${(order.testStatus || order.status || '').toLowerCase()}`}>{order.testStatus || order.status}</span></td>
                                            <td>{new Date(order.createdAt).toLocaleString()}</td>
                                            <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <button type="button" className="btn btn-upload-report btn-sm btn-with-icon" onClick={() => handleOpenUpload(order)}>
                                                    <FiUpload /> Upload Report
                                                </button>
                                                <button type="button" className="btn btn-secondary btn-sm" style={{ borderColor: '#fecaca', color: '#b91c1c' }} onClick={() => handleRejectOrder(order.id)}>
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="text-center p-lg text-muted">No pending radiology requests.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Radiology Report">
                <form onSubmit={submitResult} className="modal-form">
                    <div className="form-group">
                        <label>Test Type</label>
                        <input type="text" value={selectedOrder?.testName || ''} disabled className="bg-gray-100" />
                    </div>
                    <div className="form-group">
                        <label>Findings / Report URL</label>
                        <textarea rows={4} className="form-control" placeholder="Enter detailed findings from the scan..." value={resultText} onChange={(e) => setResultText(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Cost (AED)</label>
                        <input type="number" className="form-control" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                    </div>
                    <div className="form-group mt-md">
                        <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
                            <span>Payment Received (Mark as Paid)</span>
                        </label>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary btn-no-hover">Submit Report</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RadiologyRequests;
