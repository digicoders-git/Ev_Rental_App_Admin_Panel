import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  AlertOctagon, CheckCircle, XCircle, Eye, Loader, Search, 
  RotateCcw, Bike, User, Calendar, Check, X, IndianRupee, Clock, AlertCircle 
} from 'lucide-react';
import { getFranchiseBookings, approveVehicleSubmission, rejectVehicleSubmission } from '../../services/apiServices';
import useApi from '../../services/useApi';

const FReturnPending = () => {
  const [returnRequests, setReturnRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { loading, call } = useApi();

  useEffect(() => {
    fetchReturnRequests();
  }, []);

  const fetchReturnRequests = () => {
    call(() => getFranchiseBookings(), (res) => {
      const bookings = res.data || [];
      // Filter bookings that have a return_status set
      const returnList = bookings.filter(b => b.return_status && b.return_status !== 'none');
      setReturnRequests(returnList);
    });
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this Vehicle return request? This will mark the vehicle as available.')) return;
    try {
      setActionLoading(true);
      await approveVehicleSubmission(id);
      alert('Vehicle return request approved successfully!');
      fetchReturnRequests();
      if (selected && (selected._id === id || selected.id === id)) setSelected(null);
    } catch (err) {
      alert('Error approving request: ' + (err?.response?.data?.message || err.message || err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this Vehicle return request?')) return;
    try {
      setActionLoading(true);
      await rejectVehicleSubmission(id);
      alert('Vehicle return request rejected.');
      fetchReturnRequests();
      if (selected && (selected._id === id || selected.id === id)) setSelected(null);
    } catch (err) {
      alert('Error rejecting request: ' + (err?.response?.data?.message || err.message || err));
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = returnRequests.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = 
      (b.booking_id || '').toLowerCase().includes(q) ||
      (b.user?.name || '').toLowerCase().includes(q) ||
      (b.user?.mobile || '').toLowerCase().includes(q) ||
      (b.vehicle?.registration_number || '').toLowerCase().includes(q) ||
      (b.vehicle?.vehicle_name || '').toLowerCase().includes(q);

    if (activeTab === 'Pending') return matchSearch && b.return_status === 'submission_pending';
    if (activeTab === 'Approved') return matchSearch && b.return_status === 'approved';
    if (activeTab === 'Rejected') return matchSearch && b.return_status === 'rejected';
    return matchSearch;
  });

  const pendingCount = returnRequests.filter(b => b.return_status === 'submission_pending').length;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <RotateCcw className="text-primary" size={28} />
            Return Pending
            {pendingCount > 0 && (
              <span style={{ 
                background: '#ef4444', 
                color: 'white', 
                padding: '2px 10px', 
                borderRadius: '999px', 
                fontSize: '0.85rem', 
                fontWeight: 700 
              }}>
                {pendingCount} New
              </span>
            )}
          </h1>
          <p style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>Review and inspect scooties returned by riders before approving handover.</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Pending', 'Approved', 'Rejected', 'All'].map(tab => {
              const count = tab === 'Pending' 
                ? pendingCount 
                : tab === 'Approved'
                ? returnRequests.filter(b => b.return_status === 'approved').length
                : tab === 'Rejected'
                ? returnRequests.filter(b => b.return_status === 'rejected').length
                : returnRequests.length;
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? 'var(--primary)' : '#f1f5f9',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>
          <div className="search-wrapper" style={{ width: '280px', minWidth: '220px' }}>
            <Search size={15} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search vehicle no, driver..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader size={32} className="spinner" color="var(--primary)" />
          <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading return requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CheckCircle size={48} color="#10b981" style={{ display: 'block', margin: '0 auto 1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} Vehicle return requests!</h3>
          <p style={{ color: 'var(--text-secondary)' }}>All ground-level vehicle returns are currently processed and clear.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(b => {
            const isPending = b.return_status === 'submission_pending';
            const reqDate = b.updatedAt ? new Date(b.updatedAt) : new Date();
            const dateFormatted = reqDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            
            return (
              <div key={b._id} className="card" style={{ 
                borderTop: isPending ? '4px solid #f59e0b' : b.return_status === 'approved' ? '4px solid #10b981' : '4px solid #ef4444', 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  {/* Card Title & Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'monospace' }}>
                        {b.booking_id || 'ID: ' + (b._id?.slice(-6) || 'N/A')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <Bike size={18} color="var(--primary)" />
                        <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                          {b.vehicle?.registration_number || b.vehicle?.vehicle_name || 'Unassigned EV'}
                        </span>
                      </div>
                      {b.vehicle?.vehicle_name && b.vehicle?.registration_number && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '24px' }}>
                          {b.vehicle.vehicle_name}
                        </div>
                      )}
                    </div>
                    <div>
                      {isPending ? (
                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> Pending
                        </span>
                      ) : b.return_status === 'approved' ? (
                        <span style={{ background: '#d1fae5', color: '#047857', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={12} /> Approved
                        </span>
                      ) : (
                        <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info List exactly as requested */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', margin: '0.75rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={15} color="var(--text-muted)" /> Driver :
                      </span>
                      <span style={{ fontWeight: 600 }}>{b.user?.name || 'Rider'} ({b.user?.mobile || 'No Mobile'})</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={15} color="var(--text-muted)" /> Request Date :
                      </span>
                      <span style={{ fontWeight: 600 }}>{dateFormatted}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IndianRupee size={15} color="var(--text-muted)" /> Paid Amount :
                      </span>
                      <span style={{ fontWeight: 600, color: '#10b981' }}>₹{(b.total_paid || 0).toLocaleString()}</span>
                    </div>

                    {b.late_submission_paid && (
                      <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#047857', fontWeight: 600, marginTop: '2px' }}>
                        ✅ Late Submission Fee (1 Day Extra) Paid
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons: [View] [Approve] [Reject] */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '1rem', display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setSelected(b)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#334155',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Eye size={15} /> View
                  </button>

                  {isPending && (
                    <>
                      <button 
                        disabled={actionLoading}
                        onClick={() => handleApprove(b._id || b.id)}
                        style={{
                          flex: 1.3,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#10b981',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                        }}
                      >
                        <Check size={16} /> Approve
                      </button>

                      <button 
                        disabled={actionLoading}
                        onClick={() => handleReject(b._id || b.id)}
                        style={{
                          flex: 1.1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #f87171',
                          background: '#fef2f2',
                          color: '#dc2626',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px'
                        }}
                      >
                        <X size={16} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selected && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.55)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }} onClick={() => setSelected(null)}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px',
            padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '90vh', overflowY: 'auto', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#1e293b' }}>Return Request Details</h2>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace' }}>Booking ID: {selected.booking_id || selected._id}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}>
                <X size={22} color="#64748b" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Vehicle Details</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: '#e0e7ff', padding: '10px', borderRadius: '10px' }}><Bike size={24} color="var(--primary)" /></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{selected.vehicle?.registration_number || selected.vehicle?.vehicle_name || 'N/A'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{selected.vehicle?.vehicle_name || 'Electric Vehicle'}</div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Driver / Rider Info</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Name</div>
                    <div style={{ fontWeight: 600 }}>{selected.user?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Mobile No.</div>
                    <div style={{ fontWeight: 600 }}>{selected.user?.mobile || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Email</div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selected.user?.email || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Plan</div>
                    <div style={{ fontWeight: 600 }}>{selected.plan?.plan_name || 'Rental Plan'}</div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Rental & Payment Status</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748b' }}>Grand Total:</span>
                  <span style={{ fontWeight: 700 }}>₹{(selected.grand_total || selected.total_amount || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748b' }}>Total Paid:</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>₹{(selected.total_paid || 0).toLocaleString()}</span>
                </div>
                {selected.additional_charges > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span style={{ color: '#64748b' }}>Additional / Late Charges:</span>
                    <span style={{ fontWeight: 700, color: '#b45309' }}>₹{(selected.additional_charges).toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontSize: '0.95rem' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Return Status:</span>
                  <span style={{ fontWeight: 700, textTransform: 'uppercase', color: selected.return_status === 'submission_pending' ? '#b45309' : selected.return_status === 'approved' ? '#047857' : '#b91c1c' }}>
                    {selected.return_status || 'None'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
              <button 
                onClick={() => setSelected(null)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>

              {selected.return_status === 'submission_pending' && (
                <>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleReject(selected._id || selected.id)}
                    style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #f87171', background: '#fef2f2', color: '#dc2626', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <X size={16} /> Reject Return
                  </button>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleApprove(selected._id || selected.id)}
                    style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
                  >
                    <Check size={16} /> Approve Return
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FReturnPending;
