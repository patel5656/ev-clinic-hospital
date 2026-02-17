import { useState, useEffect } from 'react';
import { FiShoppingCart, FiPlus, FiTrash2, FiRefreshCw, FiEye, FiEdit2, FiList } from 'react-icons/fi';
import { pharmacyService } from '../../services/pharmacy.service';
import { receptionService } from '../../services/reception.service';
import { useToast } from '../../context/ToastContext';
import '../SharedDashboard.css';
import './PharmacyMedicineSale.css';

interface LineItem {
    inventoryId: number;
    name: string;
    unitPrice: number;
    quantity: number;
}

const PharmacyMedicineSale = () => {
    const toast = useToast();
    const [patients, setPatients] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [patientId, setPatientId] = useState<string>('');
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [paid, setPaid] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [sales, setSales] = useState<any[]>([]);
    const [loadingSales, setLoadingSales] = useState(false);
    const [viewSale, setViewSale] = useState<any | null>(null);
    const [editSale, setEditSale] = useState<any | null>(null);
    const [editStatus, setEditStatus] = useState<string>('');
    const [deleteSale, setDeleteSale] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [patientsRes, invRes] = await Promise.all([
                receptionService.getPatients().catch(() => ({ data: [] })),
                pharmacyService.getInventory().catch(() => ({ data: [] }))
            ]);
            const pData = (patientsRes as any)?.data ?? (Array.isArray(patientsRes) ? patientsRes : []);
            const iData = (invRes as any)?.data ?? (Array.isArray(invRes) ? invRes : []);
            setPatients(Array.isArray(pData) ? pData : []);
            setInventory(Array.isArray(iData) ? iData : []);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load patients or inventory');
        } finally {
            setLoading(false);
        }
    };

    const fetchSales = async () => {
        try {
            setLoadingSales(true);
            const res: any = await pharmacyService.getPosSales();
            const data = res?.data ?? res ?? [];
            setSales(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load sales');
        } finally {
            setLoadingSales(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { fetchSales(); }, []);

    const addLine = () => {
        if (inventory.length === 0) {
            toast.error('No inventory items available');
            return;
        }
        const first = inventory[0];
        setLineItems(prev => [...prev, {
            inventoryId: first.id,
            name: first.name,
            unitPrice: Number(first.unitPrice) || 0,
            quantity: 1
        }]);
    };

    const updateLine = (index: number, field: keyof LineItem, value: number | string) => {
        setLineItems(prev => {
            const next = [...prev];
            if (field === 'inventoryId') {
                const item = inventory.find(i => i.id === Number(value));
                if (item) {
                    next[index] = { ...next[index], inventoryId: item.id, name: item.name, unitPrice: Number(item.unitPrice) || 0, quantity: next[index].quantity };
                }
            } else if (field === 'quantity') {
                next[index] = { ...next[index], quantity: Number(value) || 0 };
            }
            return next;
        });
    };

    const removeLine = (index: number) => {
        setLineItems(prev => prev.filter((_, i) => i !== index));
    };

    const totalAmount = lineItems.reduce((sum, row) => sum + row.unitPrice * row.quantity, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId) {
            toast.error('Please select a patient');
            return;
        }
        if (lineItems.length === 0 || lineItems.every(l => l.quantity <= 0)) {
            toast.error('Add at least one item with quantity');
            return;
        }
        setSubmitting(true);
        try {
            await pharmacyService.directSale({
                patientId: Number(patientId),
                items: lineItems.filter(l => l.quantity > 0).map(l => ({
                    inventoryId: l.inventoryId,
                    quantity: l.quantity,
                    price: l.unitPrice
                })),
                paid
            });
            toast.success('Sale completed');
            setPatientId('');
            setLineItems([]);
            setPaid(false);
            fetchSales();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Sale failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editSale?.id) return;
        setSubmitting(true);
        try {
            await pharmacyService.updatePosSale(editSale.id, { status: editStatus });
            toast.success('Sale updated');
            setEditSale(null);
            fetchSales();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Update failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteSale?.id) return;
        setDeleting(true);
        try {
            await pharmacyService.deletePosSale(deleteSale.id);
            toast.success('Sale deleted');
            setDeleteSale(null);
            fetchSales();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Medicine Sale</h1>
                    <p>Direct sale (POS) — sell medicines over the counter without a prescription.</p>
                </div>
                <button className="btn btn-secondary btn-sm btn-with-icon" onClick={fetchData} disabled={loading}>
                    <FiRefreshCw className={loading ? 'spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            <div className="content-card pharmacy-medicine-sale-form" style={{ maxWidth: '720px', width: '100%' }}>
                <div className="card-header">
                    <h2><FiShoppingCart /> New Sale</h2>
                </div>
                <form onSubmit={handleSubmit} className="pharmacy-medicine-sale-form-body">
                    <div className="form-group">
                        <label>Patient *</label>
                        <select
                            className="form-control"
                            value={patientId}
                            onChange={e => setPatientId(e.target.value)}
                            required
                        >
                            <option value="">Select patient</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name} {p.email ? `(${p.email})` : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div className="medicine-sale-items-row">
                        <label className="medicine-sale-items-label">Items</label>
                        <button type="button" className="btn btn-primary btn-sm btn-with-icon medicine-sale-add-btn" onClick={addLine} style={{ width: 'auto', minWidth: 'unset' }}>
                            <FiPlus /> <span>Add item</span>
                        </button>
                    </div>

                    {lineItems.length > 0 && (
                        <div className="table-responsive medicine-sale-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Unit Price (AED)</th>
                                        <th>Qty</th>
                                        <th>Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <select
                                                    className="form-control"
                                                    value={row.inventoryId}
                                                    onChange={e => updateLine(idx, 'inventoryId', e.target.value)}
                                                >
                                                    {inventory.map(i => (
                                                        <option key={i.id} value={i.id}>{i.name} {i.sku ? `(${i.sku})` : ''}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>{row.unitPrice.toFixed(2)}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    className="form-control medicine-sale-qty-input"
                                                    value={row.quantity}
                                                    onChange={e => updateLine(idx, 'quantity', e.target.value)}
                                                />
                                            </td>
                                            <td>{(row.unitPrice * row.quantity).toFixed(2)}</td>
                                            <td>
                                                <button type="button" className="btn btn-secondary btn-sm medicine-sale-remove-btn" onClick={() => removeLine(idx)} title="Remove">
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {lineItems.length === 0 && (
                        <p className="text-muted medicine-sale-empty-hint">Click &quot;Add item&quot; to add medicines from inventory.</p>
                    )}

                    <div className="medicine-sale-paid-row">
                        <label className="checkbox-wrapper">
                            <input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} />
                            <span>Payment received (Mark as Paid)</span>
                        </label>
                    </div>

                    <div className="medicine-sale-total">
                        Total: AED {totalAmount.toFixed(2)}
                    </div>

                    <div className="medicine-sale-actions">
                        <button type="submit" className="btn btn-primary btn-sm medicine-sale-submit-btn" disabled={submitting || lineItems.length === 0} style={{ width: 'auto' }}>
                            {submitting ? 'Processing...' : 'Complete Sale'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="content-card mt-xl" style={{ width: '100%' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h2><FiList /> Posted Sales</h2>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={fetchSales} disabled={loadingSales}>
                        <FiRefreshCw className={loadingSales ? 'spin' : ''} /> Refresh
                    </button>
                </div>
                <div className="table-responsive" style={{ padding: '1rem 1.5rem' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Patient</th>
                                <th>Items</th>
                                <th>Amount (AED)</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingSales ? (
                                <tr><td colSpan={7} className="text-center">Loading...</td></tr>
                            ) : sales.length === 0 ? (
                                <tr><td colSpan={7} className="text-center p-lg text-muted">No posted sales yet. Complete a sale above to see it here.</td></tr>
                            ) : sales.map((s: any) => (
                                <tr key={s.id}>
                                    <td>{s.id}</td>
                                    <td>{s.patient?.name || '—'}</td>
                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.service}>{s.service || '—'}</td>
                                    <td>{Number(s.amount)?.toFixed(2) ?? '—'}</td>
                                    <td><span className={s.status === 'Paid' ? 'text-success' : 'text-warning'}>{s.status || '—'}</span></td>
                                    <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: '0.35rem', flexWrap: 'nowrap' }}>
                                            <button type="button" className="btn btn-secondary btn-sm" title="View" onClick={() => setViewSale(s)}><FiEye /></button>
                                            <button type="button" className="btn btn-secondary btn-sm" title="Edit" onClick={() => { setEditSale(s); setEditStatus(s.status || 'Pending'); }}><FiEdit2 /></button>
                                            <button type="button" className="btn btn-danger btn-sm" title="Delete" onClick={() => setDeleteSale(s)}><FiTrash2 /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {viewSale && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '480px' }}>
                        <div className="modal-header">
                            <h2>View Sale</h2>
                            <button className="close-btn" onClick={() => setViewSale(null)} type="button">&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group"><label>Sale ID</label><p style={{ margin: 0 }}>{viewSale.id}</p></div>
                            <div className="form-group"><label>Patient</label><p style={{ margin: 0 }}>{viewSale.patient?.name || '—'}</p></div>
                            <div className="form-group"><label>Items</label><p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{viewSale.service || '—'}</p></div>
                            <div className="form-group"><label>Amount (AED)</label><p style={{ margin: 0 }}>{Number(viewSale.amount)?.toFixed(2) ?? '—'}</p></div>
                            <div className="form-group"><label>Status</label><p style={{ margin: 0 }}>{viewSale.status || '—'}</p></div>
                            <div className="form-group"><label>Date</label><p style={{ margin: 0 }}>{viewSale.createdAt ? new Date(viewSale.createdAt).toLocaleString() : '—'}</p></div>
                        </div>
                        <div className="modal-actions" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setViewSale(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {editSale && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Edit Sale</h2>
                            <button className="close-btn" onClick={() => setEditSale(null)} type="button">&times;</button>
                        </div>
                        <form onSubmit={handleEditSave}>
                            <div className="modal-body">
                                <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#64748B' }}>Sale ID: {editSale.id}</p>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select className="form-control" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', gap: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setEditSale(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteSale && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Delete Sale</h2>
                            <button className="close-btn" onClick={() => setDeleteSale(null)} type="button">&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete sale <strong>{deleteSale.id}</strong>? This cannot be undone.</p>
                        </div>
                        <div className="modal-actions" style={{ padding: '1rem 1.5rem', borderTop: '1px solid #E2E8F0', gap: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setDeleteSale(null)}>Cancel</button>
                            <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyMedicineSale;
