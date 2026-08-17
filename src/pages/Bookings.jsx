import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, Search, Eye, CheckCircle, XCircle, Clock,
  Car, User, MapPin, CreditCard, X, Download,
  IndianRupee, Ban, CircleCheck, Activity,
  Navigation, PackageCheck, TrendingUp, Loader, AlertTriangle,
  Plus, Trash2, CalendarDays, CheckCircle2, AlertOctagon, Receipt, Check
} from 'lucide-react';
import { getAllBookings, approveBooking, rejectBooking, updateBookingStatus, payManual, getAllStores, setupInstallments, payInstallment, addDamageCharge, changeBookingVehicle, getAllVehicles, getInvoiceByBooking, approveVehicleSubmission, rejectVehicleSubmission, extendBooking, forceCancelBooking } from '../services/apiServices';
import useApi from '../services/useApi';
import api from '../services/api';
import './Bookings.css';

const STATUS_CONFIG = {
  Active:    { cls: 'badge-success', icon: <CircleCheck size={12} /> },
  Ongoing:   { cls: 'badge-info',    icon: <Activity size={12} /> },
  Completed: { cls: 'badge-secondary', icon: <CheckCircle size={12} /> },
  Pending:   { cls: 'badge-warning', icon: <Clock size={12} /> },
  Cancelled: { cls: 'badge-danger',  icon: <Ban size={12} /> },
};

const PAYMENT_STATUS_CONFIG = {
  paid:           { cls: 'badge-success', label: 'Paid',    icon: <CheckCircle size={12} /> },
  partially_paid: { cls: 'badge-info',    label: 'Partial', icon: <Activity size={12} /> },
  pending:        { cls: 'badge-warning', label: 'Pending', icon: <Clock size={12} /> },
  failed:         { cls: 'badge-danger',  label: 'Failed',  icon: <XCircle size={12} /> },
};

const TABS = ['All', 'Active', 'Pending', 'Ongoing', 'Completed', 'Cancelled', 'Partial', 'Return Pending'];
const PAGE_SIZE = 8;

// Timeline steps per status
const TIMELINE = {
  Pending:   ['Booking Placed', 'Awaiting Approval'],
  Active:    ['Booking Placed', 'Approved', 'Vehicle Assigned'],
  Ongoing:   ['Booking Placed', 'Approved', 'Ride Started'],
  Completed: ['Booking Placed', 'Approved', 'Ride Started', 'Ride Completed'],
  Cancelled: ['Booking Placed', 'Cancelled'],
};

const Bookings = () => {
  const [bookings, setBookings]   = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [page, setPage]           = useState(1);
  const { loading, error, call }  = useApi();
  const [trackId, setTrackId]     = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError]   = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { id, type, label }
  const [customAlert, setCustomAlert] = useState(null);
  const [installmentAmount, setInstallmentAmount] = useState('');
  
  const [stores, setStores] = useState([]);
  const [selectedFranchise, setSelectedFranchise] = useState('All');
  const [showInstallSetup, setShowInstallSetup] = useState(false);
  const [installRows, setInstallRows] = useState([{ amount: '', due_date: '' }]);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageForm, setDamageForm] = useState({ description: '', amount: '' });
  const [damageBookingId, setDamageBookingId] = useState(null);
  
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceList, setInvoiceList] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapVehiclesList, setSwapVehiclesList] = useState([]);
  const [swapping, setSwapping] = useState(false);
  const [swapBookingId, setSwapBookingId] = useState(null);

  const [showForceCancelModal, setShowForceCancelModal] = useState(false);
  const [forceCancelBookingId, setForceCancelBookingId] = useState(null);
  const [forceCancelForm, setForceCancelForm] = useState({ reason_type: 'Rider Absconded', remark: '' });

  const handleOpenSwapModal = async (bookingId) => {
    try {
      setSwapBookingId(bookingId);
      setShowSwapModal(true);
      const res = await getAllVehicles();
      const vData = res.data?.data || res.data || [];
      setSwapVehiclesList(vData.filter(v => v.status === 'active'));
    } catch (err) {
      console.error(err);
      alert('Failed to fetch available vehicles');
    }
  };

  const handleConfirmSwap = async (newVehicleId) => {
    try {
      setSwapping(true);
      await changeBookingVehicle(swapBookingId, newVehicleId);
      setShowSwapModal(false);
      setSelected(null);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to swap vehicle');
    } finally {
      setSwapping(false);
    }
  };

  const handleUnassignVehicle = async (bookingId) => {
    if (!window.confirm('Are you sure you want to unassign the vehicle? The booking status will revert to Pending.')) return;
    try {
      await api.put(`/bookings/${bookingId}/unassign`);
      setSelected(null);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unassign vehicle');
    }
  };

  const handleForceCancel = async (e) => {
    e.preventDefault();
    if (!forceCancelForm.remark || forceCancelForm.remark.trim().length < 5) {
      alert("Please provide a valid remark (minimum 5 characters).");
      return;
    }
    call(
      () => forceCancelBooking(forceCancelBookingId, forceCancelForm),
      () => {
        fetchBookings();
        setShowForceCancelModal(false);
        setForceCancelForm({ reason_type: 'Rider Absconded', remark: '' });
        setForceCancelBookingId(null);
        if (selected && selected.id === forceCancelBookingId) setSelected(null);
      },
      (err) => alert(err.response?.data?.message || 'Failed to force cancel booking')
    );
  };

  const handleApproveSubmission = async (bookingId) => {
    try {
      await approveVehicleSubmission(bookingId);
      alert('Vehicle submission approved!');
      setSelected(null);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve submission');
    }
  };

  const handleRejectSubmission = async (bookingId) => {
    try {
      await rejectVehicleSubmission(bookingId);
      alert('Vehicle submission rejected!');
      setSelected(null);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject submission');
    }
  };

  useEffect(() => {
    fetchBookings();
    loadStores();
  }, []);

  const loadStores = () => {
    getAllStores().then(res => {
      setStores(res.data?.data || res.data || []);
    }).catch(err => console.error(err));
  };

  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendForm, setExtendForm] = useState({ extra_weeks: 1, auto_renew: false });
  const [extendBookingId, setExtendBookingId] = useState(null);

  const handleExtendPlan = async (e) => {
    e.preventDefault();
    if (!extendForm.extra_weeks) return alert('Please enter weeks to extend');
    try {
      await extendBooking(extendBookingId, extendForm.extra_weeks, extendForm.auto_renew);
      alert('Plan extended successfully!');
      setShowExtendModal(false);
      setExtendForm({ extra_weeks: 1, auto_renew: false });
      setSelected(null);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to extend plan');
    }
  };

  const fetchBookings = () => {
    call(() => getAllBookings(), (res) => {
      const data = res.data || [];
      const list = data.map(b => ({
        id: b._id,
        bookingId: b.booking_id || 'N/A',
        user: b.user?.name || 'Unknown',
        email: b.user?.email || '',
        phone: b.user?.mobile || '',
        referrerId: b.user?.referred_by?.driver_id || 'N/A',
        vehicle: b.vehicle?.vehicle_name || 'N/A',
        regNo: b.vehicle?.registration_number || '',
        vehicleId: b.vehicle?.vehicle_id || '',
        franchise: b.franchise?.store_name || b.vehicle?.franchise?.store_name || 'Main Hub',
        plan: b.plan?.plan_name || 'Custom',
        status: b.booking_status === 'confirmed' ? 'Active' :
                b.booking_status === 'ongoing'   ? 'Ongoing' :
                b.booking_status === 'completed' ? 'Completed' :
                b.booking_status === 'cancelled' ? 'Cancelled' : 'Pending',
        type: b.payment_method === 'online' ? 'Instant' : 'Scheduled',
        startTime: new Date(b.start_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        endTime: new Date(b.end_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        duration: calculateDuration(b.start_date, b.end_date),
        amount: b.grand_total || 0,
        total_paid: b.total_paid || 0,
        due_amount: Math.max(0, Math.round((b.grand_total || 0) - (b.total_paid || 0))),
        payment_status: (() => {
          const gt = Math.round(b.grand_total || 0);
          const tp = Math.round(b.total_paid || 0);
          if (gt > 0 && tp >= gt) return 'paid';
          if (tp > 0 && tp < gt) return 'partially_paid';
          return 'pending';
        })(),
        paid: Math.round(b.total_paid || 0) >= Math.round(b.grand_total || 0) && (b.grand_total || 0) > 0,
        pickup: b.pickup_location || 'Hub Pickup',
        next_installment: b.next_installment || null,
        raw: b
      }));
      setBookings(list);
    });
  };

  const calculateDuration = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.abs(e - s) / 36e5; // hours
    if (diff < 24) return `${Math.ceil(diff)} hrs`;
    return `${Math.ceil(diff / 24)} days`;
  };
  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? bookings.length 
             : t === 'Partial' ? bookings.filter((b) => b.payment_status === 'partially_paid').length
             : t === 'Return Pending' ? bookings.filter((b) => b.raw?.return_status === 'submission_pending').length
             : bookings.filter((b) => b.status === t).length;
    return acc;
  }, {});

  const totalRevenue = bookings.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0);

  /* — filter — */
  const filtered = bookings.filter((b) => {
    const matchTab = activeTab === 'All' 
                     ? true 
                     : activeTab === 'Partial' 
                       ? b.payment_status === 'partially_paid' 
                       : activeTab === 'Return Pending'
                       ? b.raw?.return_status === 'submission_pending'
                       : b.status === activeTab;
    const matchFranchise = selectedFranchise === 'All' || b.franchise === selectedFranchise;
    const q = search.toLowerCase();
    const matchSearch =
      b.bookingId.toLowerCase().includes(q) ||
      b.user.toLowerCase().includes(q) ||
      b.vehicle.toLowerCase().includes(q) ||
      b.regNo.toLowerCase().includes(q) ||
      b.vehicleId.toLowerCase().includes(q);
    return matchTab && matchFranchise && matchSearch;
  });

  /* ── pagination ── */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  /* ── derived counts ── */

  const handleDownloadReport = () => {
    alert("Export feature coming soon!");
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

  const printInvoice = async (inv) => {
    try {
      const res = await api.get(`/invoices/${inv._id}/receipt`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${inv.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice');
    }
  };

  const handleTrack = () => {
    const found = bookings.find((b) => b.bookingId.toLowerCase() === trackId.trim().toLowerCase());
    if (found) { setTrackResult(found); setTrackError(false); }
    else       { setTrackResult(null);  setTrackError(true);  }
  };

  /* ── actions ── */
  const updateStatus = (id, status) => {
    if (status === 'Completed') {
      const b = bookings.find(x => x.id === id);
      if (b && b.due_amount > 0) {
        return setCustomAlert(`Cannot mark as completed! Full payment is required. A due amount of ₹${b.due_amount} is still pending.`);
      }
    }
    const apiStatus = status === 'Active' ? 'confirmed' : status === 'Completed' ? 'completed' : 'cancelled';
    call(
      () => status === 'Active' ? approveBooking(id) :
            status === 'Cancelled' ? rejectBooking(id) :
            updateBookingStatus(id, { booking_status: apiStatus }),
      () => {
        fetchBookings();
        setSelected(null);
        setConfirmAction(null);
        // alert(`Booking status updated to ${status}`);
      },
      (err) => {
        alert(`Failed to update status: ${err}`);
      }
    );
  };

  const handlePayment = (id, amount = null) => {
    const payload = amount ? { amount: parseFloat(amount) } : {};
    call(
      () => payManual(id, payload),
      () => {
        fetchBookings();
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
      () => setupInstallments(selected.raw._id, installRows.map(r => ({ amount: parseFloat(r.amount), due_date: r.due_date }))),
      (res) => {
        fetchBookings();
        setShowInstallSetup(false);
        setInstallRows([{ amount: '', due_date: '' }]);
        setSelected(prev => ({ ...prev, raw: { ...prev.raw, payment_installments: res.data.data } }));
        alert('Installment schedule saved!');
      },
      (err) => alert(`Failed: ${err}`)
    );
  };

  const handlePayInstallment = (instId) => {
    call(
      () => payInstallment(selected.raw._id, instId, {}),
      () => {
        fetchBookings();
        alert('Installment marked as paid!');
        setSelected(null);
      },
      (err) => alert(`Failed: ${err}`)
    );
  };

  const addInstallRow = () => setInstallRows(r => [...r, { amount: '', due_date: '' }]);
  const removeInstallRow = (i) => setInstallRows(r => r.filter((_, idx) => idx !== i));
  const updateInstallRow = (i, field, val) => setInstallRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

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

  const handleTabChange = (tab) => { setActiveTab(tab); setPage(1); };
  const handleSearch    = (e)   => { setSearch(e.target.value); setPage(1); };

  return (
    <div className="bookings-page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Booking Management</h1>
          <p>Monitor and manage all TRIS Electric bookings.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => setShowActivity(true)}>
            <Activity size={16} /> Rental Activity
          </button>
          <button className="btn btn-outline">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Track Booking Status ── */}
      <div className="card track-card">
        <div className="track-header">
          <div className="track-header-left">
            <div className="track-icon"><Navigation size={18} /></div>
            <div>
              <h3>Track Booking Status</h3>
              <p>Enter a Booking ID to see real-time status and timeline.</p>
            </div>
          </div>
        </div>
        <div className="track-search-row">
          <div className="track-input-wrap">
            <Search size={15} className="track-search-icon" />
            <input
              type="text"
              placeholder="Enter Booking ID (e.g. BK-9021)"
              value={trackId}
              onChange={(e) => { setTrackId(e.target.value); setTrackResult(null); setTrackError(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleTrack}>
            <Navigation size={15} /> Track
          </button>
        </div>

        {trackError && (
          <div className="track-error">
            <XCircle size={16} /> No booking found with ID <strong>{trackId}</strong>. Please check and try again.
          </div>
        )}

        {trackResult && (
          <div className="track-result">
            {/* Booking summary */}
            <div className="track-summary">
              <div className="track-summary-left">
                <span className="booking-id-badge">{trackResult.bookingId}</span>
                <div>
                  <span className="cell-main">{trackResult.user}</span>
                  <span className="cell-sub">{trackResult.vehicle} • {trackResult.regNo}</span>
                </div>
              </div>
              <div className="track-summary-right">
                <span className={`badge badge-icon ${STATUS_CONFIG[trackResult.status].cls}`}>
                  {STATUS_CONFIG[trackResult.status].icon} {trackResult.status}
                </span>
                <span className="cell-sub">{trackResult.plan} • {trackResult.duration}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="track-timeline">
              {TIMELINE[trackResult.status]?.map((step, i, arr) => {
                const isLast    = i === arr.length - 1;
                const isDone    = true;
                const isCancelled = trackResult.status === 'Cancelled' && isLast;
                return (
                  <div key={i} className="tl-step">
                    <div className="tl-left">
                      <div className={`tl-dot ${ isCancelled ? 'tl-dot-cancel' : 'tl-dot-done'}`}>
                        {isCancelled ? <Ban size={12} /> : <CheckCircle size={12} />}
                      </div>
                      {!isLast && <div className="tl-line" />}
                    </div>
                    <div className="tl-content">
                      <span className={`tl-label ${isCancelled ? 'tl-cancel' : ''}`}>{step}</span>
                      <span className="tl-time">
                        {i === 0 ? trackResult.startTime :
                         isLast && trackResult.status === 'Completed' ? trackResult.endTime :
                         isLast && trackResult.status === 'Cancelled' ? trackResult.startTime :
                         trackResult.startTime}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Extra info row */}
            <div className="track-info-row">
              <div className="track-info-item">
                <span className="track-info-label"><MapPin size={12} /> Pickup</span>
                <span className="track-info-val">{trackResult.pickup}</span>
              </div>
              <div className="track-info-item">
                <span className="track-info-label"><Car size={12} /> Franchise</span>
                <span className="track-info-val">{trackResult.franchise}</span>
              </div>
              <div className="track-info-item">
                <span className="track-info-label"><IndianRupee size={12} /> Amount</span>
                <span className="track-info-val">₹{trackResult.amount.toLocaleString()}</span>
              </div>
              <div className="track-info-item">
                <span className="track-info-label"><CreditCard size={12} /> Payment</span>
                <span className={`track-info-val ${trackResult.paid ? 'paid' : 'unpaid'}`}>
                  {trackResult.paid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="bk-stats">
        <div className="card bk-stat-card">
          <div className="bk-stat-icon total"><Calendar size={19} /></div>
          <div>
            <span className="bk-stat-label">Total Bookings</span>
            <h3>{bookings.length}</h3>
          </div>
        </div>
        <div className="card bk-stat-card">
          <div className="bk-stat-icon active"><CircleCheck size={19} /></div>
          <div>
            <span className="bk-stat-label">Active Rides</span>
            <h3>{counts.Active}</h3>
          </div>
        </div>
        <div className="card bk-stat-card">
          <div className="bk-stat-icon pending"><Clock size={19} /></div>
          <div>
            <span className="bk-stat-label">Pending</span>
            <h3>{counts.Pending}</h3>
          </div>
        </div>
        <div className="card bk-stat-card">
          <div className="bk-stat-icon revenue"><IndianRupee size={19} /></div>
          <div>
            <span className="bk-stat-label">Total Revenue</span>
            <h3>₹{totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">

        {/* Toolbar */}
        <div className="bk-toolbar">
          <div className="filter-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={`filter-tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => handleTabChange(t)}
              >
                {t}
                <span className="tab-count">{counts[t]}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedFranchise}
              onChange={(e) => { setSelectedFranchise(e.target.value); setPage(1); }}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                background: 'var(--surface)',
                color: 'var(--text-main)',
                minWidth: '180px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Franchises</option>
              {stores.map(store => (
                <option key={store._id} value={store.store_name}>{store.store_name}</option>
              ))}
            </select>
            <div className="search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search ID, user, vehicle..."
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Referral ID</th>
                <th>Vehicle</th>
                <th>Vehicle ID</th>
                <th>Franchise Store</th>
                <th>Plan/Duration</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Extra Charges</th>
                <th>Booking Date</th>
                <th>Submission Date</th>
                <th>Submission Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={14} className="bk-empty-row">
                    <Calendar size={28} />
                    <p>No bookings found.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((b) => (
                  <tr key={b.id}>
                    <td><span className="booking-id-badge">{b.bookingId}</span></td>
                    <td>
                      <div className="bk-user-cell">
                        <div className="bk-avatar">{b.user.split(' ').map((n) => n[0]).join('')}</div>
                        <div>
                          <span className="cell-main">{b.user}</span>
                          <span className="cell-sub">{b.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '500', color: b.referrerId !== 'N/A' ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {b.referrerId}
                      </span>
                    </td>
                    <td>
                      <span className="cell-main">{b.vehicle}</span>
                      <span className="cell-sub">{b.regNo}</span>
                    </td>
                    <td>
                      <span className="cell-sub" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>{b.vehicleId || 'N/A'}</span>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 600, fontSize: '0.8rem' }}>{b.franchise}</span>
                    </td>
                    <td>
                      <span className="cell-main">{b.plan}</span>
                  <span className="cell-sub">{b.duration}</span>
                    </td>
                    <td><span className="bk-amount">₹{b.amount.toLocaleString()}</span></td>
                    <td><span className="text-success" style={{ fontWeight: 600 }}>₹{b.total_paid.toLocaleString()}</span></td>
                    <td><span className={b.due_amount > 0 ? "text-danger" : "text-success"} style={{ fontWeight: 600 }}>₹{b.due_amount.toLocaleString()}</span></td>
                    <td>
                      {b.raw?.damage_charges?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.85rem' }}>
                            ₹{b.raw.damage_charges.reduce((s, c) => s + c.amount, 0).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {b.raw.damage_charges.length} charge{b.raw.damage_charges.length > 1 ? 's' : ''}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                            {b.raw.damage_charges.map((ch, i) => (
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
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 500, fontSize: '0.85rem' }}>
                      {new Date(b.raw?.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: '#0369a1', fontSize: '0.85rem' }}>
                      {(b.raw?.return_status === 'submission_pending' || b.raw?.return_status === 'approved' || b.status === 'Completed') ? 
                        new Date(b.raw?.submission_date || b.raw?.actual_return_date || b.raw?.updatedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</span>
                      }
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: '#15803d', fontSize: '0.85rem' }}>
                      {(b.raw?.return_status === 'submission_pending' || b.raw?.return_status === 'approved' || b.status === 'Completed') ? 
                        new Date(b.raw?.submission_date || b.raw?.actual_return_date || b.raw?.updatedAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</span>
                      }
                    </td>
                    <td>
                      <div className="bk-status-stack">
                        <span className={`badge badge-icon ${STATUS_CONFIG[b.status].cls}`}>
                          {STATUS_CONFIG[b.status].icon} {b.status}
                        </span>
                        <span className={`badge badge-icon ${
                          b.payment_status === 'paid' ? 'badge-success' :
                          b.payment_status === 'partially_paid' ? 'badge-info' : 'badge-warning'
                        }`} style={{ marginTop: '4px', fontSize: '10px' }}>
                          {b.payment_status === 'paid' ? <CheckCircle size={12} /> : b.payment_status === 'partially_paid' ? <Activity size={12} /> : <Clock size={12} />}
                          {b.payment_status === 'paid' ? 'Paid' : b.payment_status === 'partially_paid' ? 'Partial' : 'Pending'}
                        </span>
                        {b.raw?.return_status === 'submission_pending' && (
                          <span className="badge badge-warning" style={{ marginTop: '4px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertOctagon size={12} /> Return Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="bk-actions">
                        <button className="btn-icon" title="View Details" onClick={() => setSelected(b)}>
                          <Eye size={15} />
                        </button>
                        <button className="btn-icon" title="View Bill" onClick={() => handleViewBill(b.id)} style={{ color: '#10b981' }}>
                          <Receipt size={15} />
                        </button>
                        {b.status === 'Pending' && (
                          <>
                            <button className="btn-icon approve" title="Approve"
                              onClick={() => setConfirmAction({ id: b.id, type: 'Active', label: 'Approve' })}>
                              <CheckCircle size={15} />
                            </button>
                            <button className="btn-icon reject" title="Reject"
                              onClick={() => setConfirmAction({ id: b.id, type: 'Cancelled', label: 'Reject' })}>
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                        {['Active', 'Ongoing'].includes(b.status) && (
                          <>
                            <button className="btn-icon" title="Extend Plan" style={{ color: '#3b82f6' }}
                              onClick={() => { setExtendBookingId(b.id); setExtendForm({ extra_weeks: 1, auto_renew: b.raw?.auto_renew || false }); setShowExtendModal(true); }}>
                              <Clock size={15} />
                            </button>
                            <button className="btn-icon cancel" title="Force Cancel"
                              onClick={() => {
                                setForceCancelBookingId(b.id);
                                setForceCancelForm({ reason_type: 'Rider Absconded', remark: '' });
                                setShowForceCancelModal(true);
                              }}>
                              <Ban size={15} />
                            </button>
                          </>
                        )}
                        <button className="btn-icon" title="Add Extra Charge" style={{ color: '#f59e0b' }}
                          onClick={() => { setDamageBookingId(b.id); setDamageForm({ description: '', amount: '' }); setShowDamageModal(true); }}>
                          <AlertOctagon size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="bk-pagination">
            <span className="bk-page-info">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="bk-page-btns">
              <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => goPage(page - 1)}>
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-num-btn ${page === p ? 'active' : ''}`}
                  onClick={() => goPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => goPage(page + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && createPortal(
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content bk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="bk-modal-title">
                <span className="booking-id-badge">{selected.bookingId}</span>
                <span className={`badge badge-icon ${STATUS_CONFIG[selected.status].cls}`}>
                  {STATUS_CONFIG[selected.status].icon} {selected.status}
                </span>
              </div>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>

            <div className="modal-body">
              <div className="bk-detail-grid">

                {/* Customer */}
                <div className="bk-detail-section">
                  <div className="bk-detail-section-title"><User size={13} /> Customer Info</div>
                  <div className="bk-detail-rows">
                    <div className="bk-detail-row"><span>Name</span><span>{selected.user}</span></div>
                    <div className="bk-detail-row"><span>Email</span><span>{selected.email}</span></div>
                    <div className="bk-detail-row"><span>Phone</span><span>{selected.phone}</span></div>
                  </div>
                </div>

                {/* Vehicle */}
                <div className="bk-detail-section">
                  <div className="bk-detail-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Car size={13} /> Vehicle Info</div>
                    {['Pending', 'Active', 'Ongoing'].includes(selected.status) && selected.vehicle && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleOpenSwapModal(selected.id)}>
                          Swap Vehicle
                        </button>
                        <button className="btn btn-outline btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => handleUnassignVehicle(selected.id)}>
                          Unassign
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="bk-detail-rows">
                    <div className="bk-detail-row"><span>Vehicle</span><span>{selected.vehicle}</span></div>
                    <div className="bk-detail-row"><span>Reg. No.</span><span>{selected.regNo}</span></div>
                    <div className="bk-detail-row"><span>Franchise</span><span>{selected.franchise}</span></div>
                  </div>
                </div>

                {/* Booking */}
                <div className="bk-detail-section">
                  <div className="bk-detail-section-title"><Calendar size={13} /> Booking Details</div>
                  <div className="bk-detail-rows">
                    <div className="bk-detail-row"><span>Plan</span><span>{selected.plan}</span></div>
                    <div className="bk-detail-row"><span>Type</span><span>{selected.type}</span></div>
                    <div className="bk-detail-row"><span>Duration</span><span>{selected.duration}</span></div>
                    <div className="bk-detail-row"><span>Start</span><span>{selected.startTime}</span></div>
                    <div className="bk-detail-row"><span>End</span><span>{selected.endTime}</span></div>
                    <div className="bk-detail-row"><span>Pickup</span><span>{selected.pickup}</span></div>
                    <div className="bk-detail-row"><span>Booking Date</span><span style={{ fontWeight: 600 }}>{new Date(selected.raw?.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                    {(selected.raw?.return_status === 'submission_pending' || selected.raw?.return_status === 'approved' || selected.status === 'Completed') && (
                      <>
                        <div className="bk-detail-row"><span>Submission Date</span><span style={{ color: '#0369a1', fontWeight: 700 }}>{new Date(selected.raw?.submission_date || selected.raw?.actual_return_date || selected.raw?.updatedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                        <div className="bk-detail-row"><span>Submission Time</span><span style={{ color: '#15803d', fontWeight: 700 }}>{new Date(selected.raw?.submission_date || selected.raw?.actual_return_date || selected.raw?.updatedAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
                      </>
                    )}
                    {selected.status === 'Cancelled' && selected.raw?.cancellation_remark && (
                      <div className="bk-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', background: '#fef2f2', padding: '8px', borderRadius: '6px', border: '1px solid #fecaca', marginTop: '8px' }}>
                        <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Ban size={12}/> Cancelled ({selected.raw?.cancellation_reason_type || 'Reason'})</span>
                        <span style={{ fontSize: '0.8rem', color: '#7f1d1d' }}>{selected.raw?.cancellation_remark}</span>
                        {selected.raw?.cancelled_by && <span style={{ fontSize: '0.7rem', color: '#b91c1c', marginTop: '2px' }}>By: <span style={{ textTransform: 'capitalize' }}>{selected.raw?.cancelled_by}</span></span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment */}
                <div className="bk-detail-section">
                  <div className="bk-detail-section-title"><CreditCard size={13} /> Payment Details</div>
                  <div className="bk-detail-rows">
                    <div className="bk-detail-row">
                      <span>Method</span>
                      <span style={{ textTransform: 'capitalize' }}>{selected.raw?.payment_method || 'online'}</span>
                    </div>
                    <div className="bk-detail-row">
                      <span>Grand Total</span>
                      <span className="bk-amount">₹{selected.amount.toLocaleString()}</span>
                    </div>
                    <div className="bk-detail-row">
                      <span>Total Paid</span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>₹{selected.total_paid.toLocaleString()}</span>
                    </div>
                    <div className="bk-detail-row">
                      <span>Due Amount</span>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>₹{selected.due_amount.toLocaleString()}</span>
                    </div>
                    <div className="bk-detail-row">
                      <span>Status</span>
                      <span className="bk-status-stack">
                        <span className={`badge badge-icon ${PAYMENT_STATUS_CONFIG[selected.payment_status].cls}`} style={{ fontSize: '0.72rem' }}>
                          {PAYMENT_STATUS_CONFIG[selected.payment_status].icon}
                          {PAYMENT_STATUS_CONFIG[selected.payment_status].label}
                        </span>
                        {selected.raw?.return_status === 'submission_pending' && (
                          <span className="badge badge-warning" style={{ marginTop: '4px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertOctagon size={12} /> Return Pending
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  {selected.amount > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>Payment Progress</span>
                        <span>{Math.round((selected.total_paid / selected.amount) * 100)}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '4px', background: selected.total_paid >= selected.amount ? '#10b981' : '#3b82f6', width: `${Math.min(100, Math.round((selected.total_paid / selected.amount) * 100))}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}
                  {selected.next_installment && (
                    <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#92400e', marginBottom: '0.3rem', letterSpacing: '0.04em' }}>Next Payment Due</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>₹{selected.next_installment.amount.toLocaleString()}</span>
                        <span style={{ fontSize: '0.78rem', color: selected.next_installment.status === 'overdue' ? '#ef4444' : '#92400e', fontWeight: 600 }}>
                          {new Date(selected.next_installment.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {selected.next_installment.status === 'overdue' && ' ⚠ Overdue'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Installment Schedule */}
              {selected.due_amount > 0 && (
                <div className="inst-section">
                  <div className="inst-section-header">
                    <div className="bk-detail-section-title" style={{ marginBottom: 0 }}><CalendarDays size={13} /> Installment Schedule</div>
                    <button className="btn btn-outline btn-sm" onClick={() => { setShowInstallSetup(s => !s); setInstallRows([{ amount: '', due_date: '' }]); }}>
                      <Plus size={13} /> {showInstallSetup ? 'Cancel' : 'Setup'}
                    </button>
                  </div>

                  {showInstallSetup && (
                    <div className="inst-setup-box">
                      <p className="inst-hint">Due: ₹{selected.due_amount.toLocaleString()} — split into installments below</p>
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

                  {!showInstallSetup && selected.raw?.payment_installments?.length > 0 && (
                    <div className="installment-timeline" style={{ position: 'relative', paddingLeft: '16px', marginTop: '12px' }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '22px', width: '2px', background: '#e2e8f0', zIndex: 1 }} />
                      
                      {selected.raw.payment_installments.map((inst, idx) => (
                        <div key={inst._id} style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '16px', marginBottom: '16px' }}>
                          <div style={{ 
                            width: '14px', height: '14px', borderRadius: '50%', marginTop: '6px', flexShrink: 0,
                            background: inst.status === 'paid' ? '#10b981' : inst.status === 'overdue' ? '#ef4444' : '#fff',
                            border: `3px solid ${inst.status === 'paid' ? '#10b981' : inst.status === 'overdue' ? '#ef4444' : '#e2e8f0'}`,
                            boxShadow: '0 0 0 4px #fff'
                          }} />
                          
                          <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                                Week {inst.installment_no} • {new Date(inst.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>₹{inst.amount.toLocaleString()}</span>
                                <span className={`badge ${inst.status === 'paid' ? 'badge-success' : inst.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                                  {inst.status}
                                </span>
                              </div>
                            </div>
                            
                            <div style={{ textAlign: 'right' }}>
                              {inst.status === 'paid' && inst.paid_date ? (
                                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={12} /> Paid on {new Date(inst.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#b45309', background: '#fffbeb', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                                  ⏳ Pending Online Pay
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showInstallSetup && (!selected.raw?.payment_installments || selected.raw.payment_installments.length === 0) && (
                    <p className="inst-empty">No installment schedule set. Click Setup to create one.</p>
                  )}
                </div>
              )}

              {/* Damage / Extra Charges History */}
              {selected.raw?.damage_charges?.length > 0 && (
                <div className="inst-section" style={{ marginTop: '1rem' }}>
                  <div className="inst-section-header">
                    <div className="bk-detail-section-title" style={{ marginBottom: 0, color: '#ef4444' }}>
                      <AlertOctagon size={13} /> Extra / Damage Charges
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>
                      Total: ₹{selected.raw.damage_charges.reduce((s, c) => s + c.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="inst-list">
                    {selected.raw.damage_charges.map((ch, i) => (
                      <div key={i} className="inst-item" style={{ background: '#fff7ed' }}>
                        <div className="inst-item-left">
                          <AlertOctagon size={14} color="#f59e0b" />
                          <div>
                            <span className="inst-amount" style={{ color: '#92400e' }}>₹{Number(ch.amount).toLocaleString()}</span>
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

            {/* Modal Footer Actions */}
            <div className="modal-footer bk-modal-footer">
              <div className="footer-left">
                {selected.due_amount > 0 && (
                  <span style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 600, background: '#eff6ff', padding: '6px 12px', borderRadius: '6px', border: '1px solid #bfdbfe', display: 'inline-block', maxWidth: '450px' }}>
                    ℹ️ Online Payment Only: Rent collection is restricted to Driver App online gateways (UPI/Card). Manual recording and cash receipts are disabled.
                  </span>
                )}
              </div>
              
              <div className="footer-right">
                 {selected.status === 'Pending' && (
                  <>
                    <button className="btn btn-outline reject-btn"
                      onClick={() => setConfirmAction({ id: selected.id, type: 'Cancelled', label: 'Reject' })}>
                      <XCircle size={15} /> Reject
                    </button>
                    <button className="btn btn-primary"
                      onClick={() => setConfirmAction({ id: selected.id, type: 'Active', label: 'Approve' })}>
                      <CheckCircle size={15} /> Approve
                    </button>
                  </>
                )}
                {selected.status === 'Active' && (
                  <>
                    <button className="btn btn-outline reject-btn"
                      onClick={() => setConfirmAction({ id: selected.id, type: 'Cancelled', label: 'Cancel' })}>
                      <Ban size={15} /> Cancel
                    </button>
                    <button className="btn btn-primary"
                      onClick={() => updateStatus(selected.id, 'Completed')}>
                      <CircleCheck size={15} /> Complete
                    </button>
                  </>
                )}

                <button className="btn btn-outline" onClick={() => { setSelected(null); setShowInstallSetup(false); }}>Close</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* ── Rental Activity Modal ── */}
      {showActivity && createPortal(
        <div className="modal-overlay" onClick={() => setShowActivity(false)}>
          <div className="modal-content activity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="track-icon"><Activity size={17} /></div>
                <div>
                  <h3>Rental Activity</h3>
                  <span className="cell-sub">Recent booking events across all franchises</span>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowActivity(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '0' }}>

              {/* Activity stats */}
              <div className="activity-stats">
                <div className="activity-stat">
                  <CircleCheck size={16} color="#10b981" />
                  <span>{bookings.filter(b => b.status === 'Active').length} Active</span>
                </div>
                <div className="activity-stat">
                  <Clock size={16} color="#f59e0b" />
                  <span>{bookings.filter(b => b.status === 'Pending').length} Pending</span>
                </div>
                <div className="activity-stat">
                  <PackageCheck size={16} color="#3b82f6" />
                  <span>{bookings.filter(b => b.status === 'Completed').length} Completed</span>
                </div>
                <div className="activity-stat">
                  <TrendingUp size={16} color="var(--primary)" />
                  <span>₹{bookings.filter(b => b.paid).reduce((s,b) => s + b.amount, 0).toLocaleString()} Revenue</span>
                </div>
              </div>

              {/* Activity feed */}
              <div className="activity-feed">
                {bookings.slice(0, 10).map((b, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-dot" style={{ background: b.status === 'Active' ? '#10b981' : b.status === 'Pending' ? '#f59e0b' : '#3b82f6' }} />
                    <div className="activity-body">
                      <div className="activity-top">
                        <span className="activity-event">{b.status === 'Active' ? 'Ride Confirmed' : b.status === 'Pending' ? 'New Booking' : 'Status Update'}</span>
                        <span className="activity-time">{b.startTime}</span>
                      </div>
                      <div className="activity-meta">
                        <span><User size={11} /> {b.user}</span>
                        <span><Car size={11} /> {b.vehicle}</span>
                        <span className="booking-id-badge" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>{b.bookingId}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── ACTION CONFIRMATION MODAL ── */}
      {confirmAction && createPortal(
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{confirmAction.label} Booking</h3>
              <button className="btn-icon" onClick={() => setConfirmAction(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-body">
                <div className={`delete-icon-wrap ${confirmAction.type === 'Active' ? 'approve-icon' : ''}`}>
                  {confirmAction.type === 'Active' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                </div>
                <p>Are you sure you want to <strong>{confirmAction.label}</strong> this booking?</p>
                <p className="delete-sub">
                  Booking ID: <strong>{bookings.find(b => b.id === confirmAction.id)?.bookingId}</strong><br />
                  Customer: {bookings.find(b => b.id === confirmAction.id)?.user}
                </p>
                {confirmAction.type === 'Cancelled' && (
                  <p className="delete-sub" style={{ color: '#ef4444', marginTop: '0.5rem' }}>
                    This will notify the customer and release the vehicle.
                  </p>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setConfirmAction(null)}>Cancel</button>
              <button 
                className={`btn ${confirmAction.type === 'Active' ? 'btn-primary' : 'btn-danger'}`} 
                onClick={() => updateStatus(confirmAction.id, confirmAction.type)}
                disabled={loading}
              >
                {loading ? <Loader size={16} className="spinner" /> : `Yes, ${confirmAction.label}`}
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
                <strong>Booking:</strong> {bookings.find(b => b.id === damageBookingId)?.bookingId} &nbsp;|&nbsp;
                <strong>Customer:</strong> {bookings.find(b => b.id === damageBookingId)?.user}
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

      {/* ── SWAP VEHICLE MODAL ── */}
      {showSwapModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowSwapModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Swap Assigned Vehicle</h3>
              <button className="btn-icon" onClick={() => setShowSwapModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Select an available vehicle to replace the currently assigned one. The booking amount will remain unchanged.
              </p>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {swapVehiclesList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No available vehicles found.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {swapVehiclesList.map(v => (
                      <div key={v._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.9rem' }}>{v.vehicle_name || v.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reg: {v.registration_number || v.regNo || 'N/A'} | Type: {v.vehicle_type || v.type}</div>
                        </div>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleConfirmSwap(v._id || v.id)}
                          disabled={swapping}
                        >
                          {swapping ? 'Swapping...' : 'Select'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Invoice Modal — Premium Design */}
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
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>₹{(Number(selectedInvoice.total_amount || 0) - (Number(selectedInvoice.total_amount || 0) * 5 / 105)).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      </div>

                      {(selectedInvoice.total_amount > 0) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px dashed #e2e8f0' }}>
                          <div>
                            <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '14px' }}>GST / Taxes (5%)</div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>Applied as per government norms</div>
                          </div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>₹{(Number(selectedInvoice.total_amount || 0) * 5 / 105).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
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
      {showExtendModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowExtendModal(false)}>
          <div className="modal-content bk-modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Extend Plan</h3>
              <button className="btn-close" onClick={() => setShowExtendModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleExtendPlan}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Extend By (Weeks)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    value={extendForm.extra_weeks}
                    onChange={(e) => setExtendForm({ ...extendForm, extra_weeks: e.target.value })}
                  />
                  <small style={{ color: '#64748b', display: 'block', marginTop: '5px' }}>
                    Har week ka ek alag installment automatically create hoga.
                  </small>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <input
                    type="checkbox"
                    id="autoRenewCb"
                    checked={extendForm.auto_renew}
                    onChange={(e) => setExtendForm({ ...extendForm, auto_renew: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="autoRenewCb" style={{ fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                    Enable Auto-Renew
                  </label>
                </div>
                <small style={{ color: '#64748b', display: 'block', marginTop: '5px', marginLeft: '5px' }}>
                  Enable hone par plan har week automatically renew hoga. Driver ko kuch nahi karna padega.
                </small>
              </div>
              <div className="modal-footer" style={{ padding: '15px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowExtendModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={16} /> Confirm Extend
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {customAlert && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setCustomAlert(null)}>
          <div className="modal-content delete-modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ justifyContent: 'center', background: 'transparent', paddingBottom: 0 }}>
              <AlertOctagon size={48} color="#ef4444" style={{ marginBottom: '10px' }} />
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>Action Blocked</h3>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>{customAlert}</p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', borderTop: 'none', paddingTop: 0 }}>
              <button className="btn btn-primary" style={{ width: '100%', background: '#ef4444', borderColor: '#ef4444' }} onClick={() => setCustomAlert(null)}>
                Understood
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showForceCancelModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowForceCancelModal(false)}>
          <div className="modal-content bk-modal" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Ban size={18} style={{ marginRight: '8px', color: '#ef4444' }}/> Force Cancel Booking</h3>
              <button className="btn-close" onClick={() => setShowForceCancelModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleForceCancel}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Reason for Cancellation</label>
                  <select 
                    value={forceCancelForm.reason_type}
                    onChange={(e) => setForceCancelForm({ ...forceCancelForm, reason_type: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Rider Absconded">Rider Absconded</option>
                    <option value="Vehicle Abandoned">Vehicle Abandoned</option>
                    <option value="Non-Payment">Non-Payment</option>
                    <option value="Fraud/Dispute">Fraud/Dispute</option>
                    <option value="Customer Request">Customer Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Cancellation Remark (Required)</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Provide a detailed reason for force cancelling this booking..."
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                    value={forceCancelForm.remark}
                    onChange={(e) => setForceCancelForm({ ...forceCancelForm, remark: e.target.value })}
                  />
                  <small style={{ color: '#ef4444', display: 'block', marginTop: '5px' }}>
                    Note: This action will immediately cancel the booking, release the vehicle, and mark all pending installments as overdue. The rider will be notified.
                  </small>
                </div>
              </div>
              <div className="modal-footer" style={{ padding: '15px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForceCancelModal(false)}>Back</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Ban size={16} /> Force Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Bookings;

