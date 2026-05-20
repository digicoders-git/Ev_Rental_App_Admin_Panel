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

import AdminLayout from './pages/AdminLayout';

// Franchise Panel Imports
import FranchiseLayout from './pages/franchisePanel/FranchiseLayout';
import FranchiseDashboard from './pages/franchisePanel/FDashboard';
import FranchiseVehicles from './pages/franchisePanel/FVehicles';
import FranchiseRides from './pages/franchisePanel/FRides';
import FranchiseEarnings from './pages/franchisePanel/FEarnings';
import FranchiseProfile from './pages/franchisePanel/FProfile';
import FCustomers from './pages/franchisePanel/FCustomers';
import FKYC from './pages/franchisePanel/FKYC';
import FDues from './pages/franchisePanel/FDues';
import FReports from './pages/franchisePanel/FReports';
import FNotifications from './pages/franchisePanel/FNotifications';
import FComplaints from './pages/franchisePanel/FComplaints';

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const userRole = localStorage.getItem('userRole') || 'admin';

  if (userRole === 'franchise' && isMobile) {
    return (
      <Routes>
        <Route path="/f" element={<FranchiseLayout setIsAuthenticated={setIsAuthenticated} />}>
          <Route index element={<FranchiseDashboard />} />
          <Route path="vehicles" element={<FranchiseVehicles />} />
          <Route path="rides" element={<FranchiseRides />} />
          <Route path="earnings" element={<FranchiseEarnings />} />
          <Route path="customers" element={<FCustomers />} />
          <Route path="kyc" element={<FKYC />} />
          <Route path="dues" element={<FDues />} />
          <Route path="reports" element={<FReports />} />
          <Route path="notifications" element={<FNotifications />} />
          <Route path="complaints" element={<FComplaints />} />
          <Route path="profile" element={<FranchiseProfile setIsAuthenticated={setIsAuthenticated} />} />
        </Route>
        <Route path="/f/*" element={<Navigate to="/f" />} />
        <Route path="*" element={<Navigate to="/f" />} />
      </Routes>
    );
  }

  if (userRole === 'admin' && isMobile) {
    return (
      <Routes>
        <Route path="/" element={<AdminLayout setIsAuthenticated={setIsAuthenticated} />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="kyc" element={<KYC />} />
          <Route path="plans" element={<RentalPlans />} />
          <Route path="franchise" element={<Franchise />} />
          <Route path="assign-ev" element={<AssignEV />} />
          <Route path="documents" element={<Documents />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="content" element={<Content />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
          <Route path="payments" element={<Payments />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} setIsAuthenticated={setIsAuthenticated} userRole={userRole} />
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
      <div className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Navbar onMenuClick={toggleSidebar} setIsAuthenticated={setIsAuthenticated} userRole={userRole} />
        <div className="page-wrapper fade-in">
          <Routes>
            {userRole === 'admin' ? (
              <>
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
              </>
            ) : (
              <>
                <Route path="/f" element={<FranchiseDashboard />} />
                <Route path="/f/vehicles" element={<FranchiseVehicles />} />
                <Route path="/f/rides" element={<FranchiseRides />} />
                <Route path="/f/earnings" element={<FranchiseEarnings />} />
                <Route path="/f/customers" element={<FCustomers />} />
                <Route path="/f/kyc" element={<FKYC />} />
                <Route path="/f/dues" element={<FDues />} />
                <Route path="/f/reports" element={<FReports />} />
                <Route path="/f/notifications" element={<FNotifications />} />
                <Route path="/f/complaints" element={<FComplaints />} />
                <Route path="/f/profile" element={<FranchiseProfile setIsAuthenticated={setIsAuthenticated} />} />
                <Route path="*" element={<Navigate to="/f" />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
