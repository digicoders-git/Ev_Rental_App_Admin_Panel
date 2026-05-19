import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, Search, Eye, CheckCircle, XCircle, Clock,
  Car, User, CreditCard, X, IndianRupee, Ban, CircleCheck,
  Activity, Loader, AlertTriangle
} from 'lucide-react';
import { getFranchiseBookings, approveBooking, rejectBooking, updateBookingStatus, payManual, returnVehicle } from '../../services/apiServices';
import useApi from '../../services/useApi';

const STATUS_CONFIG = {
  confirmed: { cls: 'badge-success', label: 'Active',    icon: <CircleCheck size={12} /> },
  ongoing:   { cls: 'badge-info',    label: 'Ongoing',   icon: <Activity size={12} /> },
  completed: { cls: 'badge-secondary', label: 'Completed', icon: <CheckCircle size={12} /> },
  pending:   { cls: 'badge-warning', label: 'Pending',   icon: <Clock size={12} /> },
  cancelled: { cls: 'badge-danger',  label: 'Cancelled', icon: <Ban size={12} /> },
};

const TABS = ['All', 'pending', 'confirmed', 'ongoing', 'completed', 'cancelled'];
const PAGE_SIZE = 10;

const FRides = () => {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState(null);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const { loading, call } = useApi();

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = () => {
    call(() => getFranchiseBookings(), (res) => {
      setBookings(res.data || []);
    });
  };

  const filtered = bookings.filter(b => {
    const matchTab = activeTab === 'All' || b.booking_status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      (b.booking_id || '').toLowerCase().includes(q) ||
      (b.user?.name || '').toLowerCase().includes(q) ||
      (b.vehicle?.vehicle_name || '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? bookings.length : bookings.filter(b => b.booking_status === t).length;
    return acc;
  }, {});

  const handleAction = (id, action) => {
    const fnMap = {
      approve: () => approveBooking(id),
      reject:  () => rejectBooking(id, { reason: 'Rejected by franchise' }),
      complete: () => returnVehicle(id),
    };
    call(fnMap[action], () => {
      fetchBookings();
      setSelected(null);
      setConfirmAction(null);
    }, (err) => alert(`Error: ${err}`));
  };

  const handlePayment = (id, amount) => {
    const payload = amount ? { amount: parseFloat(amount) } : {};
    call(() => payManual(id, payload), () => {
      fetchBookings();
      setSelected(null);
      setInstallmentAmount('');
    }, (err) => alert(`Error: ${err}`));
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'N/A';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Ride Management</h1>
          <p>Manage all bookings for your franchise vehicles.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', val: bookings.length, color: '#3b82f6', bg: '#dbeafe' },
          { label: 'Pending', val: counts.pending, color: '#92400e', bg: '#fef3c7' },
          { label: 'Active', val: counts.confirmed + counts.ongoing, color: '#065f46', bg: '#d1fae5' },
          { label: 'Completed', val: counts.completed, color: '#5b21b6', bg: '#ede9fe' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ color: s.color, margin: 0 }}>{s.val}</h2>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="filter-tabs">
            {TABS.map(t => (
              <button key={t} className={`filter-tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => { setActiveTab(t); setPage(1); }}>
                {t === 'All' ? 'All' : STATUS_CONFIG[t]?.label || t}
                <span className="tab-count">{counts[t]}</span>
              </button>
            ))}
          </div>
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Search ID, customer, vehicle..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
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
                  <th>Duration</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={28} style={{ display: 'block', margin: '0 auto 0.5rem' }} />
                    No bookings found.
                  </td></tr>
                ) : paginated.map(b => {
                  const cfg = STATUS_CONFIG[b.booking_status] || STATUS_CONFIG.pending;
                  const dueAmt = (b.grand_total || 0) - (b.total_paid || 0);
                  const diffHrs = Math.abs(new Date(b.end_date) - new Date(b.start_date)) / 36e5;
                  const duration = diffHrs < 24 ? `${Math.ceil(diffHrs)} hrs` : `${Math.ceil(diffHrs / 24)} days`;
                  return (
                    <tr key={b._id}>
                      <td><span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>{b.booking_id || 'N/A'}</span></td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{b.user?.name || 'N/A'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.user?.mobile}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{b.vehicle?.vehicle_name || 'N/A'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.vehicle?.registration_number}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{duration}</td>
                      <td style={{ fontWeight: 600 }}>₹{(b.grand_total || 0).toLocaleString()}</td>
                      <td style={{ color: '#10b981', fontWeight: 600 }}>₹{(b.total_paid || 0).toLocaleString()}</td>
                      <td style={{ color: dueAmt > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>₹{dueAmt.toLocaleString()}</td>
                      <td><span className={`badge ${cfg.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{cfg.icon}{cfg.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn-icon" title="View" onClick={() => setSelected(b)}><Eye size={15} /></button>
                          {b.booking_status === 'pending' && (
                            <>
                              <button className="btn-icon approve" title="Approve"
                                onClick={() => setConfirmAction({ id: b._id, action: 'approve', label: 'Approve' })}><CheckCircle size={15} /></button>
                              <button className="btn-icon reject" title="Reject"
                                onClick={() => setConfirmAction({ id: b._id, action: 'reject', label: 'Reject' })}><XCircle size={15} /></button>
                            </>
                          )}
                          {(b.booking_status === 'confirmed' || b.booking_status === 'ongoing') && (
                            <button className="btn-icon" title="Mark Complete" style={{ color: '#8b5cf6' }}
                              onClick={() => setConfirmAction({ id: b._id, action: 'complete', label: 'Complete' })}><CircleCheck size={15} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="bk-pagination">
            <span className="bk-page-info">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="bk-page-btns">
              <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-num-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selected && createPortal(
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content bk-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>{selected.booking_id}</span>
                <span className={`badge ${STATUS_CONFIG[selected.booking_status]?.cls}`}>{STATUS_CONFIG[selected.booking_status]?.label}</span>
              </div>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Customer */}
                <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    <User size={14} color="var(--primary)" /> Customer Info
                  </div>
                  {[['Name', selected.user?.name], ['Mobile', selected.user?.mobile], ['Email', selected.user?.email]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                      <span style={{ fontWeight: 500 }}>{v || 'N/A'}</span>
                    </div>
                  ))}
                </div>
                {/* Vehicle */}
                <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    <Car size={14} color="var(--primary)" /> Vehicle Info
                  </div>
                  {[['Vehicle', selected.vehicle?.vehicle_name], ['Reg No.', selected.vehicle?.registration_number], ['Plan', selected.plan?.plan_name]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                      <span style={{ fontWeight: 500 }}>{v || 'N/A'}</span>
                    </div>
                  ))}
                </div>
                {/* Booking */}
                <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    <Calendar size={14} color="var(--primary)" /> Booking Details
                  </div>
                  {[['Start', fmt(selected.start_date)], ['End', fmt(selected.end_date)], ['Pickup', selected.pickup_location]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                      <span style={{ fontWeight: 500 }}>{v || 'N/A'}</span>
                    </div>
                  ))}
                </div>
                {/* Payment */}
                <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    <CreditCard size={14} color="var(--primary)" /> Payment Details
                  </div>
                  {[
                    ['Grand Total', `₹${(selected.grand_total||0).toLocaleString()}`],
                    ['Paid', `₹${(selected.total_paid||0).toLocaleString()}`],
                    ['Due', `₹${((selected.grand_total||0)-(selected.total_paid||0)).toLocaleString()}`],
                    ['Method', selected.payment_method],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                      <span style={{ fontWeight: 600 }}>{v || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Due Payment Collection */}
              {((selected.grand_total || 0) - (selected.total_paid || 0)) > 0 && (
                <div style={{ marginTop: '1rem', background: '#fff7ed', border: '1px solid #fed7aa', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#92400e', fontSize: '0.9rem' }}>
                    <IndianRupee size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    Collect Payment
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="number" placeholder="Amount (leave empty to pay all)"
                      value={installmentAmount} onChange={e => setInstallmentAmount(e.target.value)}
                      style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.875rem' }} />
                    <button className="btn btn-primary btn-sm" disabled={loading}
                      onClick={() => handlePayment(selected._id, installmentAmount)}>
                      {loading ? <Loader size={14} className="spinner" /> : 'Record'}
                    </button>
                    <button className="btn btn-outline btn-sm" disabled={loading}
                      onClick={() => handlePayment(selected._id, null)}>Pay All</button>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selected.booking_status === 'pending' && (
                <>
                  <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }}
                    onClick={() => { setConfirmAction({ id: selected._id, action: 'reject', label: 'Reject' }); setSelected(null); }}>
                    <XCircle size={15} /> Reject
                  </button>
                  <button className="btn btn-primary"
                    onClick={() => { setConfirmAction({ id: selected._id, action: 'approve', label: 'Approve' }); setSelected(null); }}>
                    <CheckCircle size={15} /> Approve
                  </button>
                </>
              )}
              {selected.booking_status === 'confirmed' && (
                <button className="btn btn-primary"
                  onClick={() => { setConfirmAction({ id: selected._id, action: 'complete', label: 'Complete' }); setSelected(null); }}>
                  <CircleCheck size={15} /> Mark Completed
                </button>
              )}
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Action Modal */}
      {confirmAction && createPortal(
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{confirmAction.label} Booking</h3>
              <button className="btn-icon" onClick={() => setConfirmAction(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-body">
                <div className={`delete-icon-wrap ${confirmAction.action === 'approve' || confirmAction.action === 'complete' ? 'approve-icon' : ''}`}>
                  {confirmAction.action === 'approve' || confirmAction.action === 'complete' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                </div>
                <p>Are you sure you want to <strong>{confirmAction.label}</strong> this booking?</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button
                className={`btn ${confirmAction.action === 'reject' ? 'btn-danger' : 'btn-primary'}`}
                disabled={loading}
                onClick={() => handleAction(confirmAction.id, confirmAction.action)}>
                {loading ? <Loader size={15} className="spinner" /> : `Yes, ${confirmAction.label}`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FRides;
