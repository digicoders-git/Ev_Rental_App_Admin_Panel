import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Users, IndianRupee, TrendingUp, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { getFranchiseBookings, getMyFranchiseVehicles, getFranchiseRevenue } from '../../services/apiServices';

const FDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [bRes, vRes, rRes] = await Promise.allSettled([
          getFranchiseBookings(),
          getMyFranchiseVehicles(),
          getFranchiseRevenue()
        ]);
        if (bRes.status === 'fulfilled') setBookings(bRes.value.data?.data || []);
        if (vRes.status === 'fulfilled') setVehicles(vRes.value.data?.data || []);
        if (rRes.status === 'fulfilled') setRevenue(rRes.value.data?.data?.stats || null);
      } catch (e) { /* silently fail */ }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const activeCount = bookings.filter(b => ['confirmed', 'ongoing'].includes(b.booking_status)).length;
  const pendingCount = bookings.filter(b => b.booking_status === 'pending').length;
  const completedCount = bookings.filter(b => b.booking_status === 'completed').length;

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const getStatusBadge = (status) => {
    const map = {
      confirmed: 'badge-success', ongoing: 'badge-info',
      completed: 'badge-secondary', pending: 'badge-warning', cancelled: 'badge-danger'
    };
    return map[status] || 'badge-warning';
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = 'translateY(-3px)';
    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
    e.currentTarget.style.borderColor = 'var(--primary)';
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.borderColor = 'var(--border)';
  };

  const cardStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid var(--border)',
    borderRadius: '12px'
  };

  if (loading) return (
    <div className="page-header" style={{ justifyContent: 'center', minHeight: '200px', alignItems: 'center' }}>
      <Loader size={32} className="spinner" color="var(--primary)" />
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Welcome, {userData?.owner_name || 'Franchise Partner'} 👋</h1>
          <p>{userData?.store_name} • {userData?.city}, {userData?.state}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Total Fleet */}
        <div 
          className="card" 
          style={cardStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => navigate('/f/vehicles')}
        >
          <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '12px' }}><Bike size={22} /></div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>Total Fleet</p>
            <h2 style={{ margin: 0, fontWeight: 700 }}>{vehicles.length}</h2>
          </div>
        </div>

        {/* Active Rides */}
        <div 
          className="card" 
          style={cardStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => navigate('/f/rides')}
        >
          <div style={{ background: '#dbeafe', color: '#1e40af', padding: '12px', borderRadius: '12px' }}><TrendingUp size={22} /></div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>Active Rides</p>
            <h2 style={{ margin: 0, fontWeight: 700 }}>{activeCount}</h2>
          </div>
        </div>

        {/* Pending Approval */}
        <div 
          className="card" 
          style={cardStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => navigate('/f/rides')}
        >
          <div style={{ background: '#fef3c7', color: '#92400e', padding: '12px', borderRadius: '12px' }}><Clock size={22} /></div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>Pending</p>
            <h2 style={{ margin: 0, fontWeight: 700 }}>{pendingCount}</h2>
          </div>
        </div>

        {/* Total Revenue */}
        <div 
          className="card" 
          style={cardStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => navigate('/f/earnings')}
        >
          <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px', borderRadius: '12px' }}><IndianRupee size={22} /></div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>Total Revenue</p>
            <h2 style={{ margin: 0, fontWeight: 700 }}>₹{(revenue?.totalRevenue || 0).toLocaleString()}</h2>
          </div>
        </div>

        {/* Completed */}
        <div 
          className="card" 
          style={cardStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => navigate('/f/rides')}
        >
          <div style={{ background: '#ede9fe', color: '#5b21b6', padding: '12px', borderRadius: '12px' }}><CheckCircle size={22} /></div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>Completed</p>
            <h2 style={{ margin: 0, fontWeight: 700 }}>{completedCount}</h2>
          </div>
        </div>

        {/* Average Booking */}
        <div 
          className="card" 
          style={cardStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => navigate('/f/earnings')}
        >
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '12px' }}><AlertCircle size={22} /></div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>Avg. Booking</p>
            <h2 style={{ margin: 0, fontWeight: 700 }}>₹{Math.round(revenue?.averageBookingValue || 0).toLocaleString()}</h2>
          </div>
        </div>

      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="page-header" style={{ paddingBottom: '1rem', marginBottom: '0' }}>
          <h3>Recent Bookings</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Start Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No bookings found</td></tr>
              ) : recentBookings.map(b => (
                <tr key={b._id}>
                  <td><span style={{ fontWeight: 600, color: 'var(--primary)' }}>{b.booking_id || 'N/A'}</span></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{b.user?.name || 'N/A'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.user?.mobile}</div>
                  </td>
                  <td>{b.vehicle?.vehicle_name || 'N/A'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(b.start_date).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{(b.grand_total || 0).toLocaleString()}</td>
                  <td><span className={`badge ${getStatusBadge(b.booking_status)}`}>{b.booking_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FDashboard;
