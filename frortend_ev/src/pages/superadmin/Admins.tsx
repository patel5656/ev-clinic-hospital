import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { superService } from '../../services/super.service';
import { FiPlus, FiSearch, FiUser, FiCheck, FiLock, FiEye, FiEdit, FiTrash2, FiPower, FiLogIn } from 'react-icons/fi';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import './Admins.css';

const ClinicAdmins = () => {
    const { impersonate } = useAuth() as any;
    const { clinics, staff, addStaff, updateStaff, toggleStaffStatus, deleteStaff } = useApp() as any;
    const toast = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [confirmAction, setConfirmAction] = useState<any>(null);

    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', clinicId: '', role: 'ADMIN', password: '' });

    const allStaff = (staff as any[]);
    // Filter to show ONLY 'ADMIN' role by default, resolving user confusion about "too much data"
    const filteredAdmins = allStaff.filter(a =>
        a.role === 'ADMIN' && (
            (a.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (a.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        )
    );

    const handleCreateAdmin = async (e: any) => {
        e.preventDefault();
        try {
            if (isEditMode && selectedAdmin) {
                await updateStaff(selectedAdmin.id, {
                    name: newAdmin.name,
                    email: newAdmin.email,
                    password: newAdmin.password === '••••••••' ? undefined : newAdmin.password,
                    clinicId: parseInt(newAdmin.clinicId),
                    role: newAdmin.role
                });
            } else {
                await addStaff({
                    name: newAdmin.name,
                    email: newAdmin.email,
                    password: newAdmin.password,
                    clinicId: parseInt(newAdmin.clinicId),
                    role: newAdmin.role
                });
            }
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setIsModalOpen(false);
                setIsEditMode(false);
                setSelectedAdmin(null);
                setNewAdmin({ name: '', email: '', clinicId: '', role: 'ADMIN', password: '' });
            }, 2000);
        } catch (error) {
            console.error('Failed to save staff:', error);
            toast.error('Failed to save staff details');
        }
    };

    const handleEdit = (admin: any) => {
        setSelectedAdmin(admin);
        setNewAdmin({
            name: admin.name,
            email: admin.email,
            clinicId: admin.clinics?.[0]?.toString() || '',
            role: admin.role,
            password: '••••••••'
        });
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setSelectedAdmin(null);
        setNewAdmin({ name: '', email: '', clinicId: '', role: 'ADMIN', password: '' });
        setIsModalOpen(true);
    };

    const handleToggleStatus = (admin: any) => {
        setConfirmAction({
            type: 'toggle',
            admin,
            title: `${admin.status === 'active' ? 'Deactivate' : 'Activate'} Administrator?`,
            message: `Are you sure you want to ${admin.status === 'active' ? 'deactivate' : 'activate'} "${admin.name}"? ${admin.status === 'active' ? 'They will not be able to log in.' : 'They will regain access.'}`,
            variant: admin.status === 'active' ? 'danger' : 'info'
        });
    };

    const handleDelete = (admin: any) => {
        setConfirmAction({
            type: 'delete',
            admin,
            title: 'Delete Administrator?',
            message: `Are you sure you want to permanently delete "${admin.name}"? This action cannot be undone and their account will be removed.`,
            variant: 'danger'
        });
    };

    const handleConfirm = async () => {
        try {
            if (confirmAction?.type === 'toggle') {
                await toggleStaffStatus(confirmAction.admin.id);
            } else if (confirmAction?.type === 'delete') {
                await deleteStaff(confirmAction.admin.id);
            }
            setConfirmAction(null);
        } catch (error) {
            console.error('Action failed:', error);
            toast.error('Operation failed. Please try again.');
        }
    };

    const handleLoginAsAdmin = async (admin: any) => {
        try {
            // Must use userId, not staff id (admin.id)
            const success = await impersonate(admin.userId);
            if (success) {
                // Redirection is now handled centrally in AuthContext's impersonate function
                return;
            } else {
                toast.error('Impersonation failed. Please check permissions.');
            }
        } catch (error) {
            console.error('Login as admin failed:', error);
            toast.error('An error occurred during impersonation.');
        }
    };

    const handleResetPasswordPrompt = async (admin: any) => {
        const newPassword = prompt(`Enter new password for ${admin.name}:`);
        if (!newPassword || newPassword.length < 6) {
            if (newPassword) alert('Password must be at least 6 characters');
            return;
        }

        try {
            // Must use userId, not staff id (admin.id)
            await superService.resetUserPassword(admin.userId, newPassword);
            toast.success('Password reset successfully!');
        } catch (error) {
            console.error('Reset failed:', error);
            toast.error('Failed to reset password.');
        }
    };

    return (
        <div className="admins-page">
            <div className="page-header">
                <div>
                    <h1>Platform Administrators</h1>
                    <p>Manage and assign administrators to clinical facilities.</p>
                </div>
                <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={openCreateModal}>
                    <FiPlus />
                    <span>Create New Admin</span>
                </button>
            </div>

            <div className="table-controls card">
                <div className="search-box">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search administrators..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container card table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Work Email</th>
                            <th>Assigned Clinic</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAdmins.map((admin: any) => (
                            <tr key={admin.id}>
                                <td>
                                    <div className="admin-cell">
                                        <div className="admin-avatar"><FiUser /></div>
                                        <span className="clickable" onClick={() => { setSelectedAdmin(admin); setIsViewModalOpen(true); }}>
                                            {admin.name}
                                        </span>
                                    </div>
                                </td>
                                <td><span className="role-badge">{admin.role}</span></td>
                                <td>{admin.email}</td>
                                <td>
                                    {(admin.clinics as any[] || []).map(cid => {
                                        const clinic = (clinics as any[]).find(c => c.id === cid);
                                        return <span key={cid} className="clinic-mini-badge">{clinic?.name}</span>;
                                    })}
                                </td>
                                <td>
                                    <span className={`status-pill ${admin.status || 'active'}`}>
                                        {admin.status || 'active'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-btns">
                                        {/* Reset Password Button */}
                                        <button className="btn-icon" onClick={() => handleResetPasswordPrompt(admin)} title="Reset Password">
                                            <FiLock />
                                        </button>
                                        <button className="btn-icon" onClick={() => { setSelectedAdmin(admin); setIsViewModalOpen(true); }} title="View Details">
                                            <FiEye />
                                        </button>
                                        <button className="btn-icon login" onClick={() => handleLoginAsAdmin(admin)} title="Login as This Admin">
                                            <FiLogIn />
                                        </button>
                                        <button className="btn-icon" onClick={() => handleEdit(admin)} title="Edit">
                                            <FiEdit />
                                        </button>
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleToggleStatus(admin)}
                                            title={admin.status === 'active' ? 'Deactivate' : 'Activate'}
                                        >
                                            <FiPower />
                                        </button>
                                        <button className="btn-icon delete" onClick={() => handleDelete(admin)} title="Delete">
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit Clinic Staff" : "Create Clinic Staff"}>
                {isSuccess ? (
                    <div className="success-message text-center p-lg">
                        <FiCheck size={48} color="#10B981" />
                        <h3>Staff {isEditMode ? 'Updated' : 'Created'}!</h3>
                        <p>User account has been {isEditMode ? 'updated' : 'provisioned and assigned'}.</p>
                    </div>
                ) : (
                    <form className="modal-form" onSubmit={handleCreateAdmin}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" required value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input type="email" required value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <select required value={newAdmin.role} onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}>
                                <option value="ADMIN">Administrator</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Assign Primary Clinic</label>
                            <select required value={newAdmin.clinicId} onChange={e => setNewAdmin({ ...newAdmin, clinicId: e.target.value })}>
                                <option value="">Select Clinic...</option>
                                {(clinics as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        {!isEditMode && (
                            <div className="form-group">
                                <label>Temporary Password</label>
                                <div className="input-with-icon">
                                    <FiLock className="input-icon" />
                                    <input type="password" required value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
                                </div>
                            </div>
                        )}
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary btn-no-hover">{isEditMode ? 'Update' : 'Create'} Account</button>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Staff Details">
                {selectedAdmin && (
                    <div className="admin-details">
                        <div className="details-header">
                            <div className="admin-avatar-lg"><FiUser /></div>
                            <div>
                                <h2>{selectedAdmin.name}</h2>
                                <p className="text-secondary">{selectedAdmin.email}</p>
                            </div>
                        </div>
                        <div className="details-grid mt-lg">
                            <div className="detail-item">
                                <label>Assigned Clinics</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                                    {(selectedAdmin.clinics as any[] || []).map(cid => {
                                        const clinic = (clinics as any[]).find(c => c.id === cid);
                                        return <span key={cid} className="clinic-mini-badge">{clinic?.name}</span>;
                                    })}
                                </div>
                            </div>
                            <div className="detail-item">
                                <label>Status</label>
                                <p><span className={`status-pill ${selectedAdmin.status || 'active'}`}>{selectedAdmin.status || 'active'}</span></p>
                            </div>
                            <div className="detail-item">
                                <label>Joined Date</label>
                                <p>{selectedAdmin.joined || 'N/A'}</p>
                            </div>
                            <div className="detail-item">
                                <label>Role</label>
                                <p>{selectedAdmin.role}</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirm}
                title={confirmAction?.title || ''}
                message={confirmAction?.message || ''}
                variant={confirmAction?.variant || 'warning'}
                confirmText={confirmAction?.type === 'delete' ? 'Delete' : 'Confirm'}
            />
        </div>
    );
};

export default ClinicAdmins;
