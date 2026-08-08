import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard, ArrowUpRight, Search, Download,
  Eye, X, Clock, XCircle, 
  Smartphone, Wallet, IndianRupee, TrendingUp,
  User as UserIcon, Receipt, Loader2,
  CircleCheck, Activity, Plus, Trash2, CalendarDays, CheckCircle2
} from 'lucide-react';
import { getAllBookings, getDashboardStats, exportBookings, payManual, setupInstallments, payInstallment } from '../services/apiServices';
import useApi from '../services/useApi';
import './Payments.css';

const STATUS_CFG = {
  'paid':           { cls: 'badge-success', icon: <CircleCheck size={11} />, label: 'Paid Online' },
  'partially_paid': { cls: 'badge-info',    icon: <Activity size={11} />,    label: 'Partial Online' },
  'pending':        { cls: 'badge-warning', icon: <Clock size={11} />,       label: 'Pending' },
  'failed':         { cls: 'badge-danger',  icon: <XCircle size={11} />,      label: 'Failed' },
};

const METHOD_ICON = {
  'online': <Smartphone size={13} />,
  'upi':    <Smartphone size={13} />,
  'wallet': <Wallet size={13} />,
  'card':   <CreditCard size={13} />,
  'cash':   <IndianRupee size={13} />,
};

const TABS     = ['All', 'Paid', 'Partial Payment', 'Pending', 'Failed'];
const PAGE_SIZE = 10;

const Payments = () => {
  const [bookings, setBookings]     = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('All');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [selected, setSelected]     = useState(null);
  const [exporting, setExporting]   = useState(false);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [showInstallSetup, setShowInstallSetup] = useState(false);
  const [installRows, setInstallRows] = useState([{ amount: '', due_date: '' }]);
  const { call } = useApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, statsRes] = await Promise.all([
        getAllBookings(),
        getDashboardStats()
      ]);
      
      const mapped = (bookingsRes.data.data || []).map(b => ({
        ...b,
        due_amount: b.due_amount !== undefined ? b.due_amount : (b.grand_total - (b.total_paid || 0)),
        next_installment: b.next_installment || null
      }));

      setBookings(mapped);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error("Error fetching payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (id, amount = null) => {
    const payload = amount ? { amount: parseFloat(amount) } : {};
    call(
      () => payManual(id, payload),
      () => {
        fetchData();
        setSelected(null);
        setInstallmentAmount('');
        alert('Payment recorded successfully');
      },
      (err) => {
        alert(`Failed to record payment: ${err}`);
      }
    );
  };

  const handleSetupInstallments = () => {
    const valid = installRows.every(r => r.amount && r.due_date);
    if (!valid) return alert('Fill all installment amounts and due dates');
    call(
      () => setupInstallments(selected._id, installRows.map(r => ({ amount: parseFloat(r.amount), due_date: r.due_date }))),
      (res) => {
        fetchData();
        setShowInstallSetup(false);
        setInstallRows([{ amount: '', due_date: '' }]);
        // refresh selected with updated installments
        setSelected(prev => ({ ...prev, payment_installments: res.data.data }));
        alert('Installment schedule saved!');
      },
      (err) => alert(`Failed: ${err}`)
    );
  };

  const handlePayInstallment = (instId) => {
    call(
      () => payInstallment(selected._id, instId, {}),
      () => {
        fetchData();
        alert('Installment marked as paid!');
        setSelected(null);
      },
      (err) => alert(`Failed: ${err}`)
    );
  };

  const addInstallRow = () => setInstallRows(r => [...r, { amount: '', due_date: '' }]);
  const removeInstallRow = (i) => setInstallRows(r => r.filter((_, idx) => idx !== i));
  const updateInstallRow = (i, field, val) => setInstallRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await exportBookings();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payments_report_${new Date().toLocaleDateString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const filtered = bookings.filter(b => {
    const matchTab = activeTab === 'All' || 
                    (activeTab === 'Paid' && b.payment_status === 'paid') ||
                    (activeTab === 'Partial Payment' && b.payment_status === 'partially_paid') ||
                    (activeTab === 'Pending' && b.payment_status === 'pending') ||
                    (activeTab === 'Failed' && b.payment_status === 'failed');
    
    const q = search.toLowerCase();
    const matchSearch = b.booking_id.toLowerCase().includes(q) || 
                       (b.user?.name || '').toLowerCase().includes(q) ||
                       (b.transaction_id || '').toLowerCase().includes(q);
    
    return matchTab && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fmtINR = n => '₹' + (n || 0).toLocaleString('en-IN');
  const formatDate = d => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading || !stats) {
    return (
      <div className="cp-page-loading">
        <Loader2 className="spinner" size={40} />
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="payments-page">
      <div className="page-header">
        <div>
          <h1>Payments & Transactions</h1>
          <p>Monitor all financial activity and manage payouts.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="spinner" size={15} /> : <><Download size={16} /> Export CSV</>}
          </button>
        </div>
      </div>

      <div className="pay-stats">
        <div className="card pay-stat-card">
          <div className="pay-stat-icon revenue"><TrendingUp size={19} /></div>
          <div>
            <span className="pay-stat-label">Total Revenue</span>
            <h3>{fmtINR(stats.revenue.total)}</h3>
            <span className="pay-stat-sub up"><ArrowUpRight size={12} /> Real-time tracking</span>
          </div>
        </div>
        <div className="card pay-stat-card">
          <div className="pay-stat-icon refund">< IndianRupee size={19} /></div>
          <div>
            <span className="pay-stat-label">Pending Payments</span>
            <h3>{stats.bookings.pending}</h3>
            <span className="pay-stat-sub">Awaiting confirmation</span>
          </div>
        </div>
        <div className="card pay-stat-card">
          <div className="pay-stat-icon avg"><CreditCard size={19} /></div>
          <div>
            <span className="pay-stat-label">Paid Bookings</span>
            <h3>{stats.bookings.completed}</h3>
            <span className="pay-stat-sub up"><ArrowUpRight size={12} /> Successfully settled</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="pay-toolbar">
          <div className="pay-toolbar-left">
            <div className="filter-tabs">
              {TABS.map(t => (
                <button key={t} className={`filter-tab ${activeTab === t ? 'active' : ''}`}
                  onClick={() => { setActiveTab(t); setPage(1); }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Search ID, user, transaction..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="pay-table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Transaction / Booking ID</th>
                <th>Customer</th>
                <th>Vehicle / Method</th>
                <th>Vehicle No.</th>
                <th>Franchise</th>
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
                <tr><td colSpan={11} className="pay-empty-row"><Receipt size={28} /><p>No transactions found.</p></td></tr>
              ) : (
                paginated.map((tx, i) => (
                  <tr key={tx._id}>
                    <td className="td-muted">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td>
                      <span className="tx-id-badge">{tx.transaction_id || 'N/A'}</span>
                      <span className="cell-sub">{tx.booking_id}</span>
                    </td>
                    <td>
                      <div className="pay-user-cell">
                        <div className="pay-avatar">{(tx.user?.name || 'U').split(' ').map(n => n[0]).join('')}</div>
                        <div>
                          <span className="cell-main">{tx.user?.name || 'Unknown'}</span>
                          <span className="cell-sub">{tx.user?.mobile || ''}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="cell-main">{tx.vehicle?.vehicle_name || 'N/A'}</span>
                      <span className="cell-sub" style={{ textTransform: 'uppercase' }}>
                         {tx.payment_method || 'Online'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>
                      {tx.vehicle?.registration_number || 'N/A'}
                    </td>
                    <td>
                      <span className="cell-main">{tx.franchise?.store_name || 'Admin'}</span>
                    </td>
                    <td><span className="pay-amount">{fmtINR(tx.grand_total)}</span></td>
                    <td><span className="text-success" style={{ fontWeight: 600 }}>{fmtINR(tx.total_paid)}</span></td>
                    <td><span className={tx.due_amount > 0 ? "text-danger" : "text-success"} style={{ fontWeight: 600 }}>{fmtINR(tx.due_amount)}</span></td>
                    <td>
                      {tx.damage_charges?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem' }}>
                            ₹{tx.damage_charges.reduce((s, c) => s + c.amount, 0).toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {tx.damage_charges.length} charge{tx.damage_charges.length > 1 ? 's' : ''}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                            {tx.damage_charges.map((ch, i) => (
                              <span key={i} style={{ fontSize: '0.68rem', color: '#92400e', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '4px', padding: '1px 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '130px', display: 'block' }}>
                                ₹{ch.amount.toLocaleString('en-IN')} — {ch.description}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-icon ${STATUS_CFG[tx.payment_status]?.cls || 'badge-warning'}`}>
                        {STATUS_CFG[tx.payment_status]?.icon || <Clock size={11} />} {STATUS_CFG[tx.payment_status]?.label || tx.payment_status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" title="View Details" onClick={() => setSelected(tx)}>
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pay-pagination">
            <span className="pg-info">Page {page} of {totalPages}</span>
            <div className="pg-btns">
              <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {selected && createPortal(
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content pay-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="pay-modal-head">
                <span className="tx-id-badge">{selected.transaction_id || 'NO-ID'}</span>
                <span className={`badge badge-icon ${STATUS_CFG[selected.payment_status]?.cls}`}>
                  {STATUS_CFG[selected.payment_status]?.icon} {selected.payment_status.toUpperCase()}
                </span>
              </div>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="pay-amount-grid">
                <div className="pay-hero-item total">
                  <span className="hero-label">Grand Total</span>
                  <span className="hero-amount">{fmtINR(selected.grand_total)}</span>
                </div>
                <div className="pay-hero-item paid">
                  <span className="hero-label">Total Paid</span>
                  <span className="hero-amount">{fmtINR(selected.total_paid)}</span>
                </div>
                <div className="pay-hero-item due">
                  <span className="hero-label">Due Amount</span>
                  <span className="hero-amount">{fmtINR(selected.due_amount)}</span>
                </div>
              </div>
              {selected.grand_total > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    <span>Payment Progress</span>
                    <span>{Math.round(((selected.total_paid||0) / selected.grand_total) * 100)}%</span>
                  </div>
                  <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '4px', background: (selected.total_paid||0) >= selected.grand_total ? '#10b981' : '#3b82f6', width: `${Math.min(100, Math.round(((selected.total_paid||0)/selected.grand_total)*100))}%`, transition: 'width 0.3s' }} />
                  </div>
                  {selected.next_installment && (
                    <div style={{ marginTop: '0.65rem', padding: '0.6rem 0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#92400e', letterSpacing: '0.04em' }}>Next Payment Due</div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginTop: '2px' }}>{fmtINR(selected.next_installment.amount)}</div>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: selected.next_installment.status === 'overdue' ? '#ef4444' : '#92400e' }}>
                        {new Date(selected.next_installment.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {selected.next_installment.status === 'overdue' && ' ⚠ Overdue'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="pay-detail-grid">
                <div className="pay-detail-section">
                  <div className="pay-detail-title"><UserIcon size={13} /> Customer</div>
                  <div className="pay-detail-rows">
                    <div className="pay-detail-row"><span>Name</span><span>{selected.user?.name}</span></div>
                    <div className="pay-detail-row"><span>Mobile</span><span>{selected.user?.mobile}</span></div>
                  </div>
                </div>
                <div className="pay-detail-section">
                  <div className="pay-detail-title"><CreditCard size={13} /> Payment Info</div>
                  <div className="pay-detail-rows">
                    <div className="pay-detail-row"><span>Method</span>
                      <span className="method-badge" style={{ textTransform: 'uppercase' }}>{selected.payment_method}</span>
                    </div>
                    <div className="pay-detail-row"><span>Booking ID</span><span className="bk-ref-badge">{selected.booking_id}</span></div>
                    <div className="pay-detail-row"><span>Status</span>
                      <span className={`badge badge-icon ${STATUS_CFG[selected.payment_status]?.cls}`}>
                        {STATUS_CFG[selected.payment_status]?.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Installment Schedule Section */}
              {selected.due_amount > 0 && (
                <div className="inst-section">
                  <div className="inst-section-header">
                    <div className="pay-detail-title" style={{ marginBottom: 0 }}><CalendarDays size={13} /> Installment Schedule</div>
                    <button className="btn btn-outline btn-sm" onClick={() => { setShowInstallSetup(s => !s); setInstallRows([{ amount: '', due_date: '' }]); }}>
                      <Plus size={13} /> {showInstallSetup ? 'Cancel' : 'Setup'}
                    </button>
                  </div>

                  {showInstallSetup && (
                    <div className="inst-setup-box">
                      <p className="inst-hint">Due: {fmtINR(selected.due_amount)} — split into installments below</p>
                      {installRows.map((row, i) => (
                        <div key={i} className="inst-row">
                          <span className="inst-no">#{i + 1}</span>
                          <div className="inst-amount-field">
                            <span className="inst-prefix">₹</span>
                            <input type="number" placeholder="Amount" value={row.amount}
                              onChange={e => updateInstallRow(i, 'amount', e.target.value)}
                              className="inst-field-input" />
                          </div>
                          <input type="date" value={row.due_date}
                            onChange={e => updateInstallRow(i, 'due_date', e.target.value)}
                            className="inst-date-input" />
                          {installRows.length > 1 && (
                            <button className="btn-icon" onClick={() => removeInstallRow(i)}><Trash2 size={13} /></button>
                          )}
                        </div>
                      ))}
                      <div className="inst-setup-actions">
                        <button className="btn btn-outline btn-sm" onClick={addInstallRow}><Plus size={13} /> Add Row</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSetupInstallments}>Save Schedule</button>
                      </div>
                    </div>
                  )}

                  {!showInstallSetup && selected.payment_installments?.length > 0 && (
                    <div className="inst-list">
                      {selected.payment_installments.map((inst) => (
                        <div key={inst._id} className={`inst-item inst-${inst.status}`}>
                          <div className="inst-item-left">
                            <span className="inst-no">#{inst.installment_no}</span>
                            <div>
                              <span className="inst-amount">{fmtINR(inst.amount)}</span>
                              <span className="inst-date">Due: {new Date(inst.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                          <div className="inst-item-right">
                            <span className={`badge badge-icon ${ inst.status === 'paid' ? 'badge-success' : inst.status === 'overdue' ? 'badge-danger' : 'badge-warning' }`}>
                              {inst.status === 'paid' ? <CheckCircle2 size={11} /> : <Clock size={11} />} {inst.status}
                            </span>
                            {inst.status !== 'paid' && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309', background: '#fffbeb', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>⏳ Pending Online Pay</span>
                            )}
                            {inst.status === 'paid' && inst.paid_date && (
                              <span className="inst-paid-date">Paid {new Date(inst.paid_date).toLocaleDateString('en-IN')}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showInstallSetup && (!selected.payment_installments || selected.payment_installments.length === 0) && (
                    <p className="inst-empty">No installment schedule set. Click Setup to create one.</p>
                  )}
                </div>
              )}

              {/* Damage / Extra Charges History */}
              {selected.damage_charges?.length > 0 && (
                <div className="inst-section" style={{ marginTop: '1rem' }}>
                  <div className="inst-section-header">
                    <div className="pay-detail-title" style={{ marginBottom: 0, color: '#ef4444' }}>
                      ⚠ Extra / Damage Charges
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>
                      Total: {fmtINR(selected.damage_charges.reduce((s, c) => s + c.amount, 0))}
                    </span>
                  </div>
                  <div className="inst-list">
                    {selected.damage_charges.map((ch, i) => (
                      <div key={i} className="inst-item" style={{ background: '#fff7ed' }}>
                        <div className="inst-item-left">
                          <div>
                            <span className="inst-amount" style={{ color: '#92400e' }}>{fmtINR(ch.amount)}</span>
                            <span className="inst-date">{ch.description}</span>
                          </div>
                        </div>
                        <div className="inst-item-right">
                          <span style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 600, textTransform: 'uppercase', background: '#fed7aa', padding: '2px 8px', borderRadius: '10px' }}>{ch.added_by}</span>
                          <span className="inst-date">{new Date(ch.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer pay-modal-footer">
              <div className="footer-left">
                {selected.due_amount > 0 && (
                  <span style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 600, background: '#eff6ff', padding: '6px 12px', borderRadius: '6px', border: '1px solid #bfdbfe', display: 'inline-block' }}>
                    ℹ️ Rent Collection Policy: Drivers pay strictly online (UPI/Card/Net Banking). Manual rent entries and cash receipts are restricted.
                  </span>
                )}
              </div>
              <button className="btn btn-outline" onClick={() => { setSelected(null); setShowInstallSetup(false); }}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Payments;
