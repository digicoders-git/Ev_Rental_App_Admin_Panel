import React, { useState, useEffect } from 'react';
import { BarChart2, IndianRupee, Calendar, TrendingUp, CheckCircle, Loader } from 'lucide-react';
import { getFranchiseBookings, getFranchiseRevenue } from '../../services/apiServices';
import useApi from '../../services/useApi';

const FReports = () => {
  const [bookings, setBookings] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const { loading, call } = useApi();

  useEffect(() => {
    const fetchAll = async () => {
      await Promise.allSettled([
        new Promise(resolve => call(() => getFranchiseBookings(), (res) => { setBookings(res.data || []); resolve(); })),
        new Promise(resolve => call(() => getFranchiseRevenue(), (res) => { setRevenue(res.data); resolve(); })),
      ]);
    };
    fetchAll();
  }, []);

  // Group bookings by period
  const groupByPeriod = (bookings, period) => {
    const groups = {};
    bookings.filter(b => b.booking_status === 'completed').forEach(b => {
      const date = new Date(b.updatedAt || b.createdAt);
      let key;
      if (period === 'daily') {
        key = date.toLocaleDateString('en-IN');
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `Week of ${weekStart.toLocaleDateString('en-IN')}`;
      } else {
        key = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      }
      if (!groups[key]) groups[key] = { rides: 0, revenue: 0, paid: 0 };
      groups[key].rides++;
      groups[key].revenue += b.grand_total || 0;
      groups[key].paid += b.total_paid || 0;
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const groupedData = groupByPeriod(bookings, period);
  const completedBookings = bookings.filter(b => b.booking_status === 'completed');
  const totalRevenue = completedBookings.reduce((s, b) => s + (b.grand_total || 0), 0);
  const maxRevenue = groupedData.reduce((max, [, d]) => Math.max(max, d.revenue), 0) || 1;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Revenue and ride performance reports for your franchise.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['daily', 'weekly', 'monthly'].map(p => (
            <button key={p} className={`btn ${period === p ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPeriod(p)} style={{ textTransform: 'capitalize' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: '#10b981', bg: '#d1fae5', icon: <IndianRupee size={20} /> },
          { label: 'Total Rides', value: bookings.length, color: '#3b82f6', bg: '#dbeafe', icon: <Calendar size={20} /> },
          { label: 'Completed', value: completedBookings.length, color: '#8b5cf6', bg: '#ede9fe', icon: <CheckCircle size={20} /> },
          { label: 'Avg. Ride Value', value: `₹${Math.round(totalRevenue / (completedBookings.length || 1)).toLocaleString()}`, color: '#f59e0b', bg: '#fef3c7', icon: <TrendingUp size={20} /> },
        ].map(s => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: s.bg, color: s.color, padding: '10px', borderRadius: '10px', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.label}</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart (CSS-based) */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', textTransform: 'capitalize' }}>{period} Revenue Chart</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><Loader size={28} className="spinner" color="var(--primary)" /></div>
        ) : groupedData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No completed rides in this period yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', minHeight: '180px', paddingBottom: '8px', minWidth: `${groupedData.length * 80}px` }}>
              {groupedData.slice(0, 12).reverse().map(([label, data]) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>₹{Math.round(data.revenue / 1000)}K</div>
                  <div style={{
                    width: '100%',
                    height: `${Math.max(12, (data.revenue / maxRevenue) * 150)}px`,
                    background: 'linear-gradient(to top, #10b981, #34d399)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.3s ease',
                    minWidth: '40px',
                  }} title={`₹${data.revenue.toLocaleString()}`} />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '64px', wordBreak: 'break-word' }}>{label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{data.rides} rides</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Table */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>Detailed {period} Report</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Completed Rides</th>
                <th>Revenue</th>
                <th>Amount Collected</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {groupedData.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No data available.</td></tr>
              ) : groupedData.map(([label, data]) => (
                <tr key={label}>
                  <td style={{ fontWeight: 600 }}>{label}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{data.rides}</td>
                  <td style={{ fontWeight: 700, color: '#10b981' }}>₹{data.revenue.toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: '#3b82f6' }}>₹{data.paid.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(data.revenue / maxRevenue) * 100}%`, background: '#10b981', borderRadius: '999px' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {Math.round((data.revenue / maxRevenue) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FReports;
