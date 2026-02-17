import { useState } from 'react';
import { FiPlus, FiTrash2, FiSearch, FiBriefcase } from 'react-icons/fi';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/Modal';
import './Departments.css';

const Departments = () => {
    const { departments, addDepartment, deleteDepartment } = useApp() as any;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newDept, setNewDept] = useState({ name: '', type: 'CLINICAL' });

    const filteredDepartments = departments.filter((d: any) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDepartment(newDept);
            setIsModalOpen(false);
            setNewDept({ name: '', type: 'CLINICAL' });
        } catch (error) {
            console.error('Failed to add department:', error);
            alert('Failed to add department. It might already exist.');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this department? This may affect staff associated with it.')) {
            try {
                await deleteDepartment(id);
            } catch (error) {
                console.error('Failed to delete department:', error);
                alert('Failed to delete department.');
            }
        }
    };

    return (
        <div className="departments-page">
            <div className="page-header">
                <div>
                    <h1>Clinical Departments</h1>
                    <p>Manage specialization areas and service modules in your clinic.</p>
                </div>
                <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={() => setIsModalOpen(true)}>
                    <FiPlus /> <span>Add Department</span>
                </button>
            </div>

            <div className="stats-row mt-lg">
                <div className="stat-card card">
                    <div className="stat-icon clinical"><FiBriefcase /></div>
                    <div className="stat-info">
                        <span className="stat-label">Total Departments</span>
                        <span className="stat-value">{departments.length}</span>
                    </div>
                </div>
            </div>

            <div className="table-container card mt-lg">
                <div className="table-header">
                    <div className="search-box">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Search departments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Department Name</th>
                            <th>Type</th>
                            <th>Created Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDepartments.map((dept: any) => (
                            <tr key={dept.id}>
                                <td><strong>{dept.name}</strong></td>
                                <td>
                                    <span className={`status-pill ${dept.type.toLowerCase()}`}>
                                        {dept.type}
                                    </span>
                                </td>
                                <td>{new Date(dept.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        className="btn-icon text-danger"
                                        title="Delete"
                                        onClick={() => handleDelete(dept.id)}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredDepartments.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-xl">
                                    <div className="empty-state-large">
                                        <FiBriefcase size={48} className="mb-md" style={{ color: '#cbd5e1' }} />
                                        <h3>No Departments Configured</h3>
                                        <p className="text-secondary">Departments allow you to categorize staff and medical records. Add your first department like "General Medicine" or "Radiology" to get started.</p>
                                        <button className="btn btn-primary mt-md btn-no-hover" onClick={() => setIsModalOpen(true)}>
                                            <FiPlus /> Add First Department
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Department">
                <form onSubmit={handleAdd} className="modal-form">
                    <div className="form-group">
                        <label>Department Name *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., Cardiology, Radiology, Pediatrics"
                            value={newDept.name}
                            onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Department Type</label>
                        <select
                            value={newDept.type}
                            onChange={(e) => setNewDept({ ...newDept, type: e.target.value })}
                        >
                            <option value="CLINICAL">Clinical</option>
                            <option value="SERVICE">Service (Lab/Rad/Pharm)</option>
                        </select>
                    </div>
                    <div className="modal-actions mt-xl">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-no-hover">
                            Create Department
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Departments;
