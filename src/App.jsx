import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Vehicles from './pages/Vehicles';
import Bookings from './pages/Bookings';
import KYC from './pages/KYC';
import Franchise from './pages/Franchise';
import RentalPlans from './pages/RentalPlans';
import Payments from './pages/Payments';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import AssignEV from './pages/AssignEV';
import Documents from './pages/Documents';
import Revenue from './pages/Revenue';
import Coupons from './pages/Coupons';
import Complaints from './pages/Complaints';
import Content from './pages/Content';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Login from './pages/Login';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const token      = localStorage.getItem('token');
    if (authStatus === 'true' && token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading-screen"><div className="loader"></div></div>;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} setIsAuthenticated={setIsAuthenticated} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Navbar onMenuClick={toggleSidebar} setIsAuthenticated={setIsAuthenticated} />
        <div className="page-wrapper fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/kyc" element={<KYC />} />
            <Route path="/plans" element={<RentalPlans />} />
            <Route path="/franchise" element={<Franchise />} />
            <Route path="/assign-ev" element={<AssignEV />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/content" element={<Content />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
