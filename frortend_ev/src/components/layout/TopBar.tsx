import { useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

import { FiChevronDown, FiBell, FiLogOut, FiUser, FiMenu, FiClock } from 'react-icons/fi';
import { departmentService } from '../../services/department.service';
import './TopBar.css';

interface TopBarProps {
    onToggleSidebar: () => void;
}

const TopBar = ({ onToggleSidebar }: TopBarProps) => {
    const { user, selectedClinic, getUserClinics, selectClinic, logout } = useAuth() as any;

    const [isClinicDropdownOpen, setIsClinicDropdownOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notificationsList, setNotificationsList] = useState<any[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const userClinics = getUserClinics() || [];
    const location = useLocation();

    const notificationRef = useRef<HTMLDivElement>(null);

    const logoutAndRedirect = () => {
        logout();
        window.location.href = '/login';
    };

    const isPatientView = user?.roles?.includes('PATIENT') || location.pathname.includes('/patient') || location.pathname.startsWith('/book');
    const showPlatformPill = isPatientView || user?.roles?.includes('SUPER_ADMIN');

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) return;
            try {
                // Determine appropriate department for count badge
                let dept: string | undefined = undefined;
                const roles = user.roles || [];
                if (roles.includes('PHARMACY') || roles.includes('PHARMACIST')) dept = 'pharmacy';
                else if (roles.includes('LAB') || roles.includes('LAB_TECHNICIAN')) dept = 'laboratory';
                else if (roles.includes('RADIOLOGY')) dept = 'radiology';

                // Get count for badge
                const countRes: any = await departmentService.getUnreadCount(dept);
                const count = countRes?.count ?? countRes?.data?.count ?? 0;
                setNotificationCount(count);

                // If open, fetch actual list
                if (isNotificationsOpen) {
                    const listRes: any = await departmentService.getNotifications();
                    setNotificationsList(listRes?.data ?? listRes ?? []);
                }
            } catch (e) {
                console.error('Failed to fetch notifications', e);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [user, isNotificationsOpen]);



    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className={`topbar ${isPatientView ? 'patient-nav' : ''}`}>
            <div className="topbar-left">
                <button className="mobile-toggle" onClick={onToggleSidebar}>
                    <FiMenu />
                </button>
                {showPlatformPill ? (
                    <div
                        className={`ev-platform-pill ${userClinics.length > 1 ? 'clickable' : ''}`}
                        onClick={() => userClinics.length > 1 && setIsClinicDropdownOpen(!isClinicDropdownOpen)}
                    >
                        <img src="/sidebar-logo.jpg" alt="Logo" style={{ width: '24px', height: '24px', marginRight: '8px', borderRadius: '4px' }} />
                        <span>EV Platform</span>
                        <FiChevronDown className={`chevron ${isClinicDropdownOpen ? 'open' : ''}`} />

                        {isClinicDropdownOpen && (
                            <div className="clinic-dropdown">
                                {userClinics.map((clinic: any) => (
                                    <div
                                        key={clinic.id}
                                        className={`clinic-option ${selectedClinic?.id === clinic.id ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            selectClinic(clinic);
                                            setIsClinicDropdownOpen(false);
                                        }}
                                    >
                                        <span>{clinic.name}</span>
                                        {selectedClinic?.id === clinic.id && <div className="active-indicator"></div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        className={`clinic-selector ${userClinics.length > 1 ? 'clickable' : ''}`}
                        onClick={() => userClinics.length > 1 && setIsClinicDropdownOpen(!isClinicDropdownOpen)}
                    >
                        <img src="/sidebar-logo.jpg" alt="Logo" className="clinic-icon" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '4px' }} />
                        <span className="clinic-name">{selectedClinic?.name || 'Clinic'}</span>
                        {userClinics.length > 1 && <FiChevronDown className={`chevron ${isClinicDropdownOpen ? 'open' : ''}`} />}

                        {isClinicDropdownOpen && (
                            <div className="clinic-dropdown">
                                {userClinics.map((clinic: any) => (
                                    <div
                                        key={clinic.id}
                                        className={`clinic-option ${selectedClinic?.id === clinic.id ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            selectClinic(clinic);
                                            setIsClinicDropdownOpen(false);
                                        }}
                                    >
                                        <span>{clinic.name}</span>
                                        {selectedClinic?.id === clinic.id && <div className="active-indicator"></div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>



            <div className="topbar-right">
                <div className="notification-wrapper" ref={notificationRef}>
                    <button className="notification-btn" onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                        <FiBell />
                        {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
                    </button>
                    {isNotificationsOpen && (
                        <div className="notifications-dropdown">
                            <div className="dropdown-header">
                                <h3>Notifications</h3>
                                {notificationCount > 0 && <span className="unread-dot">{notificationCount} unread</span>}
                            </div>
                            <div className="notifications-list">
                                {notificationsList.length > 0 ? (
                                    notificationsList.map((n: any) => (
                                        <div key={n.id} className={`notification-item ${n.status === 'unread' ? 'unread' : ''}`}>
                                            <div className="notif-icon"><FiClock /></div>
                                            <div className="notif-content">
                                                <p>{n.message}</p>
                                                <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-notifications">
                                        <FiBell size={24} />
                                        <p>No new notifications</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {!isPatientView && (
                    <span className="user-role-label">
                        {location.pathname.startsWith('/clinic-admin') ? 'ADMIN' : user?.roles?.[0]?.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                )}
                {isPatientView && <span className="patient-label">Patient</span>}

                <div className="user-profile" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                    <div className="user-avatar">
                        <FiUser />
                    </div>

                    {isProfileDropdownOpen && (
                        <div className="profile-dropdown">
                            <div className="profile-header">
                                <div className="profile-avatar-large">
                                    <FiUser />
                                </div>
                                <div className="profile-info">
                                    <h4>{user?.name || 'User'}</h4>
                                    <p className="capitalize">{user?.roles?.[0]?.replace('_', ' ') || 'PATIENT'}</p>
                                </div>
                            </div>
                            <div className="profile-divider"></div>
                            {user && (
                                <button className="profile-menu-item logout" onClick={logoutAndRedirect}>
                                    <FiLogOut />
                                    <span>Sign Out</span>
                                </button>
                            )}
                            {!user && (
                                <button className="profile-menu-item" onClick={() => window.location.href = '/login'}>
                                    <FiUser />
                                    <span>Login</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopBar;
