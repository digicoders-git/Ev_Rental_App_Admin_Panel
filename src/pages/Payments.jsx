import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard, ArrowDownLeft, ArrowUpRight, Search, Download,
  Eye, X, CheckCircle, Clock, XCircle, RefreshCw,
  Smartphone, Wallet, Building2, IndianRupee, TrendingUp,
  User as UserIcon, Calendar, Hash, Filter, Receipt, Loader2,
  CircleCheck, Activity
} from 'lucide-react';
import { getAllBookings, getDashboardStats, updateBookingStatus, exportBookings, payManual } from '../services/apiServices';
import useApi from '../services/useApi';
import './Payments.css';

const STATUS_CFG = {
  'paid':           { cls: 'badge-success', icon: <CircleCheck size={11} />, label: 'Paid' },
  'partially_paid': { cls: 'badge-info',    icon: <Activity size={11} />,    label: 'Partial' },
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

const TABS     = ['All', 'Paid', 'Pending'];
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
        due_amount: b.due_amount !== undefined ? b.due_amount : (b.grand_total - (b.total_paid || 0))
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
                    (activeTab === 'Pending' && b.payment_status === 'pending');
    
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
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={10} className="pay-empty-row"><Receipt size={28} /><p>No transactions found.</p></td></tr>
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
                    <td><span className="pay-amount">{fmtINR(tx.grand_total)}</span></td>
                    <td><span className="text-success" style={{ fontWeight: 600 }}>{fmtINR(tx.total_paid)}</span></td>
                    <td><span className={tx.due_amount > 0 ? "text-danger" : "text-success"} style={{ fontWeight: 600 }}>{fmtINR(tx.due_amount)}</span></td>
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
            </div>
            <div className="modal-footer pay-modal-footer">
              <div className="footer-left">
                {selected.due_amount > 0 && (
                  <div className="installment-box">
                    <div className="installment-input">
                      <IndianRupee size={14} className="input-icon" />
                      <input 
                        type="number" 
                        placeholder="Pay Installment" 
                        value={installmentAmount}
                        onChange={(e) => setInstallmentAmount(e.target.value)}
                        className="amount-input"
                      />
                    </div>
                    <button className="btn btn-primary btn-sm" 
                      onClick={() => handlePayment(selected._id, installmentAmount)}
                      disabled={!installmentAmount}>
                      Record
                    </button>
                    <button className="btn btn-outline btn-sm" 
                      onClick={() => handlePayment(selected._id)}>
                      Pay All
                    </button>
                  </div>
                )}
              </div>
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Payments;
