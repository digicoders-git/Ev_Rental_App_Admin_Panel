import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, Search, Eye, CheckCircle, XCircle, Clock,
  Car, User, CreditCard, X, IndianRupee, Ban, CircleCheck,
  Activity, Loader, AlertTriangle, CalendarDays, CheckCircle2, Plus, Trash2, AlertOctagon
} from 'lucide-react';
import { getFranchiseBookings, approveBooking, rejectBooking, updateBookingStatus, payManual, returnVehicle, setupInstallments, payInstallment, addDamageCharge } from '../../services/apiServices';
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
  const [showInstallSetup, setShowInstallSetup] = useState(false);
  const [installRows, setInstallRows] = useState([{ amount: '', due_date: '' }]);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageForm, setDamageForm] = useState({ description: '', amount: '' });
  const [damageBookingId, setDamageBookingId] = useState(null);
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

  const handleSetupInstallments = () => {
    const valid = installRows.every(r => r.amount && r.due_date);
    if (!valid) return alert('Sabhi installments ka amount aur due date bharo');
    call(
      () => setupInstallments(selected._id, installRows.map(r => ({ amount: parseFloat(r.amount), due_date: r.due_date }))),
      (res) => {
        fetchBookings();
        setShowInstallSetup(false);
        setInstallRows([{ amount: '', due_date: '' }]);
        setSelected(prev => ({ ...prev, payment_installments: res.data.data }));
        alert('Installment schedule saved!');
      },
      (err) => alert(`Error: ${err}`)
    );
  };

  const handlePayInstallment = (instId) => {
    call(
      () => payInstallment(selected._id, instId, {}),
      () => { fetchBookings(); setSelected(null); alert('Installment paid!'); },
      (err) => alert(`Error: ${err}`)
    );
  };

  const addRow = () => setInstallRows(r => [...r, { amount: '', due_date: '' }]);
  const removeRow = (i) => setInstallRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i, f, v) => setInstallRows(r => r.map((row, idx) => idx === i ? { ...row, [f]: v } : row));

  const handleAddDamageCharge = () => {
    if (!damageForm.description.trim() || !damageForm.amount || Number(damageForm.amount) <= 0)
      return alert('Description aur valid amount dono required hain');
    call(
      () => addDamageCharge(damageBookingId, { description: damageForm.description.trim(), amount: Number(damageForm.amount) }),
      () => {
        fetchBookings();
        setShowDamageModal(false);
        setDamageForm({ description: '', amount: '' });
        setDamageBookingId(null);
      },
      (err) => alert(`Failed: ${err}`)
    );
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'N/A';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'N/A';

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
                  <th>Extra Charges</th>
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
                      <td>
                        {b.damage_charges?.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem' }}>
                              ₹{b.damage_charges.reduce((s, c) => s + c.amount, 0).toLocaleString()}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {b.damage_charges.length} charge{b.damage_charges.length > 1 ? 's' : ''}
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                              {b.damage_charges.map((ch, i) => (
                                <span key={i} style={{ fontSize: '0.68rem', color: '#92400e', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '4px', padding: '1px 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px', display: 'block' }}>
                                  ₹{ch.amount.toLocaleString()} — {ch.description}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
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
                          <button className="btn-icon" title="Add Extra Charge" style={{ color: '#f59e0b' }}
                            onClick={() => { setDamageBookingId(b._id); setDamageForm({ description: '', amount: '' }); setShowDamageModal(true); }}>
                            <AlertOctagon size={15} />
                          </button>
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
              <button className="btn-icon" onClick={() => { setSelected(null); setShowInstallSetup(false); setInstallRows([{ amount: '', due_date: '' }]); }}><X size={20} /></button>
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
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--primary)' }}>
                    <CreditCard size={14} /> Payment Details
                  </div>
                  {[
                    ['Grand Total', `₹${(selected.grand_total||0).toLocaleString()}`],
                    ['Total Paid',  `₹${(selected.total_paid||0).toLocaleString()}`],
                    ['Due Amount',  `₹${((selected.grand_total||0)-(selected.total_paid||0)).toLocaleString()}`],
                    ['Pay Status',  selected.payment_status],
                    ['Method',      selected.payment_method],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                      <span style={{ fontWeight: 600,
                        color: k === 'Due Amount' && (selected.grand_total - selected.total_paid) > 0 ? '#ef4444'
                             : k === 'Total Paid' ? '#10b981' : 'var(--text)'
                      }}>{v || 'N/A'}</span>
                    </div>
                  ))}
                  {/* Progress bar */}
                  {selected.grand_total > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <span>Payment Progress</span>
                        <span>{Math.round(((selected.total_paid||0) / selected.grand_total) * 100)}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '4px', background: (selected.total_paid||0) >= selected.grand_total ? '#10b981' : '#3b82f6', width: `${Math.min(100, Math.round(((selected.total_paid||0)/selected.grand_total)*100))}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}
                  {selected.next_installment && (
                    <div style={{ marginTop: '0.65rem', padding: '0.6rem 0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#92400e', letterSpacing: '0.04em' }}>Next Payment Due</div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginTop: '2px' }}>₹{selected.next_installment.amount.toLocaleString()}</div>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: selected.next_installment.status === 'overdue' ? '#ef4444' : '#92400e' }}>
                        {fmtDate(selected.next_installment.due_date)}
                        {selected.next_installment.status === 'overdue' && ' ⚠ Overdue'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Installment Schedule */}
              {((selected.grand_total||0) - (selected.total_paid||0)) > 0 && (
                <div style={{ marginTop: '1rem', border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface)', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em' }}>
                      <CalendarDays size={13} /> Installment Schedule
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => { setShowInstallSetup(s => !s); setInstallRows([{ amount: '', due_date: '' }]); }}>
                      <Plus size={13} /> {showInstallSetup ? 'Cancel' : 'Setup'}
                    </button>
                  </div>

                  {/* Setup form */}
                  {showInstallSetup && (
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Due: ₹{((selected.grand_total||0)-(selected.total_paid||0)).toLocaleString()} — split into installments
                      </p>
                      {installRows.map((row, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', minWidth: '24px' }}>#{i+1}</span>
                          <div className="inst-amount-field" style={{ flex: 1 }}>
                            <span className="inst-prefix">₹</span>
                            <input type="number" placeholder="Amount" value={row.amount}
                              onChange={e => updateRow(i, 'amount', e.target.value)}
                              className="inst-field-input" style={{ width: '100%' }} />
                          </div>
                          <input type="date" value={row.due_date}
                            onChange={e => updateRow(i, 'due_date', e.target.value)}
                            className="inst-date-input" style={{ flex: 1.2 }} />
                          {installRows.length > 1 && (
                            <button className="btn-icon" onClick={() => removeRow(i)}><Trash2 size={13} /></button>
                          )}
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <button className="btn btn-outline btn-sm" onClick={addRow}><Plus size={13} /> Add Row</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSetupInstallments} disabled={loading}>Save Schedule</button>
                      </div>
                    </div>
                  )}

                  {/* Installment list */}
                  {!showInstallSetup && selected.payment_installments?.length > 0 && (
                    <div>
                      {selected.payment_installments.map((inst) => (
                        <div key={inst._id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)',
                          background: inst.status === 'paid' ? '#f0fdf4' : inst.status === 'overdue' ? '#fef2f2' : 'inherit'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>#{inst.installment_no}</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>₹{inst.amount.toLocaleString()}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Due: {fmtDate(inst.due_date)}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className={`badge badge-icon ${ inst.status === 'paid' ? 'badge-success' : inst.status === 'overdue' ? 'badge-danger' : 'badge-warning' }`}>
                              {inst.status === 'paid' ? <CheckCircle2 size={11} /> : <Clock size={11} />} {inst.status}
                            </span>
                            {inst.status === 'paid' && inst.paid_date && (
                              <span style={{ fontSize: '0.72rem', color: '#10b981' }}>Paid {fmtDate(inst.paid_date)}</span>
                            )}
                            {inst.status !== 'paid' && (
                              <button className="btn btn-primary btn-sm" disabled={loading} onClick={() => handlePayInstallment(inst._id)}>Mark Paid</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showInstallSetup && (!selected.payment_installments || selected.payment_installments.length === 0) && (
                    <p style={{ padding: '1rem', margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                      No installment schedule set. Click Setup to create one.
                    </p>
                  )}

                  {/* Quick pay footer */}
                  <div style={{ padding: '0.75rem 1rem', background: '#fff7ed', borderTop: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#92400e', flex: '0 0 auto' }}>Quick Pay:</span>
                    <div className="inst-amount-field">
                      <span className="inst-prefix">₹</span>
                      <input type="number" placeholder="Amount" value={installmentAmount}
                        onChange={e => setInstallmentAmount(e.target.value)}
                        className="inst-field-input" />
                    </div>
                    <button className="btn btn-primary btn-sm" disabled={loading} onClick={() => handlePayment(selected._id, installmentAmount)}>
                      {loading ? <Loader size={13} className="spinner" /> : 'Record'}
                    </button>
                    <button className="btn btn-outline btn-sm" disabled={loading} onClick={() => handlePayment(selected._id, null)}>Pay All</button>
                  </div>
                </div>
              )}

              {/* Damage / Extra Charges History */}
              {selected.damage_charges?.length > 0 && (
                <div style={{ marginTop: '1rem', border: '1px solid #fed7aa', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#fff7ed', borderBottom: '1px solid #fed7aa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: '#ef4444', letterSpacing: '0.04em' }}>
                      <AlertOctagon size={13} /> Extra / Damage Charges
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>
                      Total: ₹{selected.damage_charges.reduce((s, c) => s + c.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  {selected.damage_charges.map((ch, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid #fed7aa', background: '#fffbf5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <AlertOctagon size={14} color="#f59e0b" />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e' }}>₹{Number(ch.amount).toLocaleString()}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{ch.description}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 600, textTransform: 'uppercase', background: '#fed7aa', padding: '2px 8px', borderRadius: '10px' }}>{ch.added_by}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{fmtDate(ch.createdAt)}</span>
                      </div>
                    </div>
                  ))}
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
              <button className="btn btn-outline" onClick={() => { setSelected(null); setShowInstallSetup(false); setInstallRows([{ amount: '', due_date: '' }]); }}>Close</button>
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
      {/* ── DAMAGE / EXTRA CHARGE MODAL ── */}
      {showDamageModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowDamageModal(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <AlertOctagon size={18} color="#f59e0b" />
                <h3 style={{ margin: 0 }}>Add Extra / Damage Charge</h3>
              </div>
              <button className="btn-icon" onClick={() => setShowDamageModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#92400e' }}>
                <strong>Booking:</strong> {bookings.find(b => b._id === damageBookingId)?.booking_id} &nbsp;|&nbsp;
                <strong>Customer:</strong> {bookings.find(b => b._id === damageBookingId)?.user?.name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Reason / Description *</label>
                  <input
                    type="text"
                    placeholder="e.g. Vehicle crash damage, Broken mirror, Tyre puncture..."
                    value={damageForm.description}
                    onChange={e => setDamageForm(f => ({ ...f, description: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>Charge Amount (₹) *</label>
                  <div className="inst-amount-field" style={{ width: '100%' }}>
                    <span className="inst-prefix">₹</span>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={damageForm.amount}
                      onChange={e => setDamageForm(f => ({ ...f, amount: e.target.value }))}
                      className="inst-field-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#dc2626' }}>
                  ⚠ This amount will be <strong>added to the booking's grand total</strong> and user will owe this extra amount.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDamageModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                onClick={handleAddDamageCharge}
                disabled={loading}
              >
                {loading ? <Loader size={15} className="spinner" /> : <><AlertOctagon size={15} /> Add Charge</>}
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
