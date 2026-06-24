import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Check, X, Eye, User, Calendar, Hash, MapPin,
  ShieldCheck, Clock, Search, Filter, FileText,
  CheckCircle, XCircle, AlertCircle, AlertTriangle, Loader2
} from 'lucide-react';
import { getAllKyc, updateKycStatus } from '../services/apiServices';
import useApi from '../services/useApi';
import './KYC.css';

const kycRequests = [
  {
    id: 1,
    user: 'Arjun Mehra',
    email: 'arjun.mehra@email.com',
    phone: '+91 98765 43210',
    type: 'Driving License',
    docNo: 'DL-KA0120230004567',
    submittedAt: '2 hours ago',
    status: 'Pending',
    docUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=800',
    address: 'Indiranagar, 12th Main, Bangalore',
    dob: '15 Aug 1995',
  },
  {
    id: 2,
    user: 'Sneha Rao',
    email: 'sneha.rao@email.com',
    phone: '+91 91234 56789',
    type: 'Aadhar Card',
    docNo: 'XXXX-XXXX-4589',
    submittedAt: '5 hours ago',
    status: 'Pending',
    docUrl: 'https://images.unsplash.com/photo-1633158829585-23bb8f625673?auto=format&fit=crop&q=80&w=800',
    address: 'Koramangala 4th Block, Bangalore',
    dob: '22 Oct 1998',
  },
  {
    id: 3,
    user: 'Vikram Seth',
    email: 'vikram.seth@email.com',
    phone: '+91 87654 32109',
    type: 'Driving License',
    docNo: 'DL-UP1620210009821',
    submittedAt: 'Yesterday',
    status: 'Pending',
    docUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800',
    address: 'Noida Sector 62, Uttar Pradesh',
    dob: '05 Jan 1992',
  },
  {
    id: 4,
    user: 'Priya Nair',
    email: 'priya.nair@email.com',
    phone: '+91 99887 76655',
    type: 'Aadhar Card',
    docNo: 'XXXX-XXXX-7823',
    submittedAt: '2 days ago',
    status: 'Approved',
    docUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=800',
    address: 'Andheri West, Mumbai',
    dob: '10 Mar 1996',
  },
  {
    id: 5,
    user: 'Rohit Sharma',
    email: 'rohit.sharma@email.com',
    phone: '+91 77665 54433',
    type: 'Driving License',
    docNo: 'DL-MH0220220012345',
    submittedAt: '3 days ago',
    status: 'Rejected',
    docUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=800',
    address: 'Bandra East, Mumbai',
    dob: '28 Jul 1990',
  },
];

const statusConfig = {
  Pending:  { class: 'badge-warning',  icon: <Clock size={12} /> },
  Approved: { class: 'badge-success',  icon: <CheckCircle size={12} /> },
  Rejected: { class: 'badge-danger',   icon: <XCircle size={12} /> },
};

const KYC = () => {
  const [data, setData]               = useState([]);
  const [selected, setSelected]       = useState(null);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [confirmId, setConfirmId]     = useState(null);
  const [rejectId, setRejectId]       = useState(null);
  const [reason, setReason]           = useState("Documents are not clear or mismatched.");
  const { loading, call }             = useApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    call(() => getAllKyc(), (res) => {
      const kycList = res.data || [];
      setData(kycList);
    });
  };

  const getImageUrl = (path) => {
    if (!path || path.trim() === '') return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return encodeURI(`${baseUrl}/${cleanPath}`);
  };

  const getFallbackImageUrl = (path) => {
    if (!path || path.trim() === '') return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return encodeURI(`https://ev-rental-app-backend.onrender.com/${cleanPath}`);
  };

  const pending  = data.filter((r) => r.status === 'pending').length;
  const approved = data.filter((r) => r.status === 'approved').length;
  const rejected = data.filter((r) => r.status === 'rejected').length;

  const filtered = data.filter((r) => {
    const userMatch = r.user?.name?.toLowerCase().includes(search.toLowerCase()) || 
                      r.user?.mobile?.includes(search) ||
                      r.user?.email?.toLowerCase().includes(search.toLowerCase());
    const docMatch = r.mobileNumber?.includes(search) || r.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || r.status === filterStatus.toLowerCase();
    return (userMatch || docMatch) && matchStatus;
  });
  const handleApprove = (id) => {
    call(
      () => updateKycStatus(id, { status: 'approved' }),
      () => {
        fetchData();
        setSelected(null);
        setConfirmId(null);
        alert("KYC approved successfully!");
      }
    );
  };

  const handleReject = (id) => {
    if (!reason.trim()) return;
    call(
      () => updateKycStatus(id, { status: 'rejected', rejectionReason: reason }),
      () => {
        fetchData();
        setSelected(null);
        setRejectId(null);
        alert("KYC rejected.");
      }
    );
  };

  const initials = (name) => name.split(' ').map((n) => n[0]).join('');

  return (
    <div className="kyc-page">
      <div className="page-header">
        <div>
          <h1>KYC Management</h1>
          <p>Review and verify user identity documents.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="kyc-stats">
        <div className="card kyc-stat-card">
          <div className="kyc-stat-icon pending"><Clock size={20} /></div>
          <div>
            <span className="kyc-stat-label">Pending</span>
            <h3>{pending}</h3>
          </div>
        </div>
        <div className="card kyc-stat-card">
          <div className="kyc-stat-icon approved"><CheckCircle size={20} /></div>
          <div>
            <span className="kyc-stat-label">Approved</span>
            <h3>{approved}</h3>
          </div>
        </div>
        <div className="card kyc-stat-card">
          <div className="kyc-stat-icon rejected"><XCircle size={20} /></div>
          <div>
            <span className="kyc-stat-label">Rejected</span>
            <h3>{rejected}</h3>
          </div>
        </div>
        <div className="card kyc-stat-card">
          <div className="kyc-stat-icon total"><ShieldCheck size={20} /></div>
          <div>
            <span className="kyc-stat-label">Total</span>
            <h3>{data.length}</h3>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        {/* Toolbar */}
        <div className="kyc-toolbar">
          <h3>KYC Requests</h3>
          <div className="kyc-toolbar-right">
            <div className="search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search user, doc type, doc no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-tabs">
              {['All', 'Pending', 'Approved', 'Rejected'].map((s) => (
                <button
                  key={s}
                  className={`filter-tab ${filterStatus === s ? 'active' : ''}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Document Type</th>
                <th>Document No.</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="kyc-empty-row">
                    <ShieldCheck size={28} />
                    <p>No KYC requests found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((req, i) => (
                  <tr key={req._id}>
                    <td className="td-muted">{i + 1}</td>
                    <td>
                      <div className="kyc-user-cell">
                        <div className="kyc-avatar">{initials(req.user?.name || 'User')}</div>
                        <div>
                          <span className="kyc-user-name">{req.user?.name}</span>
                          <span className="kyc-user-email">{req.user?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="kyc-doc-cell" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 500 }}>
                          <FileText size={14} /> Document Uploaded
                        </span>
                      </div>
                    </td>
                    <td><span className="doc-no-badge">{req.user?.mobile}</span></td>
                    <td className="td-muted">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${req.status === 'approved' ? 'badge-success' : req.status === 'rejected' ? 'badge-danger' : 'badge-warning'} badge-icon`}>
                        {req.status === 'approved' ? <CheckCircle size={12} /> : req.status === 'rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="kyc-action-btns">
                        <button
                          className="btn-icon"
                          title="View Details"
                          onClick={() => setSelected(req)}
                        >
                          <Eye size={16} />
                        </button>
                        {req.status === 'pending' && (
                          <>
                            <button
                              className="btn-icon approve"
                              title="Approve"
                              onClick={() => setConfirmId(req._id)}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="btn-icon reject"
                              title="Reject"
                              onClick={() => setRejectId(req._id)}
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && createPortal(
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content kyc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="kyc-modal-user">
                <div className="kyc-avatar lg">{initials(selected.user?.name || 'U')}</div>
                <div>
                  <h3>{selected.user?.name}</h3>
                  <span className="td-muted">{selected.user?.mobile}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`badge ${selected.status === 'approved' ? 'badge-success' : selected.status === 'rejected' ? 'badge-danger' : 'badge-warning'} badge-icon`}>
                  {selected.status === 'approved' ? <CheckCircle size={12} /> : selected.status === 'rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                  {selected.status.toUpperCase()}
                </span>
                <button className="btn-icon" onClick={() => setSelected(null)}><X size={20} /></button>
              </div>
            </div>

            <div className="modal-body kyc-modal-body" style={{ maxHeight: '80vh', overflowY: 'auto', padding: '1.5rem' }}>
              {/* Document Previews */}
              <div className="kyc-docs-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Identity Documents */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {selected.document ? (
                    <div className="kyc-doc-card" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                        <ShieldCheck size={16} /> KYC Document
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                        <div className="kyc-img-box" style={{ width: '100%', maxWidth: '400px' }}>
                          <img 
                            src={getImageUrl(selected.document)} 
                            alt="KYC Document" 
                            style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getFallbackImageUrl(selected.document);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      {selected.aadharFront && (
                        <div className="kyc-doc-card" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Aadhar Front</h4>
                          <img 
                            src={getImageUrl(selected.aadharFront)} 
                            alt="Aadhar Front" 
                            style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getFallbackImageUrl(selected.aadharFront);
                            }}
                          />
                        </div>
                      )}
                      {selected.aadharBack && (
                        <div className="kyc-doc-card" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Aadhar Back</h4>
                          <img 
                            src={getImageUrl(selected.aadharBack)} 
                            alt="Aadhar Back" 
                            style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getFallbackImageUrl(selected.aadharBack);
                            }}
                          />
                        </div>
                      )}
                      {selected.panCard && (
                        <div className="kyc-doc-card" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>PAN Card</h4>
                          <img 
                            src={getImageUrl(selected.panCard)} 
                            alt="PAN Card" 
                            style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getFallbackImageUrl(selected.panCard);
                            }}
                          />
                        </div>
                      )}
                      {selected.selfie && (
                        <div className="kyc-doc-card" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Selfie</h4>
                          <img 
                            src={getImageUrl(selected.selfie)} 
                            alt="Selfie" 
                            style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getFallbackImageUrl(selected.selfie);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Data Grid Section */}
              <div style={{ marginTop: '2rem', background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Personal Verification Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="detail-item">
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.25rem' }}>FULL NAME</label>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{selected.user?.name}</span>
                  </div>
                  <div className="detail-item">
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.25rem' }}>MOBILE NUMBER</label>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{selected.user?.mobile}</span>
                  </div>
                  <div className="detail-item" style={{ gridColumn: '1/-1' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.25rem' }}>RESIDENTIAL ADDRESS</label>
                    <span style={{ fontWeight: '500', fontSize: '0.9rem', color: 'var(--text-main)' }}>{selected.user?.address || 'Not Provided'}</span>
                  </div>
                  <div className="detail-item">
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.25rem' }}>DATE OF BIRTH</label>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{selected.user?.dob || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '0.25rem' }}>SUBMISSION DATE</label>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{new Date(selected.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {selected.status === 'rejected' && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fee2e2', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#b91c1c', fontWeight: '800', marginBottom: '0.25rem' }}>REJECTION REASON</label>
                    <span style={{ color: '#b91c1c', fontSize: '0.9rem', fontWeight: '600' }}>{selected.rejectionReason}</span>
                  </div>
                )}
              </div>
            </div>

            {selected.status === 'pending' && (
              <div className="modal-footer">
                <button
                  className="btn btn-outline reject-btn"
                  onClick={() => setRejectId(selected._id)}
                >
                  <XCircle size={16} /> Reject
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setConfirmId(selected._id)}
                >
                  <CheckCircle size={16} /> Approve
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── APPROVE CONFIRMATION ── */}
      {confirmId && createPortal(
        <div className="modal-overlay" onClick={() => setConfirmId(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Approve KYC</h3>
              <button className="btn-icon" onClick={() => setConfirmId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-body">
                <div className="delete-icon-wrap" style={{ background: '#dcfce7', color: '#10b981' }}>
                  <Check size={28} />
                </div>
                <p>Are you sure you want to <strong>Approve</strong> this KYC request?</p>
                <p className="delete-sub">The user will be able to book vehicles immediately after approval.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setConfirmId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleApprove(confirmId)} disabled={loading}>
                {loading ? <Loader2 size={16} className="spinner" /> : 'Yes, Approve KYC'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── REJECT MODAL ── */}
      {rejectId && createPortal(
        <div className="modal-overlay" onClick={() => setRejectId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Reject KYC Request</h3>
              <button className="btn-icon" onClick={() => setRejectId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div className="delete-icon-wrap" style={{ background: '#fee2e2', color: '#ef4444', margin: '0 auto 1rem' }}>
                  <AlertTriangle size={28} />
                </div>
                <p style={{ fontWeight: '600' }}>Please provide a reason for rejection.</p>
                <p className="delete-sub">This will be shown to the user so they can fix their documents.</p>
              </div>
              <div className="form-group">
                <label>Rejection Reason</label>
                <textarea 
                  rows={4} 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Identity proof is not clear..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setRejectId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleReject(rejectId)} disabled={loading || !reason.trim()}>
                {loading ? <Loader2 size={16} className="spinner" /> : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default KYC;
