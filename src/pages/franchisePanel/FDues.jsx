import React, { useState, useEffect } from 'react';
import { AlertCircle, IndianRupee, Loader, Search } from 'lucide-react';
import { getFranchiseBookings } from '../../services/apiServices';
import useApi from '../../services/useApi';

const FDues = () => {
  const [dues, setDues] = useState([]);
  const [search, setSearch] = useState('');
  const { loading, call } = useApi();

  useEffect(() => {
    call(() => getFranchiseBookings(), (res) => {
      const bookings = res.data || [];
      const dueList = bookings
        .filter(b => (b.grand_total || 0) > (b.total_paid || 0) && b.booking_status !== 'cancelled')
        .map(b => ({
          ...b,
          due_amount: (b.grand_total || 0) - (b.total_paid || 0),
          isOverdue: new Date(b.end_date) < new Date() && b.booking_status !== 'completed',
        }));
      setDues(dueList);
    });
  }, []);

  const filtered = dues.filter(d =>
    (d.booking_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.user?.mobile || '').includes(search)
  );

  const totalDue = filtered.reduce((s, d) => s + d.due_amount, 0);
  const overdueDues = filtered.filter(d => d.isOverdue);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Due Payments</h1>
          <p>Track all pending and overdue payments for your franchise.</p>
        </div>
      </div>

      <div style={{ padding: '0.85rem 1.2rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', marginBottom: '1.25rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 500 }}>
        <span>🔒 <b>Online Payment Policy:</b> Drivers must pay their due rent online directly through the Driver App (UPI, Card, Net Banking). Franchisees cannot receive cash or manually mark rent payments as completed.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', borderLeft: '3px solid #ef4444' }}>
          <h2 style={{ color: '#ef4444', margin: 0 }}>₹{totalDue.toLocaleString()}</h2>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Total Outstanding</p>
        </div>
        <div className="card" style={{ textAlign: 'center', borderLeft: '3px solid #f59e0b' }}>
          <h2 style={{ color: '#f59e0b', margin: 0 }}>{dues.length}</h2>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Pending Bookings</p>
        </div>
        <div className="card" style={{ textAlign: 'center', borderLeft: '3px solid #dc2626' }}>
          <h2 style={{ color: '#dc2626', margin: 0 }}>{overdueDues.length}</h2>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Overdue</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3>Due Payments List</h3>
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Search booking ID, name, mobile..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><Loader size={28} className="spinner" color="var(--primary)" /></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>End Date</th>
                  <th>Grand Total</th>
                  <th>Paid</th>
                  <th>Due Amount</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    <AlertCircle size={28} style={{ display: 'block', margin: '0 auto 0.5rem', color: '#10b981' }} />
                    No pending dues. All payments are cleared! 🎉
                  </td></tr>
                ) : filtered.map(d => (
                  <tr key={d._id} style={{ background: d.isOverdue ? '#fff5f5' : 'inherit' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {d.isOverdue && <AlertCircle size={14} color="#ef4444" />}
                        <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>{d.booking_id || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{d.user?.name || 'N/A'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{d.user?.mobile}</div>
                    </td>
                    <td>{d.vehicle?.vehicle_name || 'N/A'}</td>
                    <td style={{ fontSize: '0.85rem', color: d.isOverdue ? '#ef4444' : 'var(--text-secondary)' }}>
                      {new Date(d.end_date).toLocaleDateString('en-IN')}
                      {d.isOverdue && <span style={{ marginLeft: '4px', fontSize: '0.75rem', fontWeight: 600 }}>(Overdue)</span>}
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{(d.grand_total || 0).toLocaleString()}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>₹{(d.total_paid || 0).toLocaleString()}</td>
                    <td style={{ color: '#ef4444', fontWeight: 700, fontSize: '1rem' }}>₹{d.due_amount.toLocaleString()}</td>
                    <td>
                      {(() => {
                        const isInstallment = d.payment_method === 'installments';
                        const allInst = d.payment_installments || [];
                        const allPaid = isInstallment
                          ? allInst.length > 0 && allInst.every(i => i.status === 'paid')
                          : d.due_amount <= 0;
                        return allPaid ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
                            ✅ Paid
                          </span>
                        ) : (
                          <span className={`badge ${d.isOverdue ? 'badge-danger' : 'badge-warning'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {d.isOverdue ? '⚠ Overdue' : '⏳ Payment Pending'}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff5f5', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 600 }}>
              <IndianRupee size={18} /> Total Outstanding: ₹{totalDue.toLocaleString()}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{filtered.length} bookings with pending payment</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FDues;
