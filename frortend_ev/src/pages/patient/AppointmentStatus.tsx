
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patient.service';
import { FiCalendar, FiClock, FiUser, FiActivity } from 'react-icons/fi';
import './PatientBooking.css';

const AppointmentStatus = () => {
    const { user } = useAuth() as any;
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await patientService.getMyAppointments();
                // Ensure data is sorted by date descending here as well just in case
                setBookings(res.data || []);
            } catch (error) {
                console.error('Failed to fetch bookings', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchBookings();
        }
    }, [user]);

    const getStatusClass = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'status-approved';
            case 'pending approval':
            case 'pending': return 'status-pending';
            case 'cancelled':
            case 'rejected': return 'status-rejected';
            case 'rescheduled': return 'status-rescheduled';
            default: return 'status-default';
        }
    };

    if (loading) {
        return <div className="p-20 text-center">Loading status...</div>;
    }

    return (
        <div className="appointment-status-page fade-in">
            <div className="page-header">
                <h1>My Appointments</h1>
                <p>Track the status of your appointment requests and view history.</p>
            </div>

            {bookings.length === 0 ? (
                <div className="card text-center p-xl">
                    <FiCalendar size={48} className="text-secondary mb-md" />
                    <h3>No appointments found</h3>
                    <p>You haven't booked any appointments yet.</p>
                    <button className="btn btn-primary btn-no-hover mt-md" onClick={() => window.location.href = '/patient/book'}>
                        Book Your First Appointment
                    </button>
                </div>
            ) : (
                <div className="bookings-list">
                    {bookings.map((booking: any) => (
                        <div key={booking.id} className="booking-status-card mb-md">
                            <div className="booking-status-header">
                                <div className="ref-info">
                                    <span className="ref-label">Reference ID</span>
                                    <span className="ref-value">{booking.referenceId || `EV-REQ-${booking.id}`}</span>
                                </div>
                                <div className={`status-badge ${getStatusClass(booking.status)}`}>
                                    {booking.status}
                                </div>
                            </div>

                            <div className="booking-status-body grid grid-3">
                                <div className="info-item">
                                    <FiActivity className="icon" />
                                    <div>
                                        <label>Clinic</label>
                                        <p>{booking.clinic?.name || 'EV Clinic'}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <FiCalendar className="icon" />
                                    <div>
                                        <label>Date</label>
                                        <p>{new Date(booking.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <FiClock className="icon" />
                                    <div>
                                        <label>Time</label>
                                        <p>{booking.time}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="booking-status-footer mt-md pt-md border-t">
                                <div className="patient-snippet">
                                    <FiUser className="mr-xs" />
                                    <span>For: <strong>{user?.name || 'Patient'}</strong></span>
                                </div>
                                {booking.status === 'Approved' && (
                                    <div className="action-hint text-success">
                                        Please arrive 15 minutes before your scheduled time.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AppointmentStatus;
