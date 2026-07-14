import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users, 
  Car, 
  CalendarCheck, 
  ShieldCheck, 
  Building2, 
  CreditCard, 
  Briefcase, 
  Bell, 
  Settings,
  LogOut,
  Zap,
  X,
  GitMerge,
  FolderOpen,
  TrendingUp,
  Tag,
  MessageSquare,
  Layers,
  BarChart2,
  AlertTriangle,
  Wallet,
  UserCheck,
  AlertCircle,
  BarChart,
  Headphones,
  Receipt
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, setIsAuthenticated, userRole }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const adminMenuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Vehicles', path: '/vehicles', icon: Car },
    { name: 'Rental Plans', path: '/plans', icon: Zap },
    { name: 'Wallet Plans', path: '/recharge-plans', icon: Wallet },
    { name: 'Bookings', path: '/bookings', icon: CalendarCheck },
    { name: 'KYC Management', path: '/kyc', icon: ShieldCheck },
    { name: 'Gig Companies', path: '/gig-companies', icon: Briefcase },
    { name: 'Franchise', path: '/franchise', icon: Building2 },
    { name: 'Assign EV', path: '/assign-ev', icon: GitMerge },
    { name: 'Documents',  path: '/documents', icon: FolderOpen },
    { name: 'Revenue',    path: '/revenue',   icon: TrendingUp },
    { name: 'Offers & Coupons', path: '/coupons',    icon: Tag },
    { name: 'Complaints',   path: '/complaints', icon: MessageSquare },
    { name: 'Damage Reports', path: '/damage-reports', icon: AlertTriangle },
    { name: 'Content',    path: '/content',    icon: Layers },
    { name: 'Analytics',  path: '/analytics',  icon: BarChart2 },
    { name: 'Settlements', path: '/settlements', icon: Receipt },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const franchiseMenuItems = [
    { name: 'Dashboard',     path: '/f',              icon: LayoutDashboard },
    { name: 'My Vehicles',   path: '/f/vehicles',     icon: Car },
    { name: 'Rides',         path: '/f/rides',        icon: CalendarCheck },
    { name: 'Earnings',      path: '/f/earnings',     icon: Wallet },
    { name: 'Customers',     path: '/f/customers',    icon: Users },
    { name: 'KYC Status',    path: '/f/kyc',          icon: UserCheck },
    { name: 'Due Payments',  path: '/f/dues',         icon: AlertCircle },
    { name: 'Reports',       path: '/f/reports',      icon: BarChart },
    { name: 'Notifications', path: '/f/notifications', icon: Bell },
    { name: 'Complaints',    path: '/f/complaints',   icon: Headphones },
    { name: 'Settlements',   path: '/settlements',    icon: Receipt },
    { name: 'Profile & Settings', path: '/f/profile', icon: Settings },
  ];

  const menuItems = userRole === 'franchise' ? franchiseMenuItems : adminMenuItems;

  const navigate = useNavigate();

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
    navigate('/login');
    setShowLogoutConfirm(false);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.png" alt="TRIS Electric" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }} 
               onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
          <Zap size={24} fill="white" stroke="white" style={{ display: 'none' }} />
        </div>
        <span className="logo-text">TRIS <span>Electric</span></span>
        <button className="sidebar-close-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                onClick={onClose}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
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
    </aside>
  );
};

export default Sidebar;

