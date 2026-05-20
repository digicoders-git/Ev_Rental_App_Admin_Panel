import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Car, CalendarCheck, User, LogOut, Bell, Menu, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import '../pages/franchisePanel/FranchiseMobile.css';

const AdminLayout = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
    navigate('/login');
    setShowLogoutConfirm(false);
  };

  const navItems = [
    { path: '/', icon: <Home size={24} />, label: 'Home' },
    { path: '/users', icon: <Users size={24} />, label: 'Users' },
    { path: '/vehicles', icon: <Car size={24} />, label: 'Vehicles' },
    { path: '/bookings', icon: <CalendarCheck size={24} />, label: 'Bookings' },
    { path: '/profile', icon: <User size={24} />, label: 'Profile' }
  ];

  const getHeaderTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/users': return 'User Management';
      case '/vehicles': return 'Vehicles Fleet';
      case '/bookings': return 'Bookings Management';
      case '/kyc': return 'KYC Verification';
      case '/plans': return 'Rental Plans';
      case '/franchise': return 'Franchises';
      case '/assign-ev': return 'Assign EVs';
      case '/documents': return 'Documents';
      case '/revenue': return 'Revenue Ledger';
      case '/coupons': return 'Offers & Coupons';
      case '/complaints': return 'User Complaints';
      case '/content': return 'Content Management';
      case '/analytics': return 'Business Analytics';
      case '/payments': return 'Payments Records';
      case '/notifications': return 'System Alerts';
      case '/settings': return 'System Settings';
      case '/profile': return 'Profile Settings';
      default: return 'Admin Portal';
    }
  };

  return (
    <div className="mobile-app-container">
      {/* Dynamic responsive sidebar for mobile navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} setIsAuthenticated={setIsAuthenticated} userRole="admin" />
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)} 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0, 0, 0, 0.4)', 
            backdropFilter: 'blur(3px)', 
            zIndex: 1001 
          }}
        ></div>
      )}

      {/* Top App Bar */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="Open Menu">
            <Menu size={22} />
          </button>
          <div className="mobile-header-title">
            {getHeaderTitle()}
          </div>
        </div>
        <div className="mobile-header-actions">
          <button className="icon-btn" onClick={() => navigate('/notifications')} title="Notifications"><Bell size={20} /></button>
          <button className="icon-btn" onClick={handleLogout} title="Logout"><LogOut size={20} /></button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mobile-content-area">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <div className="mobile-bottom-nav">
        {navItems.map((item) => (
          <div 
            key={item.path} 
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* ── MOBILE LOGOUT CONFIRMATION MODAL ── */}
      {showLogoutConfirm && createPortal(
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)} style={{ zIndex: 10001, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '350px', width: '90%', margin: '0 auto', background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: '#333' }}>Confirm Logout</h3>
              <button className="btn-icon" onClick={() => setShowLogoutConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ paddingBottom: '20px', textAlign: 'center' }}>
              <div className="delete-body">
                <div className="delete-icon-wrap" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', marginBottom: '16px' }}>
                  <LogOut size={28} />
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#444', fontWeight: 500 }}>Are you sure you want to <strong>Logout</strong>?</p>
                <p className="delete-sub" style={{ margin: 0, fontSize: '0.8rem', color: '#777' }}>You will need to sign in again to access the admin portal.</p>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <button className="btn btn-outline" onClick={() => setShowLogoutConfirm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc', background: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmLogout} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <LogOut size={14} /> Yes, Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminLayout;
