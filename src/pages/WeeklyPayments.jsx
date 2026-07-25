import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Loader2, CheckCircle, 
  Clock, AlertTriangle, AlertCircle, CalendarDays,
  IndianRupee, Activity
} from 'lucide-react';
import { getAllBookings, payInstallment } from '../services/apiServices';
import useApi from '../services/useApi';
import './Bookings.css'; // Reuse existing styles

const WeeklyPayments = () => {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const { loading, error, call } = useApi();
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchActiveInstallmentBookings();
  }, []);

  const fetchActiveInstallmentBookings = async () => {
    try {
      // Fetch all bookings and filter on frontend for simplicity
      call(
        () => getAllBookings(),
        (data) => {
          if (data?.data) {
            // Filter bookings that have installments AND are not completed/cancelled
            const activeInst = data.data.filter(b => 
              (b.booking_status === 'pending' || b.booking_status === 'ongoing' || b.booking_status === 'confirmed') &&
              b.payment_installments && b.payment_installments.length > 0
            );
            // Sort by next installment due date (earliest first)
            activeInst.sort((a, b) => {
              if (!a.next_installment) return 1;
              if (!b.next_installment) return -1;
              return new Date(a.next_installment.due_date) - new Date(b.next_installment.due_date);
            });
            setBookings(activeInst);
          }
        }
      );
    } catch (error) {
      console.error("Failed to load installments:", error);
    }
  };

  const handlePayInstallment = async (bookingId, instId) => {
    if (!window.confirm('Are you sure you want to mark this week as Paid?')) return;
    try {
      setProcessingId(instId);
      await payInstallment(bookingId, instId, {});
      alert('Installment marked as paid successfully!');
      fetchActiveInstallmentBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process payment');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (!search) return true;
    const s = search.toLowerCase();
    return b.booking_id?.toLowerCase().includes(s) ||
           b.user?.name?.toLowerCase().includes(s) ||
           b.user?.mobile?.includes(s) ||
           b.vehicle?.registration_number?.toLowerCase().includes(s);
  });

  const getStatusBadge = (status) => {
    if (status === 'paid') return <span className="badge badge-success" style={{ padding: '4px 8px' }}><CheckCircle size={12}/> Paid</span>;
    if (status === 'overdue') return <span className="badge badge-danger" style={{ padding: '4px 8px' }}><AlertTriangle size={12}/> Overdue</span>;
    return <span className="badge badge-warning" style={{ padding: '4px 8px' }}><Clock size={12}/> Pending</span>;
  };

  return (
    <div className="bookings-page fade-in">
      <div className="page-header">
        <div>
          <h1>Weekly Payments Tracker</h1>
          <p>Track 2-3 months scooty rentals and their weekly payments.</p>
        </div>
        <div className="header-actions">
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search rider, booking ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ padding: '0.85rem 1.2rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', marginBottom: '1.25rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 500 }}>
        <span>ℹ️ <b>Rent Collection Policy:</b> All drivers pay rent 100% online (UPI, Card, Net Banking) via Driver App. Super Admin and Franchisee have viewing access only; manual rent collection and "Mark as Paid" overrides are disabled.</span>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loading && bookings.length === 0 ? (
        <div className="cp-page-loading">
          <Loader2 className="spinner" size={40} />
          <p>Loading Weekly Payments...</p>
        </div>
      ) : (
        <div className="grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredBookings.length === 0 ? (
            <div className="empty-state card">
              <CalendarDays size={48} className="text-muted" style={{ marginBottom: '1rem' }} />
              <h3>No Active Schedules</h3>
              <p>There are currently no active long-term rentals with weekly installments.</p>
            </div>
          ) : (
            filteredBookings.map(booking => (
              <div key={booking._id} className="card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {booking.user?.name || 'Unknown User'} 
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>({booking.user?.mobile})</span>
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{booking.booking_id}</span> • 
                      {booking.vehicle?.vehicle_name} ({booking.vehicle?.registration_number})
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#64748b' }}>Total Due Amount</p>
                    <h2 style={{ margin: 0, color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>
                      ₹{booking.payment_installments
                          .filter(i => i.status !== 'paid')
                          .reduce((sum, i) => sum + i.amount, 0)
                          .toLocaleString()}
                    </h2>
                  </div>
                </div>

                <div className="installments-grid" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {booking.payment_installments.map(inst => {
                    const isPaid = inst.status === 'paid';
                    const isOverdue = inst.status === 'overdue';
                    const isPending = inst.status === 'pending';
                    
                    return (
                      <div key={inst._id} style={{ 
                        minWidth: '220px', 
                        padding: '1.25rem', 
                        borderRadius: '12px',
                        border: '1px solid',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        backgroundColor: isPaid ? '#f0fdf4' : isOverdue ? '#fef2f2' : isPending ? '#fffbeb' : '#f8fafc',
                        borderColor: isPaid ? '#bbf7d0' : isOverdue ? '#fecaca' : isPending ? '#fde68a' : '#e2e8f0',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>Week {inst.installment_no}</span>
                          {getStatusBadge(inst.status)}
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>
                          ₹{inst.amount.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CalendarDays size={14} /> 
                          Due: {new Date(inst.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        
                        {!isPaid && (
                          <div style={{ marginTop: 'auto', background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', borderRadius: '6px', textAlign: 'center', fontWeight: 600, padding: '8px', fontSize: '0.82rem' }}>
                            ⏳ Pending (Online Only)
                          </div>
                        )}
                        {isPaid && (
                          <div style={{ marginTop: 'auto', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.82rem', color: '#166534', textAlign: 'center', fontWeight: 600, padding: '8px', borderRadius: '6px' }}>
                            ✅ Paid Online ({new Date(inst.paid_date || inst.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyPayments;
