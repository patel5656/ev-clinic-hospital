import { useState } from 'react';
import { FiSave, FiClock, FiCalendar, FiBell, FiSettings as FiSettingsIcon } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import './ClinicSettings.css';

const ClinicSettings = () => {
    const { selectedClinic } = useAuth() as any;
    const { clinics } = useApp() as any;

    // Get current clinic
    const currentClinic = clinics.find((c: any) => c.id === selectedClinic?.id) || selectedClinic;

    const [settings, setSettings] = useState({
        // Clinic Profile
        clinicName: currentClinic?.name || '',
        address: currentClinic?.location || '',
        phone: currentClinic?.contact || '',
        email: currentClinic?.email || '',

        // Working Hours
        workingHours: {
            monday: { start: '09:00', end: '17:00', enabled: true },
            tuesday: { start: '09:00', end: '17:00', enabled: true },
            wednesday: { start: '09:00', end: '17:00', enabled: true },
            thursday: { start: '09:00', end: '17:00', enabled: true },
            friday: { start: '09:00', end: '17:00', enabled: true },
            saturday: { start: '09:00', end: '13:00', enabled: true },
            sunday: { start: '09:00', end: '17:00', enabled: false }
        },

        // Notifications
        emailNotifications: true,
        smsNotifications: false,
        bookingConfirmations: true,

        // Booking Rules
        advanceBookingDays: 30,
        cancellationHours: 24,
        slotDuration: 30
    });

    const handleSave = () => {
        console.log('Saving settings:', settings);
        alert('Settings saved successfully!');
    };

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <div className="clinic-settings-page">
            <div className="page-header">
                <div>
                    <h1>Clinic Settings</h1>
                    <p>Configure your clinic profile, working hours, and preferences</p>
                </div>
                <button className="btn btn-primary btn-with-icon btn-no-hover" onClick={handleSave}>
                    <FiSave />
                    <span>Save Changes</span>
                </button>
            </div>

            <div className="settings-grid">
                {/* Clinic Profile */}
                <div className="settings-card card">
                    <div className="settings-header">
                        <FiSettingsIcon />
                        <h3>Clinic Profile</h3>
                    </div>
                    <div className="settings-form">
                        <div className="form-group">
                            <label>Clinic Name</label>
                            <input
                                type="text"
                                value={settings.clinicName}
                                onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <input
                                type="text"
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Phone</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="+971"
                                        style={{ textAlign: 'center', padding: '0 0.5rem' }}
                                        value={settings.phone.includes(' ') ? settings.phone.split(' ')[0] : '+971'}
                                        onChange={e => {
                                            const currentNumber = settings.phone.includes(' ')
                                                ? settings.phone.split(' ').slice(1).join(' ')
                                                : settings.phone;
                                            setSettings({ ...settings, phone: `${e.target.value} ${currentNumber}` });
                                        }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Clinic number"
                                        value={settings.phone.includes(' ') ? (settings.phone.split(' ')[0] === '+971' && !settings.phone.includes(' ') ? settings.phone : settings.phone.split(' ').slice(1).join(' ')) : settings.phone.replace('+971', '').trim()}
                                        onChange={e => {
                                            const currentCode = settings.phone.includes(' ')
                                                ? settings.phone.split(' ')[0]
                                                : '+971';
                                            setSettings({ ...settings, phone: `${currentCode} ${e.target.value}` });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={settings.email}
                                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Working Hours */}
                <div className="settings-card card full-width">
                    <div className="settings-header">
                        <FiClock />
                        <h3>Working Hours</h3>
                    </div>
                    <div className="working-hours-grid">
                        {days.map(day => (
                            <div key={day} className="day-schedule">
                                <label className="day-toggle">
                                    <input
                                        type="checkbox"
                                        checked={settings.workingHours[day as keyof typeof settings.workingHours].enabled}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            workingHours: {
                                                ...settings.workingHours,
                                                [day]: { ...settings.workingHours[day as keyof typeof settings.workingHours], enabled: e.target.checked }
                                            }
                                        })}
                                    />
                                    <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                                </label>
                                {settings.workingHours[day as keyof typeof settings.workingHours].enabled && (
                                    <div className="time-inputs">
                                        <input
                                            type="time"
                                            value={settings.workingHours[day as keyof typeof settings.workingHours].start}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                workingHours: {
                                                    ...settings.workingHours,
                                                    [day]: { ...settings.workingHours[day as keyof typeof settings.workingHours], start: e.target.value }
                                                }
                                            })}
                                        />
                                        <span>to</span>
                                        <input
                                            type="time"
                                            value={settings.workingHours[day as keyof typeof settings.workingHours].end}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                workingHours: {
                                                    ...settings.workingHours,
                                                    [day]: { ...settings.workingHours[day as keyof typeof settings.workingHours], end: e.target.value }
                                                }
                                            })}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notifications */}
                <div className="settings-card card">
                    <div className="settings-header">
                        <FiBell />
                        <h3>Notification Preferences</h3>
                    </div>
                    <div className="settings-form">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                            />
                            <div>
                                <strong>Email Notifications</strong>
                                <p>Receive updates via email</p>
                            </div>
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.smsNotifications}
                                onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                            />
                            <div>
                                <strong>SMS Notifications</strong>
                                <p>Receive updates via SMS</p>
                            </div>
                        </label>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={settings.bookingConfirmations}
                                onChange={(e) => setSettings({ ...settings, bookingConfirmations: e.target.checked })}
                            />
                            <div>
                                <strong>Booking Confirmations</strong>
                                <p>Send confirmation to patients</p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Booking Rules */}
                <div className="settings-card card">
                    <div className="settings-header">
                        <FiCalendar />
                        <h3>Booking Rules</h3>
                    </div>
                    <div className="settings-form">
                        <div className="form-group">
                            <label>Advance Booking (Days)</label>
                            <input
                                type="number"
                                value={settings.advanceBookingDays}
                                onChange={(e) => setSettings({ ...settings, advanceBookingDays: parseInt(e.target.value) })}
                                min="1"
                                max="90"
                            />
                            <small>Maximum days in advance patients can book</small>
                        </div>
                        <div className="form-group">
                            <label>Cancellation Notice (Hours)</label>
                            <input
                                type="number"
                                value={settings.cancellationHours}
                                onChange={(e) => setSettings({ ...settings, cancellationHours: parseInt(e.target.value) })}
                                min="1"
                                max="72"
                            />
                            <small>Minimum hours before appointment to cancel</small>
                        </div>
                        <div className="form-group">
                            <label>Slot Duration (Minutes)</label>
                            <select
                                value={settings.slotDuration}
                                onChange={(e) => setSettings({ ...settings, slotDuration: parseInt(e.target.value) })}
                            >
                                <option value="15">15 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="45">45 minutes</option>
                                <option value="60">60 minutes</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicSettings;
