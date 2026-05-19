import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Calendar, ArrowDownRight, Loader } from 'lucide-react';
import { getFranchiseRevenue, getFranchiseBookings } from '../../services/apiServices';

const FEarnings = () => {
  const [revenue, setRevenue] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [rRes, bRes] = await Promise.allSettled([
          getFranchiseRevenue(),
          getFranchiseBookings()
        ]);
        if (rRes.status === 'fulfilled') setRevenue(rRes.value.data?.data);
        if (bRes.status === 'fulfilled') setBookings(bRes.value.data?.data || []);
      } catch (e) { /* silently fail */ }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const completedPaidBookings = bookings.filter(b => b.booking_status === 'completed');
  const pendingPayments = bookings.filter(b => (b.grand_total - (b.total_paid || 0)) > 0 && b.booking_status !== 'cancelled');

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <Loader size={32} className="spinner" color="var(--primary)" />
    </div>
  );

  const stats = revenue?.stats || {};
  const totalRevenue = stats.totalRevenue || 0;
  const totalBookings = stats.totalBookings || 0;
  const totalLateFees = stats.totalLateFees || 0;
  const avgBookingValue = Math.round(stats.averageBookingValue || 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Earnings Overview</h1>
          <p>Track your franchise revenue and transactions.</p>
        </div>
      </div>

      {/* Main Revenue Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', marginBottom: '1.5rem', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ opacity: 0.9, color: 'white', marginBottom: '0.5rem' }}>Total Revenue (All Time)</p>
            <h1 style={{ color: 'white', fontSize: '2.5rem', margin: 0 }}>₹{totalRevenue.toLocaleString()}</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              From {totalBookings} completed & paid rides
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
              <TrendingUp size={32} color="white" />
              <p style={{ color: 'white', margin: '4px 0 0', fontSize: '0.85rem' }}>Active Franchise</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <IndianRupee size={22} color="#10b981" style={{ margin: '0 auto 8px' }} />
          <h3 style={{ color: 'var(--primary)', margin: 0 }}>₹{avgBookingValue.toLocaleString()}</h3>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>Avg. Booking Value</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <Calendar size={22} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
          <h3 style={{ color: '#f59e0b', margin: 0 }}>{totalBookings}</h3>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>Paid Bookings</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <ArrowDownRight size={22} color="#ef4444" style={{ margin: '0 auto 8px' }} />
          <h3 style={{ color: '#ef4444', margin: 0 }}>₹{totalLateFees.toLocaleString()}</h3>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>Late Fee Collected</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <TrendingUp size={22} color="#8b5cf6" style={{ margin: '0 auto 8px' }} />
          <h3 style={{ color: '#8b5cf6', margin: 0 }}>₹{pendingPayments.reduce((s, b) => s + ((b.grand_total||0) - (b.total_paid||0)), 0).toLocaleString()}</h3>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>Pending Dues</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Transaction History (Completed & Paid)</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Completed On</th>
                <th>Base Amount</th>
                <th>Late Fee</th>
                <th>Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {completedPaidBookings.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No completed paid transactions yet.
                </td></tr>
              ) : completedPaidBookings.map(b => (
                <tr key={b._id}>
                  <td><span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>{b.booking_id || 'N/A'}</span></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{b.user?.name || 'N/A'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.user?.mobile}</div>
                  </td>
                  <td>{b.vehicle?.vehicle_name || 'N/A'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {b.actual_return_date ? new Date(b.actual_return_date).toLocaleDateString('en-IN') : new Date(b.updatedAt).toLocaleDateString('en-IN')}
                  </td>
                  <td>₹{(b.total_amount || 0).toLocaleString()}</td>
                  <td style={{ color: b.late_fee > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                    ₹{(b.late_fee || 0).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 700, color: '#10b981' }}>₹{(b.grand_total || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Dues */}
      {pendingPayments.length > 0 && (
        <div className="card" style={{ marginTop: '1rem', borderLeft: '3px solid #f59e0b' }}>
          <h3 style={{ marginBottom: '1rem', color: '#92400e' }}>⚠️ Pending Payments</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Grand Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map(b => (
                  <tr key={b._id}>
                    <td><span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>{b.booking_id || 'N/A'}</span></td>
                    <td>{b.user?.name || 'N/A'}</td>
                    <td>₹{(b.grand_total || 0).toLocaleString()}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>₹{(b.total_paid || 0).toLocaleString()}</td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>₹{((b.grand_total||0)-(b.total_paid||0)).toLocaleString()}</td>
                    <td><span className="badge badge-warning">{b.booking_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FEarnings;
