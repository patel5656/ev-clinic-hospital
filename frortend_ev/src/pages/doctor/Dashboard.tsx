import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctor.service';
import { dashboardService } from '../../services/dashboard.service';
import { FiUsers, FiClock, FiFileText, FiDollarSign, FiPlus, FiEye, FiActivity, FiFolder, FiTrash2 } from 'react-icons/fi';
import Modal from '../../components/Modal';
import PatientProfileModal from '../../components/PatientProfileModal';
import './Dashboard.css';

const DoctorDashboard = () => {
    const { patients, refreshTrigger } = useApp() as any;
    const { user, selectedClinic } = useAuth() as any;
    const navigate = useNavigate();
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
    const [docStats, setDocStats] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [queue, setQueue] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Profile Modal State
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedPatientForProfile, setSelectedPatientForProfile] = useState<any>(null);

    // New Order Modal State
    const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
    const [orderType, setOrderType] = useState<string>('');
    const [inventory, setInventory] = useState<any[]>([]);
    const [prescriptionItems, setPrescriptionItems] = useState<any[]>([]);
    const [addItemInventoryId, setAddItemInventoryId] = useState<string>('');
    const [addItemQty, setAddItemQty] = useState<number>(1);
    const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);

    const openProfile = (patientId: number, patientName: string) => {
        setSelectedPatientForProfile({ id: patientId, name: patientName });
        setIsProfileOpen(true);
    };

    useEffect(() => {
        if (isNewOrderOpen && orderType === 'prescription') {
            doctorService.getPrescriptionInventory()
                .then((r: any) => {
                    const data = r?.data ?? r;
                    setInventory(Array.isArray(data) ? data : []);
                })
                .catch(() => setInventory([]));
        }
    }, [isNewOrderOpen, orderType]);

    const handleAddPrescriptionItem = () => {
        const id = Number(addItemInventoryId);
        if (!id || addItemQty < 1) return;
        const product = inventory.find((i: any) => i.id === id);
        if (!product) return;
        setPrescriptionItems(prev => [...prev, {
            inventoryId: product.id,
            medicineName: product.name,
            quantity: addItemQty,
            unitPrice: Number(product.unitPrice) || 0
        }]);
        setAddItemInventoryId('');
        setAddItemQty(1);
    };

    const removePrescriptionItem = (index: number) => {
        setPrescriptionItems(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, activitiesRes, queueRes] = await Promise.all([
                    dashboardService.getStats('DOCTOR'),
                    doctorService.getActivities(),
                    doctorService.getQueue()
                ]);
                setDocStats(statsRes?.data ?? statsRes ?? null);
                setActivities(activitiesRes?.data ?? activitiesRes ?? []);
                setQueue(queueRes?.data ?? queueRes ?? []);
            } catch (error) {
                console.error('Failed to fetch doctor dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [refreshTrigger]);

    // Enriched appointments for display
    const enrichedAppointments = queue.map((appointment: any) => {
        // The API now includes 'patient' in the response object
        const patientData = appointment.patient || {};
        return {
            ...appointment,
            patientName: patientData.name || 'Unknown Patient',
            patientId: patientData.id || appointment.patientId
        };
    });


    if (isLoading) {
        return <div className="doctor-dashboard-loading">Loading medical data...</div>;
    }

    const renderScheduleList = () => {
        if (!enrichedAppointments || enrichedAppointments.length === 0) {
            return (
                <div className="doctor-dashboard-empty-appointments">
                    <FiClock className="doctor-dashboard-empty-icon" />
                    <p className="doctor-dashboard-empty-text">No appointments scheduled for today</p>
                </div>
            );
        }

        return (
            <div className="doctor-dashboard-appointments-list">
                {enrichedAppointments.map((booking: any) => (
                    <div key={booking.id} className="doctor-dashboard-appointment-card">
                        <div className="doctor-dashboard-appointment-time">
                            <span className="doctor-dashboard-time-text">{booking.time}</span>
                            <span className={`doctor-dashboard-status-dot doctor-dashboard-status-dot--${booking.status.toLowerCase().replace(' ', '-')}`}></span>
                        </div>
                        <div className="doctor-dashboard-appointment-patient-info">
                            <h4 className="doctor-dashboard-patient-name">{booking.patientName || 'Unknown Patient'}</h4>
                            <p className="doctor-dashboard-appointment-details">{booking.notes || 'General Checkup'} • {booking.type || 'In-Person'}</p>
                        </div>
                        <div className="doctor-dashboard-appointment-status">
                            <span className={`doctor-dashboard-status-badge doctor-dashboard-status-badge--${booking.status.toLowerCase().replace(' ', '-')}`}>
                                {booking.status}
                            </span>
                        </div>
                        <div className="doctor-dashboard-appointment-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                                className="action-btn-minimal"
                                title="View Patient File"
                                onClick={() => openProfile(booking.patientId, booking.patientName)}
                                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b' }}
                            >
                                <FiFolder />
                            </button>
                            {['Approved', 'Confirmed', 'Checked In'].includes(booking.status) ? (
                                <button
                                    className="doctor-dashboard-btn-start-assessment"
                                    onClick={() => navigate('/doctor/assessments', { state: { patientId: booking.patientId, patientName: booking.patientName, notes: booking.notes, openNew: true } })}
                                >
                                    Start Consultation
                                </button>
                            ) : (
                                <span className="doctor-dashboard-waiting-text">Waiting</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="doctor-dashboard">
            <div className="doctor-dashboard-header">
                <h1 className="doctor-dashboard-title">Clinical Hub</h1>
                <p className="doctor-dashboard-welcome">Welcome back, <strong className="doctor-dashboard-doctor-name">{(user?.name || 'Doctor').startsWith('Dr.') ? (user?.name || 'Doctor') : `Dr. ${user?.name || 'Doctor'}`}</strong>. Here's your overview for today.</p>
            </div>

            {/* Premium Stat Cards - Tall Vertical Style */}
            <div className="doctor-dashboard-stats-grid">
                <div className="doctor-dashboard-stat-card" onClick={() => navigate('/doctor/assessments')} style={{ cursor: 'pointer' }}>
                    <div className="doctor-dashboard-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' }}>
                        <FiClock />
                    </div>
                    <p className="doctor-dashboard-stat-label">Today's Appointments</p>
                    <h3 className="doctor-dashboard-stat-value">{docStats?.todayPatients || 0}</h3>
                </div>
                <div className="doctor-dashboard-stat-card" onClick={() => navigate('/doctor/patients')} style={{ cursor: 'pointer' }}>
                    <div className="doctor-dashboard-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                        <FiUsers />
                    </div>
                    <p className="doctor-dashboard-stat-label">Total Patients Treated</p>
                    <h3 className="doctor-dashboard-stat-value">{docStats?.totalTreated || 0}</h3>
                </div>
                <div className="doctor-dashboard-stat-card" onClick={() => navigate('/doctor/assessments')} style={{ cursor: 'pointer' }}>
                    <div className="doctor-dashboard-stat-icon" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#D97706' }}>
                        <FiFileText />
                    </div>
                    <p className="doctor-dashboard-stat-label">Waitlist (Checked In)</p>
                    <h3 className="doctor-dashboard-stat-value">{docStats?.pendingAppointments || 0}</h3>
                </div>
                <div className="doctor-dashboard-stat-card" onClick={() => navigate('/doctor/assessments')} style={{ cursor: 'pointer' }}>
                    <div className="doctor-dashboard-stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
                        <FiActivity />
                    </div>
                    <p className="doctor-dashboard-stat-label">Completed Today</p>
                    <h3 className="doctor-dashboard-stat-value">{docStats?.completedAppointments || 0}</h3>
                </div>
            </div>

            {/* Quick Actions Container */}
            <div className="doctor-dashboard-quick-actions">
                <h3 className="doctor-dashboard-section-title">Quick Actions</h3>
                <div className="doctor-dashboard-quick-actions-grid">
                    <button className="doctor-dashboard-quick-action-btn" onClick={() => navigate('/doctor/assessments', { state: { openNew: true } })}>
                        <div className="doctor-dashboard-quick-action-icon"><FiPlus /></div>
                        <span className="doctor-dashboard-quick-action-label">Add Assessment</span>
                    </button>
                    <button className="doctor-dashboard-quick-action-btn" onClick={() => setIsNewOrderOpen(true)}>
                        <div className="doctor-dashboard-quick-action-icon"><FiFileText /></div>
                        <span className="doctor-dashboard-quick-action-label">Create Order</span>
                    </button>
                    <button className="doctor-dashboard-quick-action-btn" onClick={() => navigate('/doctor/patients')}>
                        <div className="doctor-dashboard-quick-action-icon"><FiEye /></div>
                        <span className="doctor-dashboard-quick-action-label">View Patients</span>
                    </button>
                    {selectedClinic?.modules?.billing && (
                        <button className="doctor-dashboard-quick-action-btn" onClick={() => navigate('/doctor/revenue')}>
                            <div className="doctor-dashboard-quick-action-icon"><FiDollarSign /></div>
                            <span className="doctor-dashboard-quick-action-label">View Earnings</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="doctor-dashboard-schedule-section">
                <div className="doctor-dashboard-schedule-header">
                    <h2 className="doctor-dashboard-schedule-title">Today's Schedule</h2>
                    <button className="doctor-dashboard-btn-view-all" onClick={() => navigate('/doctor/assessments')}>View All</button>
                </div>
                <div className="doctor-dashboard-schedule-list-container">
                    {renderScheduleList()}
                </div>
            </div>

            {/* Bottom Sections */}
            <div className="doctor-dashboard-bottom-grid">
                <div className="doctor-dashboard-bottom-card">
                    <div className="doctor-dashboard-bottom-card-header">
                        <h3 className="doctor-dashboard-bottom-card-title">Recent Activity</h3>
                    </div>
                    <div className="doctor-dashboard-activities-list">
                        {activities.length > 0 ? (
                            activities.map((activity) => (
                                <div key={activity.id} className="doctor-dashboard-activity-item">
                                    <span className="doctor-dashboard-activity-dot"></span>
                                    <div className="doctor-dashboard-activity-content">
                                        <p className="doctor-dashboard-activity-text">{activity.action}</p>
                                        <span className="doctor-dashboard-activity-time">{new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="doctor-dashboard-no-activities">No recent activity</div>
                        )}
                    </div>
                </div>

                <div className="doctor-dashboard-bottom-card">
                    <div className="doctor-dashboard-bottom-card-header">
                        <h3 className="doctor-dashboard-bottom-card-title">Clinic Context</h3>
                    </div>
                    <div className="doctor-dashboard-clinic-info">
                        <div className="doctor-dashboard-info-row">
                            <span className="doctor-dashboard-info-label">Facility</span>
                            <strong className="doctor-dashboard-info-value">{selectedClinic?.name || 'Main Clinic'}</strong>
                        </div>
                        <div className="doctor-dashboard-info-row">
                            <span className="doctor-dashboard-info-label">Total Clinic Patients</span>
                            <strong className="doctor-dashboard-info-value">{patients.length}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Consultation Modal Placeholder */}
            <Modal isOpen={isAssessmentModalOpen} onClose={() => setIsAssessmentModalOpen(false)} title="Patient Consultation">
                <div className="doctor-dashboard-modal-content">Consultation components here...</div>
            </Modal>

            {/* Patient Profile Modal */}
            {selectedPatientForProfile && (
                <PatientProfileModal
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    patientId={selectedPatientForProfile.id}
                    patientName={selectedPatientForProfile.name}
                />
            )}

            {/* New Order Modal */}
            <Modal
                isOpen={isNewOrderOpen}
                onClose={() => { setIsNewOrderOpen(false); setOrderType(''); setPrescriptionItems([]); }}
                title="Create New Order"
                size="lg"
            >
                <form className="order-form-modal" onSubmit={async (e: any) => {
                    e.preventDefault();
                    setIsOrderSubmitting(true);
                    try {
                        const form = e.target;
                        const isPrescription = (form.type.value || orderType || '').toLowerCase().includes('presc') || (form.type.value || orderType || '').toLowerCase().includes('pharm');
                        const data: any = {
                            patientId: form.patientId.value,
                            type: form.type.value,
                            priority: form.priority.value,
                            date: form.date.value,
                            notes: form.notes.value
                        };
                        if (isPrescription) {
                            if (prescriptionItems.length === 0) {
                                alert('Add at least one medicine to the prescription.');
                                setIsOrderSubmitting(false);
                                return;
                            }
                            data.items = prescriptionItems;
                        } else {
                            data.items = (form.querySelector('[name="items"]') as HTMLTextAreaElement)?.value || '';
                            if (!data.items.trim()) {
                                alert('Enter tests or items.');
                                setIsOrderSubmitting(false);
                                return;
                            }
                        }

                        await doctorService.createOrder(data);
                        alert('Order created successfully!');
                        setIsNewOrderOpen(false);
                        setOrderType('');
                        setPrescriptionItems([]);
                    } catch (err) {
                        console.error(err);
                        alert('Failed to create order');
                    } finally {
                        setIsOrderSubmitting(false);
                    }
                }}>
                    <div className="form-group">
                        <label>Select Patient *</label>
                        <select name="patientId" required>
                            <option value="">Choose patient...</option>
                            {(patients || []).map((patient: any) => (
                                <option key={patient.id} value={patient.id}>
                                    {patient.id.toString().padStart(3, '0')}-{patient.name}

                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Order Type *</label>
                        <select
                            name="type"
                            required
                            value={orderType}
                            onChange={(e) => setOrderType(e.target.value)}
                        >
                            <option value="">Select type...</option>
                            <option value="lab">Laboratory Test</option>
                            <option value="radiology">Radiology Scan</option>
                            <option value="prescription">Prescription</option>
                        </select>
                    </div>

                    {orderType === 'prescription' ? (
                        <div className="form-group">
                            <label>Medicines * (select from pharmacy inventory)</label>
                            <div className="prescription-add-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                                <select
                                    value={addItemInventoryId}
                                    onChange={(e) => setAddItemInventoryId(e.target.value)}
                                    className="form-control"
                                    style={{ flex: '1 1 200px', minWidth: '140px' }}
                                >
                                    <option value="">Select medicine...</option>
                                    {inventory.map((inv: any) => (
                                        <option key={inv.id} value={inv.id}>
                                            {inv.name} {inv.sku ? `(${inv.sku})` : ''} — AED {Number(inv.unitPrice || 0).toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    min={1}
                                    value={addItemQty}
                                    onChange={(e) => setAddItemQty(Number(e.target.value) || 1)}
                                    style={{ width: '80px', padding: '0.5rem' }}
                                />
                                <button type="button" className="btn btn-primary btn-sm btn-no-hover" onClick={handleAddPrescriptionItem} style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <FiPlus /> Add
                                </button>
                            </div>
                            {prescriptionItems.length > 0 && (
                                <ul className="prescription-items-list" style={{ listStyle: 'none', padding: 0, margin: 0, border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                    {prescriptionItems.map((item, idx) => (
                                        <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                            <span><strong>{item.medicineName}</strong> x{item.quantity} — AED {(item.unitPrice * item.quantity).toFixed(2)}</span>
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => removePrescriptionItem(idx)} style={{ padding: '0.25rem 0.5rem' }}>
                                                <FiTrash2 />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {orderType === 'prescription' && inventory.length === 0 && (
                                <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>Loading inventory… Add medicines in Pharmacy → Inventory if none appear.</p>
                            )}
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>Tests/Items *</label>
                            <textarea name="items" rows={3} placeholder="Enter tests or items (e.g., CBC, Blood Sugar)" required={orderType !== 'prescription'}></textarea>
                        </div>
                    )}

                    <div className="form-grid grid-2">
                        <div className="form-group">
                            <label>Priority</label>
                            <select name="priority">
                                <option value="routine">Routine</option>
                                <option value="urgent">Urgent</option>
                                <option value="stat">STAT</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Order Date</label>
                            <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Clinical Notes</label>
                        <textarea name="notes" rows={3} placeholder="Additional instructions or notes..."></textarea>
                    </div>


                    <div className="modal-actions-refined">
                        <button type="button" className="btn-cancel" onClick={() => setIsNewOrderOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-no-hover" disabled={isOrderSubmitting}>
                            {isOrderSubmitting ? 'Creating...' : (
                                <>
                                    <FiPlus />
                                    Create Order
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default DoctorDashboard;
