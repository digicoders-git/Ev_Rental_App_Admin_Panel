import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Bike, CalendarDays, Wallet, User, LogOut, Bell } from 'lucide-react';
import './FranchiseMobile.css';

const FranchiseLayout = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const navItems = [
    { path: '/f', icon: <Home size={24} />, label: 'Home' },
    { path: '/f/vehicles', icon: <Bike size={24} />, label: 'Vehicles' },
    { path: '/f/rides', icon: <CalendarDays size={24} />, label: 'Rides' },
    { path: '/f/earnings', icon: <Wallet size={24} />, label: 'Earnings' },
    { path: '/f/profile', icon: <User size={24} />, label: 'Profile' }
  ];

  const getHeaderTitle = () => {
    switch (location.pathname) {
      case '/f': return 'Dashboard';
      case '/f/vehicles': return 'My Vehicles';
      case '/f/rides': return 'Ride Management';
      case '/f/earnings': return 'Earnings';
      case '/f/profile': return 'Profile Settings';
      default: return 'Franchise Panel';
    }
  };

  return (
    <div className="mobile-app-container">
      {/* Top App Bar */}
      <div className="mobile-header">
        <div className="mobile-header-title">
          {getHeaderTitle()}
        </div>
        <div className="mobile-header-actions">
          <button className="icon-btn"><Bell size={20} /></button>
          <button className="icon-btn" onClick={handleLogout}><LogOut size={20} /></button>
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
    </div>
  );
};

export default FranchiseLayout;
