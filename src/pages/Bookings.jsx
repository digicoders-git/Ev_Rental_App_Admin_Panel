import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, Search, Eye, CheckCircle, XCircle, Clock,
  Car, User, MapPin, CreditCard, X, Download,
  IndianRupee, Ban, CircleCheck, Activity,
  Navigation, PackageCheck, Hourglass, TrendingUp, Loader, AlertTriangle
} from 'lucide-react';
import { getAllBookings, approveBooking, rejectBooking, cancelBooking, updateBookingStatus } from '../services/apiServices';
import useApi from '../services/useApi';
import './Bookings.css';

const STATUS_CONFIG = {
  Active:    { cls: 'badge-success', icon: <CircleCheck size={12} /> },
  Ongoing:   { cls: 'badge-info',    icon: <Activity size={12} /> },
  Completed: { cls: 'badge-secondary', icon: <CheckCircle size={12} /> },
  Pending:   { cls: 'badge-warning', icon: <Clock size={12} /> },
  Cancelled: { cls: 'badge-danger',  icon: <Ban size={12} /> },
};

const TABS = ['All', 'Active', 'Pending', 'Ongoing', 'Completed', 'Cancelled'];
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

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = () => {
    call(() => getAllBookings(), (res) => {
      const data = res.data || [];
      const list = data.map(b => ({
        id: b._id,
        bookingId: b.booking_id || 'N/A',
        user: b.user?.name || 'Unknown',
        email: b.user?.email || '',
        phone: b.user?.mobile || '',
        vehicle: b.vehicle?.vehicle_name || 'N/A',
        regNo: b.vehicle?.registration_number || '',
        franchise: b.vehicle?.franchise?.store_name || 'Main Hub',
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
        paid: b.payment_status === 'paid',
        pickup: b.pickup_location || 'Hub Pickup',
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
    acc[t] = t === 'All' ? bookings.length : bookings.filter((b) => b.status === t).length;
    return acc;
  }, {});

  const totalRevenue = bookings.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0);

  /* ── filter ── */
  const filtered = bookings.filter((b) => {
    const matchTab = activeTab === 'All' || b.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      b.bookingId.toLowerCase().includes(q) ||
      b.user.toLowerCase().includes(q) ||
      b.vehicle.toLowerCase().includes(q) ||
      b.regNo.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  /* ── pagination ── */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  /* ── derived counts ── */

  const handleTrack = () => {
    const found = bookings.find((b) => b.bookingId.toLowerCase() === trackId.trim().toLowerCase());
    if (found) { setTrackResult(found); setTrackError(false); }
    else       { setTrackResult(null);  setTrackError(true);  }
  };

  /* ── actions ── */
  const updateStatus = (id, status) => {
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

  const handleMarkPaid = (id) => {
    call(
      () => updateBookingStatus(id, { payment_status: 'paid' }),
      () => {
        fetchBookings();
        setSelected(null);
        alert('Payment marked as PAID successfully');
      },
      (err) => {
        alert(`Failed to update payment: ${err}`);
      }
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
          <p>Monitor and manage all EV rental bookings.</p>
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

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Plan</th>
                <th>Duration</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="bk-empty-row">
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
                          <span className="cell-sub">{b.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="cell-main">{b.vehicle}</span>
                      <span className="cell-sub">{b.regNo}</span>
                    </td>
                    <td className="cell-sub">{b.plan}</td>
                    <td>
                      <span className="cell-main">{b.duration}</span>
                      <span className="cell-sub">{b.type}</span>
                    </td>
                    <td>
                      <span className="bk-amount">₹{b.amount.toLocaleString()}</span>
                    </td>
                    <td>
                      <span className={`badge badge-icon ${b.paid ? 'badge-success' : 'badge-warning'}`}>
                        {b.paid ? <CheckCircle size={11} /> : <Clock size={11} />}
                        {b.paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-icon ${STATUS_CONFIG[b.status].cls}`}>
                        {STATUS_CONFIG[b.status].icon} {b.status}
                      </span>
                    </td>
                    <td>
                      <div className="bk-actions">
                        <button className="btn-icon" title="View Details" onClick={() => setSelected(b)}>
                          <Eye size={15} />
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
                        {b.status === 'Active' && (
                          <button className="btn-icon cancel" title="Cancel Ride"
                            onClick={() => setConfirmAction({ id: b.id, type: 'Cancelled', label: 'Cancel' })}>
                            <Ban size={15} />
                          </button>
                        )}
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
                  <div className="bk-detail-section-title"><Car size={13} /> Vehicle Info</div>
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
                  </div>
                </div>

                {/* Payment */}
                <div className="bk-detail-section">
                  <div className="bk-detail-section-title"><CreditCard size={13} /> Payment</div>
                  <div className="bk-detail-rows">
                    <div className="bk-detail-row">
                      <span>Amount</span>
                      <span className="bk-amount">₹{selected.amount.toLocaleString()}</span>
                    </div>
                    <div className="bk-detail-row">
                      <span>Status</span>
                      <span className={`badge badge-icon ${selected.paid ? 'badge-success' : 'badge-warning'}`}
                        style={{ fontSize: '0.72rem' }}>
                        {selected.paid ? <CheckCircle size={11} /> : <Clock size={11} />}
                        {selected.paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer Actions */}
            {(selected.status === 'Pending' || selected.status === 'Active' || !selected.paid) && (
              <div className="modal-footer">
                {!selected.paid && (
                  <button className="btn btn-outline" style={{ color: '#10b981', borderColor: '#10b981' }}
                    onClick={() => handleMarkPaid(selected.id)}>
                    <IndianRupee size={15} /> Mark as Paid
                  </button>
                )}
                
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
                      <Ban size={15} /> Cancel Ride
                    </button>
                    <button className="btn btn-primary"
                      onClick={() => updateStatus(selected.id, 'Completed')}>
                      <CircleCheck size={15} /> Mark Completed
                    </button>
                  </>
                )}
              </div>
            )}
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
    </div>
  );
};

export default Bookings;
