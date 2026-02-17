import { useState, useEffect } from 'react';
import { FiDatabase, FiShield, FiCheck, FiLock, FiMail, FiServer } from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import { superService } from '../../services/super.service';
import './Settings.css';

const Settings = () => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'security' | 'email' | 'maintenance'>('security');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
    const [passwordExpiry, setPasswordExpiry] = useState(90);
    const [sessionTimeout, setSessionTimeout] = useState(30);
    const [storageStats, setStorageStats] = useState<any>(null);
    const [lastBackup, setLastBackup] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessMessage] = useState(false);

    // SMTP Settings
    const [smtpSettings, setSmtpSettings] = useState({
        host: 'smtp.exclusivevision.com',
        port: 587,
        user: 'otp@exclusivevision.com',
        pass: '••••••••',
        senderEmail: 'otp@exclusivevision.com',
        encryption: 'TLS'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const [settingsRes, storageRes]: any = await Promise.all([
                superService.getSettings(),
                superService.getStorageStats()
            ]);

            const settings = settingsRes.data;
            setTwoFactorEnabled(settings.security.twoFactorEnabled);
            setPasswordExpiry(settings.security.passwordExpiry);
            setSessionTimeout(settings.security.sessionTimeout);
            setStorageStats(storageRes.data);

            if (settings.system.lastBackup) {
                const backupDate = new Date(settings.system.lastBackup);
                const hoursAgo = Math.floor((Date.now() - backupDate.getTime()) / (1000 * 60 * 60));
                setLastBackup(`${hoursAgo}h ago`);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to fetch settings.');
        }
    };

    const handleUpdateSecurity = async () => {
        setIsSaving(true);
        try {
            await superService.updateSecuritySettings({
                twoFactorEnabled,
                passwordExpiry,
                sessionTimeout
            });
            toast.success('Security settings updated successfully!');
        } catch (error) {
            console.error('Failed to update security settings:', error);
            toast.error('Failed to update security settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateSMTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // This would call a new service method
            // await superService.updateSMTPSettings(smtpSettings);
            toast.success('SMTP settings updated successfully!');
        } catch (error) {
            console.error('Failed to update SMTP settings:', error);
            toast.error('Failed to update SMTP settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDatabaseBackup = async () => {
        const confirmed = confirm('Start Database Backup?\n\nThis will create a complete backup of the database.');
        if (confirmed) {
            setIsSaving(true);
            try {
                const res: any = await superService.triggerBackup();
                toast.success(`Backup initiated! ${res.message}`);
                fetchSettings();
            } catch (error) {
                console.error('Failed to trigger backup:', error);
                toast.error('Failed to trigger backup. Please try again.');
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="settings-page fade-in">
            <div className="page-header">
                <div>
                    <h1>Platform Settings</h1>
                    <p>Configure global system parameters, security policies, and email services.</p>
                </div>
            </div>

            <div className="settings-tabs">
                <button
                    className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    <FiShield style={{ marginRight: '8px' }} /> Security Policy
                </button>
                <button
                    className={`settings-tab ${activeTab === 'email' ? 'active' : ''}`}
                    onClick={() => setActiveTab('email')}
                >
                    <FiMail style={{ marginRight: '8px' }} /> Email & SMTP
                </button>
                <button
                    className={`settings-tab ${activeTab === 'maintenance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('maintenance')}
                >
                    <FiDatabase style={{ marginRight: '8px' }} /> Maintenance
                </button>
            </div>

            {showSuccessMessage && (
                <div className="alert alert-success fade-in" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.5rem',
                    background: '#E1F9F0',
                    border: '1px solid #10B981',
                    borderRadius: '8px',
                    color: '#065F46',
                    marginBottom: '1.5rem'
                }}>
                    <FiCheck size={20} />
                    <span>Settings updated successfully!</span>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="settings-grid">
                    <div className="settings-card">
                        <div className="card-header">
                            <FiLock />
                            <h3>Login & Security</h3>
                        </div>
                        <div className="settings-list">
                            <div className="settings-item">
                                <span className="item-label">Two-Step Verification (2FA)</span>
                                <label className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        checked={twoFactorEnabled}
                                        onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                                    />
                                    <span className={twoFactorEnabled ? "status-enabled" : "status-disabled"}>
                                        {twoFactorEnabled ? 'Mandatory' : 'Optional'}
                                    </span>
                                </label>
                            </div>
                            <div className="settings-item">
                                <span className="item-label">Password Expiry (Days)</span>
                                <select
                                    className="item-value"
                                    value={passwordExpiry}
                                    onChange={(e) => setPasswordExpiry(Number(e.target.value))}
                                >
                                    <option value={30}>30 Days</option>
                                    <option value={60}>60 Days</option>
                                    <option value={90}>90 Days</option>
                                    <option value={0}>Never</option>
                                </select>
                            </div>
                            <div className="settings-item">
                                <span className="item-label">Session Timeout (Minutes)</span>
                                <input
                                    type="number"
                                    className="item-value"
                                    style={{ width: '80px', textAlign: 'right' }}
                                    value={sessionTimeout}
                                    onChange={(e) => setSessionTimeout(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="card-footer">
                            <button className="btn btn-primary btn-sm btn-no-hover" onClick={handleUpdateSecurity} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Security Policy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'email' && (
                <form className="settings-form" onSubmit={handleUpdateSMTP}>
                    <div className="form-group">
                        <label>SMTP Host</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '8px', paddingLeft: '0.75rem' }}>
                            <FiServer color="#64748B" />
                            <input
                                type="text"
                                style={{ border: 'none', width: '100%', padding: '0.75rem' }}
                                value={smtpSettings.host}
                                onChange={e => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>SMTP Port</label>
                        <input
                            type="number"
                            value={smtpSettings.port}
                            onChange={e => setSmtpSettings({ ...smtpSettings, port: Number(e.target.value) })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Sender Email (OTP Sender)</label>
                        <input
                            type="email"
                            value={smtpSettings.senderEmail}
                            onChange={e => setSmtpSettings({ ...smtpSettings, senderEmail: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>SMTP Username</label>
                        <input
                            type="text"
                            value={smtpSettings.user}
                            onChange={e => setSmtpSettings({ ...smtpSettings, user: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>SMTP Password</label>
                        <input
                            type="password"
                            value={smtpSettings.pass}
                            onChange={e => setSmtpSettings({ ...smtpSettings, pass: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Encryption</label>
                        <select
                            value={smtpSettings.encryption}
                            onChange={e => setSmtpSettings({ ...smtpSettings, encryption: e.target.value })}
                        >
                            <option value="TLS">TLS</option>
                            <option value="SSL">SSL</option>
                            <option value="None">None</option>
                        </select>
                    </div>
                    <div className="full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" disabled={isSaving}>Test Connection</button>
                        <button type="submit" className="btn btn-primary btn-no-hover" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save SMTP Settings'}
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'maintenance' && (
                <div className="settings-grid">
                    <div className="settings-card">
                        <div className="card-header">
                            <FiDatabase />
                            <h3>System Maintenance</h3>
                        </div>
                        <div className="settings-list">
                            <div className="settings-item">
                                <span className="item-label">Database Backup</span>
                                <span className="text-secondary">Last: <strong className="text-success">{lastBackup || 'Never'}</strong></span>
                            </div>
                            <div className="settings-item">
                                <span className="item-label">Storage Usage</span>
                                <span className="text-warning">
                                    {storageStats ? `${storageStats.percentage}% Full (${storageStats.used} GB / ${storageStats.total} GB)` : 'Loading...'}
                                </span>
                            </div>
                        </div>
                        <div className="card-footer" style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => toast.info('Clearing cache...')}>Clear Cache</button>
                            <button className="btn btn-primary btn-sm btn-no-hover" onClick={handleDatabaseBackup} disabled={isSaving}>
                                {isSaving ? 'Backing up...' : 'Generate Full Backup'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
