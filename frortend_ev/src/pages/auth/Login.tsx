import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff, FiShield, FiClock } from 'react-icons/fi';

import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);

    const [step, setStep] = useState<'login' | 'otp'>('login');
    const [otp, setOtp] = useState('');
    const { login, confirmOTP, lockoutUntil, handleRedirectByRole } = useAuth() as any;

    const navigate = useNavigate();

    useEffect(() => {
        const rememberedEmail = localStorage.getItem('ev_remembered_email');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, []);

    useEffect(() => {
        if (lockoutUntil && lockoutUntil > Date.now()) {
            setLockoutTime(lockoutUntil);
            const interval = setInterval(() => {
                if (lockoutUntil <= Date.now()) {
                    setLockoutTime(null);
                    clearInterval(interval);
                } else {
                    setLockoutTime(lockoutUntil);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [lockoutUntil]);

    const getRemainingLockoutTime = () => {
        if (!lockoutTime) return '';
        const remaining = Math.max(0, lockoutTime - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')} `;
    };

    const performLogin = async (targetEmail: string, targetPassword: string, _otp?: string) => {
        setError('');
        setIsLoading(true);

        try {
            const result = await login(targetEmail, targetPassword);

            if (result && result.success) {
                if (result.otpRequired) {
                    setStep('otp');
                    if (rememberMe) {
                        localStorage.setItem('ev_remembered_email', targetEmail);
                    } else {
                        localStorage.removeItem('ev_remembered_email');
                    }
                } else {
                    // Direct login successful
                    const user = result.user;
                    if (user && !user.roles?.some((r: string) => r.toUpperCase() === 'SUPER_ADMIN') && user.clinics && user.clinics.length > 1) {
                        navigate('/select-clinic');
                    } else {
                        const primaryRole = user?.role || (user?.roles && user.roles[0]) || '';
                        handleRedirectByRole(primaryRole);
                    }
                }
            } else {
                setError(result?.error || 'Login failed. Please try again.');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Unable to connect to service. Try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await confirmOTP(email, otp);

            if (result.success) {
                const user = result.user;
                if (user && !user.roles?.some((r: string) => r.toUpperCase() === 'SUPER_ADMIN') && user.clinics && user.clinics.length > 1) {
                    navigate('/select-clinic');
                } else {
                    const primaryRole = user?.role || (user?.roles && user.roles[0]) || '';
                    handleRedirectByRole(primaryRole);
                }
            } else {
                setError(result.error || 'Invalid or expired verification code');
            }
        } catch (err) {
            setError('Verification failed. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        performLogin(email, password);
    };

    const isLocked = !!(lockoutTime && lockoutTime > Date.now());

    return (
        <div className="login-container">
            <div className="login-layout-wrapper">
                <div className="login-card">
                    <div className="login-header">
                        <div className="brand-icon-wrapper mb-md">
                            <img src="/sidebar-logo.jpg" alt="Exclusive Vision Logo" className="brand-icon-img-login" />
                        </div>
                        <h1 className="login-title">Exclusive Vision</h1>
                        <h2 className="login-subtitle">Hospital Information System</h2>
                    </div>

                    {step === 'login' ? (
                        <form className="login-form" onSubmit={handleSubmit}>
                            {error && (
                                <div className="error-message">
                                    <FiAlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {isLocked && (
                                <div className="lockout-message">
                                    <FiClock size={18} />
                                    <div>
                                        <strong>Account Locked</strong>
                                        <p>Too many failed attempts. Try again in {getRemainingLockoutTime()}</p>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="email">Work Email *</label>
                                <div className="input-with-icon">
                                    <FiMail className="input-icon" />
                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="name@ev.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLocked}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Security Password *</label>
                                <div className="input-with-icon">
                                    <FiLock className="input-icon" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLocked}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-options">
                                <label className="remember-me">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        disabled={isLocked}
                                    />
                                    <span>Remember credentials</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className={`btn btn-primary btn-full ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading || isLocked}
                            >
                                {isLoading ? 'Verifying Credentials...' : 'Access Dashboard'}
                            </button>
                        </form>
                    ) : (
                        <form className="login-form" onSubmit={handleVerifyOTP}>
                            <div className="otp-explanation mb-lg">
                                <div className="shield-icon-wrap">
                                    <FiShield />
                                </div>
                                <h3>Two-Step Verification</h3>
                                <p>We've sent a 6-digit code to <strong>{email}</strong>. Enter it below to secure your session.</p>
                            </div>

                            {error && (
                                <div className="error-message">
                                    <FiAlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="otp">Verification Code</label>
                                <div className="input-with-icon">
                                    <input
                                        type="text"
                                        id="otp"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        required
                                        autoFocus
                                        className="otp-input-field"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`btn btn-primary btn-full ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading || otp.length < 6}
                            >
                                {isLoading ? 'Verifying OTP...' : 'Confirm & Login'}
                            </button>

                            <button
                                type="button"
                                className="btn-link mt-md"
                                onClick={() => setStep('login')}
                                style={{ display: 'block', margin: '1rem auto', border: 'none', background: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Back to Login
                            </button>
                        </form>
                    )}
                </div>

                {/* Demo Credentials Side Panel */}
                <div className="demo-access-container side-panel">
                    <div className="demo-credentials">
                        <div className="demo-header">
                            <h2 className="demo-title">Demo Access</h2>
                            <p className="demo-subtitle">Select a role to instantly populate credentials and explore the system.</p>
                        </div>

                        <div className="demo-table-wrapper">
                            <table className="demo-table">
                                <thead>
                                    <tr>
                                        <th>Role / User</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr onClick={() => performLogin('superadmin@ev.com', 'admin123', '1234')}>
                                        <td>
                                            <span className="role-name">Super Admin</span>
                                            <span className="role-email">superadmin@ev.com</span>
                                        </td>
                                        <td>
                                            <button className="btn-table-login">Magic Login</button>
                                        </td>
                                    </tr>
                                    <tr onClick={() => performLogin('proclinic@gmail.com', '123456')}>
                                        <td>
                                            <span className="role-name">Clinic Admin</span>
                                            <span className="role-email">proclinic@gmail.com</span>
                                        </td>
                                        <td>
                                            <button className="btn-table-login">Magic Login</button>
                                        </td>
                                    </tr>
                                    <tr onClick={() => performLogin('avinash@gmail.com', '123456')}>
                                        <td>
                                            <span className="role-name">Doctor</span>
                                            <span className="role-email">avinash@gmail.com</span>
                                        </td>
                                        <td>
                                            <button className="btn-table-login">Magic Login</button>
                                        </td>
                                    </tr>
                                    <tr onClick={() => performLogin('sonu@gmail.com', '123456')}>
                                        <td>
                                            <span className="role-name">Receptionist</span>
                                            <span className="role-email">sonu@gmail.com</span>
                                        </td>
                                        <td>
                                            <button className="btn-table-login">Magic Login</button>
                                        </td>
                                    </tr>
                                    <tr onClick={() => performLogin('rohan@gmail.com', '123456')}>
                                        <td>
                                            <span className="role-name">Pharmacy</span>
                                            <span className="role-email">rohan@gmail.com</span>
                                        </td>
                                        <td>
                                            <button className="btn-table-login">Magic Login</button>
                                        </td>
                                    </tr>
                                    <tr onClick={() => performLogin('harshu@gmail.com', '123456')}>
                                        <td>
                                            <span className="role-name">Lab Technician</span>
                                            <span className="role-email">harshu@gmail.com</span>
                                        </td>
                                        <td>
                                            <button className="btn-table-login">Magic Login</button>
                                        </td>
                                    </tr>
                                    <tr onClick={() => performLogin('shivam@gmail.com', '123456')}>
                                        <td>
                                            <span className="role-name">Radiology</span>
                                            <span className="role-email">shivam@gmail.com</span>
                                        </td>
                                        <td>
                                            <button className="btn-table-login">Magic Login</button>
                                        </td>
                                    </tr>
                                    <tr onClick={() => performLogin('sakshi@gmail.com', '123456')}>
                                        <td>
                                            <span className="role-name">Accountant</span>
                                            <span className="role-email">sakshi@gmail.com</span>
                                        </td>
                                        <td>
                                            <button className="btn-table-login">Magic Login</button>
                                        </td>
                                    </tr>
                                    <tr onClick={() => performLogin('kunal@gmail.com', '123456')}>
                                        <td>
                                            <span className="role-name">Document Controller</span>
                                            <span className="role-email">kunal@gmail.com</span>
                                        </td>
                                        <td>
                                            <button className="btn-table-login">Magic Login</button>
                                        </td>
                                    </tr>
                                    <tr onClick={() => performLogin('cult@gmail.com', '123456')}>
                                        <td>
                                            <span className="role-name">Patient</span>
                                            <span className="role-email">cult@gmail.com</span>
                                        </td>
                                        <td>
                                            <button className="btn-table-login">Magic Login</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="demo-passwords">
                            <FiShield className="pass-icon" />
                            <span>Super Admin: <code>admin123</code> | Staff: <code>123456</code></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
