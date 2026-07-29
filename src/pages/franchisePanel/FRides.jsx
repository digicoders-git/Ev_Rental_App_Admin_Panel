import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, Search, Eye, CheckCircle, XCircle, Clock,
  Car, User, CreditCard, X, Ban, CircleCheck,
  Activity, Loader, AlertTriangle, CalendarDays, CheckCircle2, AlertOctagon,
  Receipt, Download, RefreshCw, Info
} from 'lucide-react';
import { getFranchiseBookings, approveBooking, rejectBooking, updateBookingStatus, payManual, returnVehicle, payInstallment, addDamageCharge , getInvoiceByBooking, changeBookingVehicle, getMyFranchiseVehicles } from '../../services/apiServices';
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
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageForm, setDamageForm] = useState({ description: '', amount: '' });
  const [damageBookingId, setDamageBookingId] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceList, setInvoiceList] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedSwapVehicle, setSelectedSwapVehicle] = useState('');
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

  const handlePayInstallment = (instId) => {
    call(
      () => payInstallment(selected._id, instId, {}),
      () => { fetchBookings(); setSelected(null); alert('Installment paid!'); },
      (err) => alert(`Error: ${err}`)
    );
  };

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

  const handleViewBill = async (bookingId) => {
    try {
      setLoadingInvoice(true);
      setShowInvoiceModal(true);
      const res = await getInvoiceByBooking(bookingId);
      setInvoiceList(res.data.data || []);
      if (res.data.data && res.data.data.length === 1) {
        setSelectedInvoice(res.data.data[0]);
      } else {
        setSelectedInvoice(null);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load invoices");
      setShowInvoiceModal(false);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const openSwapModal = () => {
    call(() => getMyFranchiseVehicles(), (res) => {
      const activeAvail = (res.data || []).filter(v => v.status === 'active' && !v.is_busy);
      setAvailableVehicles(activeAvail);
      setSelectedSwapVehicle('');
      setShowSwapModal(true);
    });
  };

  const handleSwapSubmit = () => {
    if (!selectedSwapVehicle) return alert('Please select a vehicle');
    call(() => changeBookingVehicle(selected._id, selectedSwapVehicle), () => {
      setShowSwapModal(false);
      setSelected(null);
      fetchBookings();
    }, (err) => alert(err || 'Failed to swap vehicle'));
  };

  const printInvoice = (inv) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Invoice ${inv.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; display: flex; justify-content: center; padding: 32px; }
          .invoice { background: #fff; width: 600px; border-radius: 16px; box-shadow: 0 8px 40px rgba(0,0,0,0.12); overflow: hidden; }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #10b981 100%); padding: 28px; position: relative; overflow: hidden; }
          .header::before { content: ''; position: absolute; top: -30px; right: -30px; width: 130px; height: 130px; border-radius: 50%; background: rgba(255,255,255,0.05); }
          .header-row { display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 1; }
          .receipt-label { color: rgba(255,255,255,0.55); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
          .invoice-num { color: #fff; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
          .company-name { color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px; }
          .status-row { margin-top: 16px; position: relative; z-index: 1; display: flex; align-items: center; gap: 14px; }
          .status-badge { display: inline-flex; align-items: center; gap: 6px; border-radius: 20px; padding: 5px 14px;
            background: ${inv.status === 'paid' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'};
            border: 1px solid ${inv.status === 'paid' ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)'}; }
          .status-dot { width: 7px; height: 7px; border-radius: 50%; background: ${inv.status === 'paid' ? '#10b981' : '#f59e0b'}; }
          .status-text { color: ${inv.status === 'paid' ? '#10b981' : '#f59e0b'}; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
          .date-text { color: rgba(255,255,255,0.4); font-size: 12px; }
          .body { padding: 24px 28px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .info-card { background: #f8fafc; border-radius: 10px; padding: 14px; }
          .info-card.green { border-left: 3px solid #10b981; }
          .info-card.blue  { border-left: 3px solid #3b82f6; }
          .info-label { font-size: 9px; color: #94a3b8; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
          .info-name { font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 4px; }
          .info-sub { color: #64748b; font-size: 12px; line-height: 1.7; }
          .line-table { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
          .line-head { background: #f1f5f9; padding: 9px 16px; display: flex; justify-content: space-between; }
          .line-head span { font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px; }
          .line-body { padding: 0 16px; }
          .line-row { display: flex; justify-content: space-between; padding: 13px 0; border-bottom: 1px dashed #e2e8f0; }
          .line-row:last-child { border-bottom: none; padding: 14px 0; }
          .line-title { font-weight: 500; color: #1e293b; font-size: 13px; }
          .line-sub { color: #94a3b8; font-size: 11px; margin-top: 2px; }
          .line-amount { font-weight: 600; color: #0f172a; font-size: 13px; }
          .line-discount .line-title { color: #10b981; }
          .line-discount .line-amount { color: #10b981; }
          .line-total .line-title { font-size: 15px; font-weight: 700; color: #0f172a; }
          .line-total .line-amount { font-size: 20px; font-weight: 800; color: #0f172a; }
          .footer-note { text-align: center; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 12px; }
          .footer-note p { font-size: 10.5px; color: #94a3b8; line-height: 1.6; }
          @media print {
            body { background: #fff; padding: 0; }
            .invoice { box-shadow: none; border-radius: 0; width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div class="header-row">
              <div>
                <div class="receipt-label">Payment Receipt</div>
                <div class="invoice-num">${inv.invoice_number}</div>
                <div class="company-name">EV Rental Platform</div>
              </div>
            </div>
            <div class="status-row">
              <div class="status-badge">
                <div class="status-dot"></div>
                <span class="status-text">${inv.status === 'paid' ? 'PAYMENT SUCCESSFUL' : 'PAYMENT PENDING'}</span>
              </div>
              <span class="date-text">${new Date(inv.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <div class="body">
            <div class="grid-2">
              <div class="info-card green">
                <div class="info-label">Billed To</div>
                <div class="info-name">${inv.user?.name || '—'}</div>
                <div class="info-sub">
                  ${inv.user?.mobile ? `📞 ${inv.user.mobile}<br/>` : ''}
                  ${inv.user?.email ? `✉️ ${inv.user.email}` : ''}
                </div>
              </div>
              <div class="info-card blue">
                <div class="info-label">Issued By</div>
                <div class="info-name">${inv.franchise ? inv.franchise.store_name : 'EV Rental Platform'}</div>
                <div class="info-sub">
                  ${inv.booking?.booking_id ? `🔖 Booking: ${inv.booking.booking_id}` : ''}
                </div>
              </div>
            </div>

            <div class="line-table">
              <div class="line-head">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div class="line-body">
                <div class="line-row">
                  <div>
                    <div class="line-title">Vehicle Rental Charge</div>
                    <div class="line-sub">Booking ID: ${inv.booking?.booking_id || '—'}</div>
                  </div>
                  <div class="line-amount">₹${(inv.amount || 0).toLocaleString('en-IN')}</div>
                </div>
                ${inv.gst_amount > 0 ? `
                <div class="line-row">
                  <div>
                    <div class="line-title">GST / Taxes</div>
                    <div class="line-sub">Applied as per government norms</div>
                  </div>
                  <div class="line-amount">₹${inv.gst_amount.toLocaleString('en-IN')}</div>
                </div>` : ''}
                ${inv.discount_amount > 0 ? `
                <div class="line-row line-discount">
                  <div>
                    <div class="line-title">🎉 Discount Applied</div>
                    <div class="line-sub">Offer / Coupon savings</div>
                  </div>
                  <div class="line-amount">- ₹${inv.discount_amount.toLocaleString('en-IN')}</div>
                </div>` : ''}
                <div class="line-row line-total">
                  <div class="line-title">Total Paid</div>
                  <div class="line-amount">₹${(inv.total_amount || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            <div class="footer-note">
              <p>🔒 This is a computer-generated invoice. No physical signature is required.<br/>
              For disputes, contact support with Invoice No. <strong>${inv.invoice_number}</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank', 'width=700,height=900');
    win.document.write(html);
    win.document.close();
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
                  <th>Referral ID</th>
                  <th>Vehicle</th>
                  <th>Duration</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Payment Status</th>
                  <th>Extra Charges</th>
                  <th>Submission Date</th>
                  <th>Submission Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={14} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={28} style={{ display: 'block', margin: '0 auto 0.5rem' }} />
                    No bookings found.
                  </td></tr>
                ) : paginated.map(b => {
                  const cfg = STATUS_CONFIG[b.booking_status] || STATUS_CONFIG.pending;
                  const dueAmt = Math.max(0, Math.round((b.grand_total || 0) - (b.total_paid || 0)));
                  const payStatus = (() => {
                    const gt = Math.round(b.grand_total || 0);
                    const tp = Math.round(b.total_paid || 0);
                    if (gt > 0 && tp >= gt) return 'paid';
                    if (tp > 0) return 'partially_paid';
                    return 'pending';
                  })();
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
                        <span style={{ fontWeight: '500', color: b.user?.referred_by?.driver_id ? 'var(--primary)' : 'var(--text-muted)' }}>
                          {b.user?.referred_by?.driver_id || 'N/A'}
                        </span>
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
                        {b.payment_status === 'failed' ? (
                          <span className="badge badge-danger" style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ❌ Failed
                          </span>
                        ) : payStatus === 'paid' ? (
                          <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
                            ✅ Paid
                          </span>
                        ) : payStatus === 'partially_paid' ? (
                          <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                            ⏳ Partial
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                            ⏳ Payment Pending
                          </span>
                        )}
                      </td>
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
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: '#0369a1', fontSize: '0.85rem' }}>
                        {(b.return_status === 'submission_pending' || b.return_status === 'approved' || b.booking_status === 'completed') ? 
                          new Date(b.submission_date || b.actual_return_date || b.updatedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</span>
                        }
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: '#15803d', fontSize: '0.85rem' }}>
                        {(b.return_status === 'submission_pending' || b.return_status === 'approved' || b.booking_status === 'completed') ? 
                          new Date(b.submission_date || b.actual_return_date || b.updatedAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</span>
                        }
                      </td>
                      <td>
                        <span className={`badge ${cfg.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{cfg.icon}{cfg.label}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn-icon" title="View Bill" style={{ color: '#10b981' }} onClick={() => handleViewBill(b._id)}><Receipt size={15} /></button>
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
              <button className="btn-icon" onClick={() => { setSelected(null); setShowSwapModal(false); }}><X size={20} /></button>
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
                  {['confirmed', 'ongoing'].includes(selected.booking_status) && (
                    <button onClick={openSwapModal} className="btn btn-outline" style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.4rem' }}>
                      <RefreshCw size={14} style={{ marginRight: '4px' }} /> Swap Vehicle
                    </button>
                  )}
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
                  {(selected.return_status === 'submission_pending' || selected.return_status === 'approved' || selected.booking_status === 'completed') && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Submission Date</span>
                        <span style={{ color: '#0369a1', fontWeight: 700 }}>{new Date(selected.submission_date || selected.actual_return_date || selected.updatedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Submission Time</span>
                        <span style={{ color: '#15803d', fontWeight: 700 }}>{new Date(selected.submission_date || selected.actual_return_date || selected.updatedAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </>
                  )}
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

              {/* Installment Schedule - Auto Generated, Read Only */}
              {selected.payment_installments?.length > 0 && (
                <div style={{ marginTop: '1rem', border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--surface)', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em' }}>
                      <CalendarDays size={13} /> Auto-Scheduled Installments
                    </div>
                    <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: '20px', fontWeight: 600 }}>
                      {selected.payment_installments.filter(i => i.status === 'paid').length}/{selected.payment_installments.length} Paid
                    </span>
                  </div>

                  {selected.payment_installments.map((inst) => (
                    <div key={inst._id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)',
                      background: inst.status === 'paid' ? '#f0fdf4' : inst.status === 'overdue' ? '#fef2f2' : 'inherit'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: inst.status === 'paid' ? '#dcfce7' : inst.status === 'overdue' ? '#fee2e2' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: inst.status === 'paid' ? '#15803d' : inst.status === 'overdue' ? '#b91c1c' : '#1e40af', flexShrink: 0 }}>
                          {inst.installment_no}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>₹{inst.amount.toLocaleString()}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Due: {fmtDate(inst.due_date)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge badge-icon ${inst.status === 'paid' ? 'badge-success' : inst.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
                          {inst.status === 'paid' ? <CheckCircle2 size={11} /> : <Clock size={11} />} {inst.status}
                        </span>
                        {inst.status === 'paid' && inst.paid_date && (
                          <span style={{ fontSize: '0.72rem', color: '#10b981' }}>Paid {fmtDate(inst.paid_date)}</span>
                        )}
                        {inst.status !== 'paid' && (
                          <span style={{ fontSize: '0.72rem', color: '#b45309', background: '#fef3c7', padding: '3px 8px', borderRadius: '4px', border: '1px solid #fde68a', fontWeight: 600 }}>⏳ Driver pays online</span>
                        )}
                      </div>
                    </div>
                  ))}

                  <div style={{ padding: '0.75rem 1rem', background: '#eff6ff', borderTop: '1px solid #bfdbfe', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Info size={14} color="#1e40af" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span style={{ fontSize: '0.78rem', color: '#1e40af', lineHeight: 1.5 }}>
                      Installments are <strong>auto-generated</strong> by the system at booking time. Drivers pay weekly rent via Driver App (UPI / Card / Net Banking). Franchisees cannot modify installments.
                    </span>
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
    
      {/* ── INVOICE MODAL ── */}
      {showInvoiceModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)} style={{ backdropFilter: 'blur(6px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#fff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: selectedInvoice ? '580px' : '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            fontFamily: "'Inter', -apple-system, sans-serif",
            position: 'relative'
          }}>
            {loadingInvoice ? (
              <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ marginTop: '16px', color: '#64748b', fontWeight: 500 }}>Loading Invoices...</div>
              </div>
            ) : invoiceList.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '10px' }}>No Invoices Found</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>There are no invoices generated for this booking yet. Invoices are generated when a payment is made.</p>
                <button onClick={() => setShowInvoiceModal(false)} style={{ padding: '10px 24px', background: '#f1f5f9', color: '#475569', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              </div>
            ) : selectedInvoice ? (
              <>
                {/* Header gradient */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #10b981 100%)',
                  borderRadius: '20px 20px 0 0',
                  padding: '28px 28px 20px 28px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Decorative circles */}
                  <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                  <div style={{ position: 'absolute', top: 10, right: 50, width: 60, height: 60, borderRadius: '50%', background: 'rgba(16,185,129,0.15)' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <div style={{ background: 'rgba(16,185,129,0.2)', borderRadius: '8px', padding: '8px', display: 'flex' }}>
                          <Receipt size={22} color="#10b981" />
                        </div>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Payment Receipt</div>
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: '18px', letterSpacing: '0.5px' }}>{selectedInvoice.invoice_number}</div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => {
                      if (invoiceList.length > 1) {
                        setSelectedInvoice(null);
                      } else {
                        setShowInvoiceModal(false);
                      }
                    }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                      <X size={18} />
                    </button>
                  </div>

                  {/* Status pill */}
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: selectedInvoice.status === 'paid' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)',
                      border: `1px solid ${selectedInvoice.status === 'paid' ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)'}`,
                      borderRadius: '20px', padding: '5px 14px'
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: selectedInvoice.status === 'paid' ? '#10b981' : '#f59e0b' }} />
                      <span style={{ color: selectedInvoice.status === 'paid' ? '#10b981' : '#f59e0b', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px' }}>
                        {selectedInvoice.status === 'paid' ? 'PAYMENT SUCCESSFUL' : 'PAYMENT PENDING'}
                      </span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                      {new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '24px 28px' }}>
                  {/* Billed To / Issued By */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', borderLeft: '3px solid #10b981' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Billed To</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px', marginBottom: '4px' }}>{selectedInvoice.user?.name || '—'}</div>
                      <div style={{ color: '#64748b', fontSize: '12px', lineHeight: '1.6' }}>
                        {selectedInvoice.user?.mobile && <div>📞 {selectedInvoice.user.mobile}</div>}
                        {selectedInvoice.user?.email && <div>✉️ {selectedInvoice.user.email}</div>}
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', borderLeft: '3px solid #3b82f6' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px' }}>Issued By</div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px', marginBottom: '4px' }}>
                        {selectedInvoice.franchise ? selectedInvoice.franchise.store_name : 'EV Rental Platform'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '12px', lineHeight: '1.6' }}>
                        {selectedInvoice.booking?.booking_id && <div>🔖 Booking: {selectedInvoice.booking.booking_id}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Line items */}
                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                    <div style={{ background: '#f1f5f9', padding: '10px 16px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>Description</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount</span>
                    </div>

                    <div style={{ padding: '0 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px dashed #e2e8f0' }}>
                        <div>
                          <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '14px' }}>
                            {selectedInvoice.installment_id ? `Installment Payment #${selectedInvoice.installment_no}` : 'Vehicle Rental Charge'}
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>Booking ID: {selectedInvoice.booking?.booking_id || '—'}</div>
                        </div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>₹{(selectedInvoice.amount || 0).toLocaleString('en-IN')}</div>
                      </div>

                      {(selectedInvoice.gst_amount > 0) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px dashed #e2e8f0' }}>
                          <div>
                            <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '14px' }}>GST / Taxes</div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>Applied as per government norms</div>
                          </div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>₹{(selectedInvoice.gst_amount).toLocaleString('en-IN')}</div>
                        </div>
                      )}

                      {(selectedInvoice.discount_amount > 0) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px dashed #e2e8f0' }}>
                          <div>
                            <div style={{ fontWeight: 500, color: '#10b981', fontSize: '14px' }}>🎉 Discount Applied</div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>Offer / Coupon savings</div>
                          </div>
                          <div style={{ fontWeight: 600, color: '#10b981', fontSize: '14px' }}>- ₹{(selectedInvoice.discount_amount).toLocaleString('en-IN')}</div>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', background: '#fff' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '16px' }}>Total Paid</div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '20px' }}>₹{(selectedInvoice.total_amount || 0).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }}>
                      🔒 This is a computer-generated invoice. No physical signature is required. <br/>
                      For disputes or queries, contact support with Invoice No. <strong>{selectedInvoice.invoice_number}</strong>
                    </p>
                  </div>
                </div>

                {/* Footer actions */}
                <div style={{ padding: '16px 28px 24px 28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={() => {
                    if (invoiceList.length > 1) {
                      setSelectedInvoice(null);
                    } else {
                      setShowInvoiceModal(false);
                    }
                  }} style={{
                    padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0',
                    background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '14px'
                  }}>
                    {invoiceList.length > 1 ? 'Back to List' : 'Close'}
                  </button>
                  <button onClick={() => printInvoice(selectedInvoice)} style={{
                    padding: '10px 22px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #0f172a, #10b981)',
                    color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '14px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
                  }}>
                    <Download size={16} /> Print / Save PDF
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Invoices for this Booking</h3>
                  <button onClick={() => setShowInvoiceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <X size={22} />
                  </button>
                </div>
                <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {invoiceList.map((inv) => (
                      <div key={inv._id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0',
                        background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{inv.invoice_number}</div>
                          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                            {inv.installment_id ? `Installment #${inv.installment_no}` : 'Master Invoice'}
                            &nbsp;&bull;&nbsp; {new Date(inv.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ fontWeight: 800, color: '#10b981', fontSize: '15px' }}>₹{inv.total_amount.toLocaleString('en-IN')}</div>
                          <button onClick={() => setSelectedInvoice(inv)} style={{
                            padding: '8px 14px', background: '#0f172a', color: '#fff', border: 'none',
                            borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '12px',
                            display: 'flex', alignItems: 'center', gap: '6px'
                          }}>
                            <Receipt size={14} /> View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    {/* Swap Vehicle Modal */}
    {showSwapModal && createPortal(
      <div className="modal-overlay" onClick={() => setShowSwapModal(false)} style={{ zIndex: 10000 }}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
          <div className="modal-header">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={18} color="var(--primary)" /> Swap Vehicle
            </h3>
            <button className="btn-icon" onClick={() => setShowSwapModal(false)}><X size={20} /></button>
          </div>
          <div className="modal-body" style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem', padding: '0.8rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Current Vehicle</div>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{selected?.vehicle?.registration_number} - {selected?.vehicle?.vehicle_name}</div>
            </div>
            <div className="form-group">
              <label>Select New Vehicle</label>
              <select 
                value={selectedSwapVehicle} 
                onChange={e => setSelectedSwapVehicle(e.target.value)} 
                style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px' }}
              >
                <option value="">-- Choose a vehicle --</option>
                {availableVehicles.map(v => (
                  <option key={v._id} value={v._id}>
                    {v.registration_number} - {v.vehicle_name}
                  </option>
                ))}
              </select>
              {availableVehicles.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.5rem' }}>No available active vehicles found.</p>
              )}
            </div>
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
            <button className="btn btn-outline" onClick={() => setShowSwapModal(false)} disabled={loading}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSwapSubmit} disabled={loading || !selectedSwapVehicle}>
              {loading ? <Loader size={16} className="spinner" /> : 'Confirm Swap'}
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
