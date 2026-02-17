import { useState, useEffect } from 'react';
import { FiPackage, FiCheck, FiInfo, FiClock, FiCheckCircle, FiRefreshCw, FiAlertTriangle, FiGrid } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { pharmacyService } from '../../services/pharmacy.service';
import { useToast } from '../../context/ToastContext';
import '../SharedDashboard.css';

const LOW_STOCK_THRESHOLD = 10;

interface PharmacyOrdersViewProps {
    title: string;
    subtitle: string;
}

const PharmacyOrdersView = ({ title, subtitle }: PharmacyOrdersViewProps) => {
    const navigate = useNavigate();
    const toast = useToast();
    const [stats, setStats] = useState({ prescriptionsToday: 0, dispensedToday: 0, lowStock: 0, totalItems: 0 });
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
    const [amount, setAmount] = useState<string>('');
    const [isPaid, setIsPaid] = useState(false);

    const fetchOrders = async (isBackground = false) => {
        try {
            if (!isBackground) setRefreshing(true);
            const [ordersRes, invRes] = await Promise.all([
                pharmacyService.getOrders(),
                pharmacyService.getInventory().catch(() => ({ data: [] }))
            ]);
            const response: any = ordersRes;
            let data: any[] = [];
            if (response?.status === 'success' && Array.isArray(response.data)) data = response.data;
            else if (Array.isArray(response)) data = response;
            else if (response?.data !== undefined) data = Array.isArray(response.data) ? response.data : [];
            setOrders(data);
            const completed = data.filter((o: any) => o.status === 'Completed').length;
            const invRaw = (invRes as any)?.data ?? (Array.isArray(invRes) ? invRes : []);
            const invList = Array.isArray(invRaw) ? invRaw : [];
            const lowStockCount = invList.filter((i: any) => Number(i.quantity || 0) <= LOW_STOCK_THRESHOLD).length;
            setStats({ prescriptionsToday: data.length, dispensedToday: completed, lowStock: lowStockCount, totalItems: invList.length });
        } catch (error) {
            console.error('Failed to fetch pharmacy orders', error);
        } finally {
            setLoading(false);
            if (!isBackground) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(() => fetchOrders(true), 10000);
        return () => clearInterval(interval);
    }, []);

    const handleOpenProcess = (order: any) => {
        setSelectedOrder(order);

        let calculatedAmount = 0;
        if (order.items && Array.isArray(order.items)) {
            calculatedAmount = order.items.reduce((acc: number, item: any) => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unitPrice || item.price || 0);
                return acc + (qty * price);
            }, 0);
        }

        setAmount(calculatedAmount > 0 ? calculatedAmount.toString() : '');
        setIsPaid(false);
        setIsProcessModalOpen(true);
    };

    const handleDispense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;
        try {
            const items = selectedOrder?.items || [];
            await pharmacyService.processOrder(selectedOrder.id, items, isPaid, Number(amount) || 0, selectedOrder.source);
            toast.success('Prescription processed successfully');
            setIsProcessModalOpen(false);
            fetchOrders();
        } catch (error) {
            console.error('Dispense failed', error);
            toast.error('Failed to process order');
        }
    };

    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => fetchOrders(false)} disabled={refreshing}>
                    <FiRefreshCw className={refreshing ? 'spin' : ''} />
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                </button>
            </div>

            <div className="stats-grid mt-lg">
                <div className="stat-card" onClick={() => navigate('/pharmacy/inventory')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon blue"><FiGrid /></div>
                    <div className="stat-info">
                        <h3>{stats.totalItems}</h3>
                        <p>Total Items (Inventory)</p>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/pharmacy/reports')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon blue"><FiClock /></div>
                    <div className="stat-info">
                        <h3>{stats.dispensedToday}</h3>
                        <p>Today Sales</p>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/pharmacy/prescriptions')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon green"><FiCheckCircle /></div>
                    <div className="stat-info">
                        <h3>{stats.prescriptionsToday}</h3>
                        <p>Prescriptions Today</p>
                    </div>
                </div>
                <div className="stat-card" onClick={() => navigate('/pharmacy/stock-alert')} style={{ cursor: 'pointer' }}>
                    <div className="stat-icon orange"><FiAlertTriangle /></div>
                    <div className="stat-info">
                        <h3>{stats.lowStock}</h3>
                        <p>Low Stock</p>
                    </div>
                </div>
            </div>

            <div className="content-section mt-xl">
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiPackage /> Pending Prescriptions</h2>
                    </div>
                    <div className="prescriptions-list mt-md">
                        {loading ? (
                            <div className="p-lg text-center">Loading prescriptions...</div>
                        ) : (
                            <>
                                {orders.filter(p => p.status === 'Pending').map(p => (
                                    <div key={p.id} className="list-item">
                                        <div className="item-main">
                                            <h3>{p.patientName || p.patient?.name || 'Unknown Patient'}</h3>
                                            <p className="item-sub" style={{ fontWeight: 500, color: '#1E293B' }}>
                                                {p.items?.length
                                                    ? p.items.map((i: any) => i.medicineName).join(', ')
                                                    : (p.testName
                                                        ? (p.result ? `${p.testName}: ${p.result}` : p.testName)
                                                        : 'Prescription Details Viewable in System')}
                                            </p>
                                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '0.25rem' }}>ID: #{p.id} - {new Date(p.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <button
                                            className="btn btn-primary btn-with-icon"
                                            style={{
                                                opacity: 1,
                                                visibility: 'visible',
                                                display: 'flex',
                                                background: '#2563EB',
                                                borderColor: '#2563EB',
                                                transform: 'none',
                                                transition: 'none',
                                                boxShadow: 'none'
                                            }}
                                            onClick={() => handleOpenProcess(p)}
                                        >
                                            <FiCheck /> <span>Process Order</span>
                                        </button>
                                    </div>
                                ))}
                                {orders.filter(p => p.status === 'Pending').length === 0 && (
                                    <div className="empty-state text-center p-xl">
                                        <FiInfo size={48} className="text-secondary mb-md" />
                                        <h3>All Prescriptions Dispensed</h3>
                                        <p>No pending orders at the moment.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="content-section mt-xl">
                <div className="content-card">
                    <div className="card-header">
                        <h2><FiCheckCircle /> Completed Orders</h2>
                    </div>
                    <div className="prescriptions-list mt-md">
                        {orders.filter(p => p.status === 'Completed').length > 0 ? (
                            orders.filter(p => p.status === 'Completed').map(p => {
                                let details: any = { amount: 0, invoiceId: 'N/A' };
                                try {
                                    if (p.result?.startsWith('{')) details = JSON.parse(p.result);
                                } catch (e) { }
                                return (
                                    <div key={p.id} className="list-item" style={{ opacity: 0.8 }}>
                                        <div className="item-main">
                                            <h3>{p.patientName || p.patient?.name || 'Unknown Patient'}</h3>
                                            <p className="item-sub">
                                                {p.items?.length ? p.items.map((i: any) => i.medicineName).join(', ') : (details.items ? (Array.isArray(details.items) ? details.items.join(', ') : 'Details Saved') : 'Prescription Fulfilled')}
                                            </p>
                                            <span style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'block', marginTop: '0.25rem' }}>
                                                Inv: #{details.invoiceId || 'N/A'} - AED {details.amount || '0'}
                                            </span>
                                        </div>
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedOrder(p); setTimeout(() => window.print(), 100); }}>
                                            <FiPackage /> <span>Print Invoice</span>
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center p-md text-muted">No completed orders today.</p>
                        )}
                    </div>
                </div>
            </div>

            {isProcessModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h2>Process Prescription</h2>
                            <button className="close-btn" onClick={() => setIsProcessModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleDispense}>
                            <div className="modal-body">
                                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#EFF6FF', borderRadius: '12px', border: '1px solid #DBEAFE' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)' }}>
                                        <FiPackage size={24} />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dispensing For</p>
                                        <h3 style={{ margin: 0, color: '#1E3A8A', fontSize: '1.1rem', fontWeight: 700 }}>{selectedOrder?.patientName || selectedOrder?.patient?.name}</h3>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Total Amount (AED)</label>
                                    <input type="number" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required style={{ fontSize: '1.5rem', fontWeight: 700, padding: '1rem' }} />
                                </div>

                                {selectedOrder?.items && selectedOrder.items.length > 0 && (
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Prescribed Medicines</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {selectedOrder.items.map((item: any, idx: number) => {
                                                const unitPrice = Number(item.unitPrice || item.price || 0);
                                                const qty = Number(item.quantity) || 0;
                                                return (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                                        <div>
                                                            <p style={{ margin: 0, fontWeight: 600, color: '#1E293B' }}>{item.medicineName || item.testName}</p>
                                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>{qty} {item.unit || 'Piece'} &times; AED {unitPrice.toFixed(2)}</p>
                                                        </div>
                                                        <div style={{ fontWeight: 700, color: '#2563EB' }}>
                                                            AED {(qty * unitPrice).toFixed(2)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="form-group mt-md">
                                    <label className="checkbox-wrapper">
                                        <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
                                        <span>Payment Received (Mark as Paid)</span>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsProcessModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#2563EB', borderColor: '#2563EB', opacity: 1 }}>Dispense & Create Invoice</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div id="print-container" style={{ display: 'none' }}>
                <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid #E2E8F0', paddingBottom: '20px' }}>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E293B', margin: 0 }}>INVOICE</h1>
                            <p style={{ color: '#64748B', marginTop: '5px' }}>Pharmacy Department</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Exclusive Vision Clinic</h2>
                            <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>Healthcare City, Dubai</p>
                        </div>
                    </div>
                    {selectedOrder && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
                                <div>
                                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em', marginBottom: '10px' }}>Bill To</h3>
                                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', margin: 0 }}>{selectedOrder.patientName || selectedOrder.patient?.name}</p>
                                    <p style={{ color: '#64748B', marginTop: '5px' }}>Date: {new Date().toLocaleDateString()}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em', marginBottom: '10px' }}>Invoice Details</h3>
                                    <p style={{ color: '#1E293B', fontWeight: '600' }}>Order #{selectedOrder.id}</p>
                                </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', color: '#475569', textAlign: 'left' }}>
                                        <th style={{ padding: '12px 16px', borderRadius: '8px 0 0 8px' }}>Description</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                        <td style={{ padding: '16px', color: '#1E293B' }}>
                                            {selectedOrder.result?.startsWith('{') ? (() => {
                                                try {
                                                    const res = JSON.parse(selectedOrder.result);
                                                    return Array.isArray(res.items) ? res.items.join(', ') : res.service || 'Pharmacy Services';
                                                } catch { return 'Pharmacy Services'; }
                                            })() : selectedOrder.items?.length ? selectedOrder.items.map((i: any) => i.medicineName).join(', ') : selectedOrder.testName || 'Pharmacy Services'}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#1E293B' }}>
                                            {selectedOrder.result && (() => { try { const r = JSON.parse(selectedOrder.result); return r.amount; } catch { return null; } })() ? `AED ${JSON.parse(selectedOrder.result).amount}` : 'Pending'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #E2E8F0', paddingTop: '20px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '5px' }}>Total Amount</p>
                                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563EB' }}>
                                        {selectedOrder.result && (() => { try { const r = JSON.parse(selectedOrder.result); return r.amount; } catch { return null; } })() ? `AED ${JSON.parse(selectedOrder.result).amount}` : '0.00'}
                                    </p>
                                </div>
                            </div>
                            <div style={{ marginTop: '60px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                                <p>Thank you for choosing Exclusive Vision Clinic.</p>
                                <p>This is a computer-generated invoice.</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PharmacyOrdersView;
