import { useState, useEffect } from 'react';
import { FiActivity, FiUpload, FiCheckCircle } from 'react-icons/fi';
import { labService } from '../../services/lab.service';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import '../SharedDashboard.css';

/** Page 2: Lab Test Requests – pending only, with actions */
const LabRequests = () => {
    const toast = useToast();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [resultText, setResultText] = useState('');
    const [price, setPrice] = useState(50);
    const [isPaid, setIsPaid] = useState(false);

    const fetchOrders = async () => {
        try {

            const response: any = await labService.getOrders('LAB', 'Pending');
            let data = [];
            if (response?.status === 'success' && Array.isArray(response.data)) data = response.data;
            else if (Array.isArray(response)) data = response;
            else if (response?.data !== undefined) data = Array.isArray(response.data) ? response.data : [];
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch lab orders', error);
            toast.error('Failed to load lab requests');
        } finally {
            setLoading(false);

        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleOpenUpload = (order: any) => {
        setSelectedOrder(order);
        setResultText('');
        setPrice(50);
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

    const handleCollectSample = async (orderId: number) => {
        try {
            await labService.collectSample(orderId);
            toast.success('Sample marked as collected');
            fetchOrders();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const handleRejectOrder = async (orderId: number) => {
        if (!window.confirm('Reject this lab request?')) return;
        try {
            await labService.rejectOrder(orderId);
            toast.success('Order rejected');
            fetchOrders();
        } catch (error) {
            toast.error('Failed to reject');
        }
    };

    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Lab Test Requests</h1>
                    <p>View and manage pending lab requests.</p>
                </div>

            </div>

            <div className="content-section mt-xl">
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiActivity /> Pending Lab Requests</h2>
                    </div>
                    <div className="table-container mt-md">
                        {loading ? (
                            <div className="p-lg text-center">Loading...</div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Test Name</th>
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
                                            <td><span className={`status-pill ${(order.testStatus || order.status || '').toLowerCase().replace(' ', '-')}`}>{order.testStatus || order.status}</span></td>
                                            <td>{new Date(order.createdAt).toLocaleString()}</td>
                                            <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <button type="button" className="btn btn-upload-report btn-sm btn-with-icon" onClick={() => handleOpenUpload(order)}>
                                                    <FiUpload /> Upload Report
                                                </button>
                                                <button type="button" className="btn btn-secondary btn-sm btn-with-icon" onClick={() => handleCollectSample(order.id)}>
                                                    <FiCheckCircle /> Mark Collected
                                                </button>
                                                <button type="button" className="btn btn-secondary btn-sm" style={{ borderColor: '#fecaca', color: '#b91c1c' }} onClick={() => handleRejectOrder(order.id)}>
                                                    Reject
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className="text-center p-lg text-muted">No pending lab requests.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Lab Report">
                <form onSubmit={submitResult} className="modal-form">
                    <div className="form-group">
                        <label>Test Name</label>
                        <input type="text" value={selectedOrder?.testName || ''} disabled className="bg-gray-100" />
                    </div>
                    <div className="form-group">
                        <label>Result / Report Details</label>
                        <textarea rows={4} className="form-control" placeholder="Enter test results..." value={resultText} onChange={(e) => setResultText(e.target.value)} required />
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
                        <button type="submit" className="btn btn-primary btn-no-hover">Submit Result</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default LabRequests;
