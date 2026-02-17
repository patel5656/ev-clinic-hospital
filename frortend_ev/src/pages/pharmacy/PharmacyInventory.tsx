import { useState, useEffect } from 'react';
import { FiGrid, FiPlus, FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { pharmacyService } from '../../services/pharmacy.service';
import { useToast } from '../../context/ToastContext';
import '../SharedDashboard.css';

const PharmacyInventory = () => {
    const toast = useToast();
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [addItemForm, setAddItemForm] = useState({ name: '', sku: '', quantity: '', unitPrice: '', expiryDate: '', currency: 'AED' });
    const [submitting, setSubmitting] = useState(false);
    const [viewItem, setViewItem] = useState<any | null>(null);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ name: '', sku: '', quantity: '', unitPrice: '', expiryDate: '' });
    const [deleteItem, setDeleteItem] = useState<any | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchInventory = async () => {
        try {
            const res: any = await pharmacyService.getInventory();
            const data = res?.data ?? res ?? [];
            setInventory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch inventory', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInventory(); }, []);

    const handleAddInventory = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                name: addItemForm.name.trim(),
                sku: addItemForm.sku?.trim() || undefined,
                quantity: Number(addItemForm.quantity) || 0,
                unitPrice: Number(addItemForm.unitPrice) || 0,
                expiryDate: addItemForm.expiryDate || undefined,
            };
            await pharmacyService.addInventory(payload);
            toast.success('Item added to inventory');
            setAddItemForm({ name: '', sku: '', quantity: '', unitPrice: '', expiryDate: '', currency: 'AED' });
            setAddModalOpen(false);
            await fetchInventory();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || 'Failed to add item');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (i: any) => {
        setEditItem(i);
        setEditForm({
            name: i.name || '',
            sku: i.sku || '',
            quantity: String(i.quantity ?? ''),
            unitPrice: String(i.unitPrice ?? ''),
            expiryDate: i.expiryDate ? new Date(i.expiryDate).toISOString().slice(0, 10) : '',
        });
    };

    const handleEditInventory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editItem?.id) return;
        setSubmitting(true);
        try {
            const payload = {
                name: editForm.name.trim(),
                sku: editForm.sku?.trim() || undefined,
                quantity: Number(editForm.quantity) || 0,
                unitPrice: Number(editForm.unitPrice) || 0,
                expiryDate: editForm.expiryDate || undefined,
            };
            await pharmacyService.updateInventory(editItem.id, payload);
            toast.success('Item updated');
            setEditItem(null);
            await fetchInventory();
        } catch (err: any) {
            toast.error(err?.message || 'Failed to update item');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteInventory = async () => {
        if (!deleteItem?.id) return;
        setDeleting(true);
        try {
            await pharmacyService.deleteInventory(deleteItem.id);
            toast.success('Item deleted');
            setDeleteItem(null);
            await fetchInventory();
        } catch (err: any) {
            toast.error(err?.message || 'Failed to delete item');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="dashboard-container fade-in">
            <div className="page-header">
                <div>
                    <h1>Inventory</h1>
                    <p>View and manage pharmacy stock.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary btn-sm btn-with-icon btn-no-hover" onClick={() => setAddModalOpen(true)}>
                        <FiPlus />
                        <span>Add</span>
                    </button>
                </div>
            </div>
            <div className="content-card">
                <div className="card-header">
                    <h2><FiGrid /> Inventory</h2>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>SKU</th>
                                <th>Quantity</th>
                                <th>Unit Price (AED)</th>
                                <th>Expiry</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center">Loading...</td></tr>
                            ) : inventory.length > 0 ? inventory.map((i: any) => (
                                <tr key={i.id}>
                                    <td>{i.name}</td>
                                    <td>{i.sku || '-'}</td>
                                    <td>{i.quantity}</td>
                                    <td>{i.unitPrice ?? '-'}</td>
                                    <td>{i.expiryDate ? new Date(i.expiryDate).toLocaleDateString() : '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <button type="button" className="btn btn-secondary btn-sm" title="View" onClick={() => setViewItem(i)}><FiEye /></button>
                                            <button type="button" className="btn btn-secondary btn-sm" title="Edit" onClick={() => openEditModal(i)}><FiEdit2 /></button>
                                            <button type="button" className="btn btn-danger btn-sm" title="Delete" onClick={() => setDeleteItem(i)}><FiTrash2 /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="text-center p-lg text-muted">No inventory. Click Add to add items.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {addModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div className="modal-header">
                            <h2>Add to Inventory</h2>
                            <button className="close-btn" onClick={() => setAddModalOpen(false)} type="button">&times;</button>
                        </div>
                        <form onSubmit={handleAddInventory} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                                <div className="form-group">
                                    <label>Item Name *</label>
                                    <input type="text" className="form-control" value={addItemForm.name} onChange={e => setAddItemForm(f => ({ ...f, name: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label>SKU</label>
                                    <input type="text" className="form-control" value={addItemForm.sku} onChange={e => setAddItemForm(f => ({ ...f, sku: e.target.value }))} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Quantity *</label>
                                        <input type="number" min={0} className="form-control" value={addItemForm.quantity} onChange={e => setAddItemForm(f => ({ ...f, quantity: e.target.value }))} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Unit Price *</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <select
                                                className="form-control"
                                                style={{ width: '85px', padding: '0.5rem' }}
                                                value={addItemForm.currency}
                                                onChange={e => setAddItemForm(f => ({ ...f, currency: e.target.value }))}
                                            >
                                                <option value="AED">AED</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                                <option value="INR">INR</option>
                                            </select>
                                            <input type="number" min={0} step={0.01} className="form-control" value={addItemForm.unitPrice} onChange={e => setAddItemForm(f => ({ ...f, unitPrice: e.target.value }))} required />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input type="date" className="form-control" value={addItemForm.expiryDate} onChange={e => setAddItemForm(f => ({ ...f, expiryDate: e.target.value }))} />
                                </div>
                            </div>
                            <div className="modal-actions" style={{ flexShrink: 0, padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', gap: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setAddModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-no-hover" disabled={submitting} title="Post/Save to inventory">
                                    {submitting ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewItem && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div className="modal-header">
                            <h2>View Item</h2>
                            <button className="close-btn" onClick={() => setViewItem(null)} type="button">&times;</button>
                        </div>
                        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                            <div className="form-group"><label>Name</label><p style={{ margin: 0 }}>{viewItem.name}</p></div>
                            <div className="form-group"><label>SKU</label><p style={{ margin: 0 }}>{viewItem.sku || '-'}</p></div>
                            <div className="form-group"><label>Quantity</label><p style={{ margin: 0 }}>{viewItem.quantity}</p></div>
                            <div className="form-group"><label>Unit Price (AED)</label><p style={{ margin: 0 }}>{viewItem.unitPrice ?? '-'}</p></div>
                            <div className="form-group"><label>Expiry</label><p style={{ margin: 0 }}>{viewItem.expiryDate ? new Date(viewItem.expiryDate).toLocaleDateString() : '-'}</p></div>
                        </div>
                        <div className="modal-actions" style={{ flexShrink: 0, padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setViewItem(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {editItem && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div className="modal-header">
                            <h2>Edit Item</h2>
                            <button className="close-btn" onClick={() => setEditItem(null)} type="button">&times;</button>
                        </div>
                        <form onSubmit={handleEditInventory} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                                <div className="form-group">
                                    <label>Item Name *</label>
                                    <input type="text" className="form-control" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label>SKU</label>
                                    <input type="text" className="form-control" value={editForm.sku} onChange={e => setEditForm(f => ({ ...f, sku: e.target.value }))} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Quantity *</label>
                                        <input type="number" min={0} className="form-control" value={editForm.quantity} onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Unit Price (AED) *</label>
                                        <input type="number" min={0} step={0.01} className="form-control" value={editForm.unitPrice} onChange={e => setEditForm(f => ({ ...f, unitPrice: e.target.value }))} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input type="date" className="form-control" value={editForm.expiryDate} onChange={e => setEditForm(f => ({ ...f, expiryDate: e.target.value }))} />
                                </div>
                            </div>
                            <div className="modal-actions" style={{ flexShrink: 0, padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', gap: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setEditItem(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-no-hover" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteItem && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Delete Item</h2>
                            <button className="close-btn" onClick={() => setDeleteItem(null)} type="button">&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete &quot;{deleteItem.name}&quot;? This cannot be undone.</p>
                        </div>
                        <div className="modal-actions" style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', gap: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setDeleteItem(null)}>Cancel</button>
                            <button type="button" className="btn btn-danger" onClick={handleDeleteInventory} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyInventory;
