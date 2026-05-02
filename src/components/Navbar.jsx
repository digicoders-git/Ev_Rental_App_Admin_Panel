import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, User, Menu, Settings, LogOut, UserCircle, ChevronDown, Calendar, Clock, X, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotifications } from '../services/apiServices';
import './Navbar.css';

const Navbar = ({ onMenuClick, setIsAuthenticated }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotificationCount();
    const intervalNotif = setInterval(fetchNotificationCount, 30000);
    const intervalTime  = setInterval(() => setCurrentTime(new Date()), 1000);

    const handler = (e) => { 
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); 
    };
    document.addEventListener('mousedown', handler);
    
    return () => {
      document.removeEventListener('mousedown', handler);
      clearInterval(intervalNotif);
      clearInterval(intervalTime);
    };
  }, []);

  const fetchNotificationCount = async () => {
    try {
      const res = await getNotifications();
      if (res.data.success) {
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
    navigate('/login');
    setShowLogoutConfirm(false);
  };

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{"name":"Admin User","email":"admin@voltrent.com","role":"Super Admin"}');
  const initials  = adminUser.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AU';

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="mobile-menu-btn" onClick={onMenuClick}><Menu size={20} /></button>
        <div className="live-clock">
          <div className="clock-item">
            <Calendar size={14} className="clock-icon" />
            <span>{formatDate(currentTime)}</span>
          </div>
          <div className="clock-divider" />
          <div className="clock-item">
            <Clock size={14} className="clock-icon" />
            <span className="time-text">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        <button className="nav-icon-btn" onClick={() => navigate('/notifications')}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {/* Avatar + Dropdown */}
        <div className="user-profile-wrap" ref={dropdownRef}>
          <button className="user-profile" onClick={() => setDropdownOpen(p => !p)}>
            <div className="user-info">
              <span className="user-name">{adminUser.name}</span>
              <span className="user-role">{adminUser.role || 'Admin'}</span>
            </div>
            <div className="user-avatar">{initials}</div>
            <ChevronDown size={14} className={`avatar-chevron ${dropdownOpen ? 'open' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">{initials}</div>
                <div>
                  <span className="dropdown-name">{adminUser.name}</span>
                  <span className="dropdown-email">{adminUser.email}</span>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => { navigate('/profile'); setDropdownOpen(false); }}>
                <UserCircle size={16} /> My Profile
              </button>
              <button className="dropdown-item" onClick={() => { navigate('/settings'); setDropdownOpen(false); }}>
                <Settings size={16} /> Settings
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── LOGOUT CONFIRMATION MODAL ── */}
      {showLogoutConfirm && createPortal(
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Confirm Logout</h3>
              <button className="btn-icon" onClick={() => setShowLogoutConfirm(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-body">
                <div className="delete-icon-wrap" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                  <LogOut size={28} />
                </div>
                <p>Are you sure you want to <strong>Logout</strong> from the dashboard?</p>
                <p className="delete-sub">You will need to enter your credentials again to access the portal.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowLogoutConfirm(false)}>Stay Here</button>
              <button className="btn btn-danger" onClick={confirmLogout}>
                <LogOut size={16} /> Yes, Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

export default Navbar;
