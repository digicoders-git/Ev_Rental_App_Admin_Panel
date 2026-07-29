import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search, Trash2, Eye, X, UserPlus,
  CheckCircle, XCircle, ShieldCheck, ShieldOff,
  Mail, Clock,
  Lock, EyeOff, Users as UsersIcon, UserCheck, UserX, Ban, Loader2, Edit3, MessageSquare
} from 'lucide-react';
import { getAllUsers, getUserById, addRider, updateUser, deleteUser, addWalletFunds, deductWalletFunds, getUserWalletHistory } from '../services/apiServices';
import useApi from '../services/useApi';
import './Users.css';

const KYC_CONFIG = {
  Approved: { cls: 'badge-success', icon: <CheckCircle size={11} /> },
  Pending:  { cls: 'badge-warning', icon: <Clock size={11} /> },
  Rejected: { cls: 'badge-danger',  icon: <XCircle size={11} /> },
};

const TABS     = ['All', 'Active', 'Blocked'];
const PAGE_SIZE = 6;

const emptyForm = {
  name: '', email: '', phone: '', city: '',
  kyc: 'Pending', status: 'Active', password: '', confirmPassword: '',
};

const Users = () => {
  const [users, setUsers]         = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [viewUser, setViewUser]   = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [showPwd, setShowPwd]     = useState(false);
  const [showCPwd, setShowCPwd]   = useState(false);
  const [walletUser, setWalletUser] = useState(null);
  const [walletForm, setWalletForm] = useState({ amount: '', description: '', action: 'add' });
  const [walletHistory, setWalletHistory] = useState([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [fullDetail, setFullDetail]       = useState(null);
  const [editingNoteUser, setEditingNoteUser] = useState(null);
  const [selectedNoteTag, setSelectedNoteTag] = useState('');
  const [customNoteText, setCustomNoteText] = useState('');
  const { loading, error, call }  = useApi();

  const handleSaveNotes = () => {
    if (!editingNoteUser) return;
    const finalNote = customNoteText.trim();
    call(
      () => updateUser(editingNoteUser.id || editingNoteUser._id, { notes: finalNote }),
      () => {
        setUsers(prev => prev.map(u => (u.id === editingNoteUser.id) ? { ...u, notes: finalNote } : u));
        if (viewUser && viewUser.id === editingNoteUser.id) {
          setViewUser(prev => ({ ...prev, notes: finalNote }));
        }
        setEditingNoteUser(null);
      }
    );
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

  const handleViewDetails = async (u) => {
    setViewUser(u);
    setFullDetail(null);
    setWalletHistory([]);
    setLoadingDetail(true);
    setLoadingWallet(true);
    try {
      const res = await getUserById(u.id);
      if (res.data.success) {
        setFullDetail(res.data.data);
      }

      const resWallet = await getUserWalletHistory(u.id);
      if (resWallet.data.success) {
        setWalletHistory(resWallet.data.data.transactions || []);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
    } finally {
      setLoadingDetail(false);
      setLoadingWallet(false);
    }
  };

  /* ── fetch users ── */
  const fetchUsers = () => {
    call(
      () => getAllUsers(),
      (data) => {
        const usersData = data.users || data.data || data;
        const mapped = usersData
          .filter(u => u.role !== 'admin') // Double protection: filter admins on frontend too
          .map(u => ({
            id: u._id,
            driver_id: u.driver_id,
            name: u.name || '',
            email: u.email || '',
            phone: u.mobile || u.phone || '',
            assigned_vehicle: u.assigned_vehicle || null,
            booking_date: u.booking_date ? new Date(u.booking_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A',
            paid_amount: u.paid_amount || 0,
            due_amount: u.due_amount || 0,
            next_installment_date: u.next_installment_date ? new Date(u.next_installment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
            city: u.city || '',
            kyc: u.isKycVerified ? 'Approved' : 'Pending',
            status: u.status === 'blocked' ? 'Blocked' : 'Active',
            joined: new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            totalRides: u.totalRides || 0,
            totalSpent: u.totalSpent || 0,
            walletBalance: u.wallet_balance || 0,
            notes: u.notes || '',
            franchise_name: (u.franchise_name && u.franchise_name.trim() !== '') ? u.franchise_name : 'Main Branch',
          }));
        setUsers(mapped);
      }
    );
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ── counts ── */
  const counts = {
    All:     users.length,
    Active:  users.filter((u) => u.status === 'Active').length,
    Blocked: users.filter((u) => u.status === 'Blocked').length,
  };
  const kycApproved = users.filter((u) => u.kyc === 'Approved').length;

  /* ── filter ── */
  const filtered = users.filter((u) => {
    const matchTab = activeTab === 'All' || u.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      (u.name || '').toLowerCase().includes(q)  ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.city || '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  /* ── pagination ── */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goPage     = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  const handleTabChange = (t) => { setActiveTab(t); setPage(1); };
  const handleSearch    = (e) => { setSearch(e.target.value); setPage(1); };

  /* ── block / unblock ── */
  const toggleBlock = (id) => {
    const user = users.find(u => u.id === id);
    const newStatus = user.status === 'Active' ? 'blocked' : 'active';
    call(
      () => updateUser(id, { status: newStatus }),
      () => {
        fetchUsers();
        if (viewUser?.id === id) {
          setViewUser(prev => ({ ...prev, status: newStatus === 'blocked' ? 'Blocked' : 'Active' }));
        }
      }
    );
  };

  /* ── delete ── */
  const handleDelete = (id) => {
    call(
      () => deleteUser(id),
      () => {
        setDeleteId(null);
        if (viewUser?.id === id) setViewUser(null);
        fetchUsers();
      }
    );
  };

  /* ── add user ── */
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleAdd = () => {
    if (!form.name || !form.email) return;
    call(
      () => addRider({ name: form.name, email: form.email, mobile: form.phone, password: form.password }),
      () => {
        setForm(emptyForm);
        setShowAdd(false);
        fetchUsers();
      }
    );
  };

  const initials = (name) => (name || 'U').split(' ').map((n) => n ? n[0] : '').join('').slice(0, 2).toUpperCase();

  /* ── manage wallet ── */
  const handleWalletSubmit = () => {
    if (!walletForm.amount || walletForm.amount <= 0) return;
    const apiCall = walletForm.action === 'add' ? addWalletFunds : deductWalletFunds;
    call(
      () => apiCall({ userId: walletUser.id, amount: Number(walletForm.amount), description: walletForm.description }),
      () => {
        setWalletUser(null);
        setWalletForm({ amount: '', description: '', action: 'add' });
        fetchUsers();
      },
      (err) => alert(err || 'Wallet update failed')
    );
  };

  return (
    <div className="users-page">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage all registered users and their access.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
          <UserPlus size={17} /> Add New User
        </button>
      </div>

      {/* Stats */}
      <div className="usr-stats">
        <div className="card usr-stat-card">
          <div className="usr-stat-icon total"><UsersIcon size={19} /></div>
          <div>
            <span className="usr-stat-label">Total Users</span>
            <h3>{users.length}</h3>
          </div>
        </div>
        <div className="card usr-stat-card">
          <div className="usr-stat-icon active"><UserCheck size={19} /></div>
          <div>
            <span className="usr-stat-label">Active</span>
            <h3>{counts.Active}</h3>
          </div>
        </div>
        <div className="card usr-stat-card">
          <div className="usr-stat-icon blocked"><UserX size={19} /></div>
          <div>
            <span className="usr-stat-label">Blocked</span>
            <h3>{counts.Blocked}</h3>
          </div>
        </div>
        <div className="card usr-stat-card">
          <div className="usr-stat-icon kyc"><ShieldCheck size={19} /></div>
          <div>
            <span className="usr-stat-label">KYC Approved</span>
            <h3>{kycApproved}</h3>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">

        {/* Toolbar */}
        <div className="usr-toolbar">
          <div className="filter-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={`filter-tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => handleTabChange(t)}
              >
                {t} <span className="tab-count">{counts[t]}</span>
              </button>
            ))}
          </div>
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search name, email, phone, city..."
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
                <th>#</th>
                <th>User</th>
                <th>Phone</th>
                <th>Vehicle Name</th>
                <th>Vehicle Number</th>
                <th>Booking Date</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Next EMI</th>
                <th>Franchise</th>
                <th>City</th>
                <th>KYC</th>
                <th>Wallet</th>
                <th>Status</th>
                <th>Notes / Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={16} className="usr-empty-row"><Loader2 size={24} className="spin" /><p>Loading users...</p></td></tr>
              ) : error ? (
                <tr><td colSpan={16} className="usr-empty-row" style={{ color: '#ef4444' }}><p>{error}</p></td></tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={16} className="usr-empty-row">
                    <UsersIcon size={28} /><p>No users found.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((u, i) => (
                  <tr key={u.id}>
                    <td className="td-muted">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td>
                      <div className="usr-name-cell">
                        <div className={`usr-avatar ${u.status === 'Blocked' ? 'blocked' : ''}`}>
                          {initials(u.name)}
                        </div>
                        <div>
                          <span className="cell-main">{u.name}</span>
                          <span className="cell-sub">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="td-muted">{u.phone}</td>
                    <td>
                      {u.assigned_vehicle ? (
                        <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                          {u.assigned_vehicle.vehicle_name || 'N/A'}
                        </span>
                      ) : (
                        <span className="badge badge-secondary" style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                          Not Assigned
                        </span>
                      )}
                    </td>
                    <td>
                      {u.assigned_vehicle ? (
                        <span style={{ fontWeight: 600, color: '#334155' }}>
                          {u.assigned_vehicle.registration_number || 'N/A'}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td className="td-muted">{u.booking_date}</td>
                    <td><span style={{ color: '#10b981', fontWeight: 600 }}>₹{u.paid_amount.toLocaleString()}</span></td>
                    <td><span style={{ color: '#ef4444', fontWeight: 600 }}>₹{u.due_amount.toLocaleString()}</span></td>
                    <td>
                      {u.next_installment_date !== 'N/A' ? (
                        <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '3px 6px' }}>{u.next_installment_date}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${u.franchise_name === 'Main Branch' ? 'badge-primary' : 'badge-secondary'}`} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                        {u.franchise_name}
                      </span>
                    </td>
                    <td className="td-muted">{u.city}</td>
                    <td>
                      <span className={`badge badge-icon ${KYC_CONFIG[u.kyc].cls}`}>
                        {KYC_CONFIG[u.kyc].icon} {u.kyc}
                      </span>
                    </td>
                    <td><span className="usr-spent" style={{ color: '#10b981', fontWeight: 600 }}>₹{u.walletBalance.toLocaleString()}</span></td>
                    <td>
                      <span className={`badge badge-icon ${u.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {u.status === 'Active' ? <CheckCircle size={11} /> : <Ban size={11} />}
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {u.notes ? (
                          <span style={{ 
                            background: '#eff6ff', 
                            color: '#1e3a8a', 
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            fontSize: '0.78rem', 
                            fontWeight: 600,
                            border: '1px solid #bfdbfe',
                            display: 'inline-block',
                            maxWidth: '160px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer'
                          }} title={u.notes} onClick={() => { setEditingNoteUser(u); setSelectedNoteTag(u.notes); setCustomNoteText(u.notes); }}>
                            💬 {u.notes}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontStyle: 'italic', cursor: 'pointer' }} onClick={() => { setEditingNoteUser(u); setSelectedNoteTag(''); setCustomNoteText(''); }}>
                            + Add Remark
                          </span>
                        )}
                        <button className="btn-icon" title="Edit Remark/Note" style={{ padding: '4px', height: 'auto', color: '#2563eb' }} onClick={() => { setEditingNoteUser(u); setSelectedNoteTag(u.notes || ''); setCustomNoteText(u.notes || ''); }}>
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="usr-actions">
                        <button className="btn-icon" title="View Details" onClick={() => handleViewDetails(u)}>
                          <Eye size={15} />
                        </button>
                        <button className="btn-icon" title="Manage Wallet" style={{ color: '#10b981' }} onClick={() => setWalletUser(u)}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold' }}>₹</span>
                        </button>
                        <button
                          className={`btn-icon ${u.status === 'Active' ? 'block' : 'unblock'}`}
                          title={u.status === 'Active' ? 'Block User' : 'Unblock User'}
                          onClick={() => toggleBlock(u.id)}
                        >
                          {u.status === 'Active' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                        </button>
                        <button className="btn-icon delete" title="Delete User" onClick={() => setDeleteId(u.id)}>
                          <Trash2 size={15} />
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
          <div className="usr-pagination">
            <span className="pg-info">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} users
            </span>
            <div className="pg-btns">
              <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => goPage(page - 1)}>Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`page-num-btn ${page === p ? 'active' : ''}`} onClick={() => goPage(p)}>{p}</button>
              ))}
              <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => goPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {viewUser && createPortal(
        <div className="modal-overlay" onClick={() => setViewUser(null)}>
          <div className="modal-content usr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="usr-modal-head">
                <div className={`usr-avatar lg ${viewUser.status === 'Blocked' ? 'blocked' : ''}`}>
                  {initials(viewUser.name)}
                </div>
                <div>
                  <h3>{viewUser.name}</h3>
                  <span className="td-muted">ID: {viewUser.driver_id || 'N/A'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <span className={`badge badge-icon ${viewUser.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                  {viewUser.status === 'Active' ? <CheckCircle size={11} /> : <Ban size={11} />}
                  {viewUser.status}
                </span>
                <button className="btn-icon" onClick={() => setViewUser(null)}><X size={20} /></button>
              </div>
            </div>

            <div className="modal-body">
              <div className="usr-detail-grid">

                <div className="usr-detail-section">
                  <div className="usr-detail-title"><Mail size={13} /> Contact Info</div>
                  <div className="usr-detail-rows">
                    <div className="usr-detail-row"><span>Email</span><span>{viewUser.email}</span></div>
                    <div className="usr-detail-row"><span>Phone</span><span>{viewUser.phone}</span></div>
                    <div className="usr-detail-row"><span>City</span><span>{viewUser.city}</span></div>
                    <div className="usr-detail-row"><span>Joined</span><span>{viewUser.joined}</span></div>
                    {fullDetail?.user?.referred_by && (
                      <div className="usr-detail-row">
                        <span>Referred By</span>
                        <span style={{ fontWeight: 600, color: '#10b981' }}>{fullDetail.user.referred_by.name} ({fullDetail.user.referred_by.driver_id})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="usr-detail-section">
                  <div className="usr-detail-title"><ShieldCheck size={13} /> KYC & Activity</div>
                  <div className="usr-detail-rows">
                    <div className="usr-detail-row">
                      <span>KYC Status</span>
                      <span className={`badge badge-icon ${KYC_CONFIG[viewUser.kyc].cls}`} style={{ fontSize: '0.72rem' }}>
                        {KYC_CONFIG[viewUser.kyc].icon} {viewUser.kyc}
                      </span>
                    </div>
                    <div className="usr-detail-row"><span>Wallet Balance</span><span className="usr-spent" style={{ color: '#10b981' }}>₹{viewUser.walletBalance.toLocaleString()}</span></div>
                    <div className="usr-detail-row"><span>Total Rides</span><span>{viewUser.totalRides}</span></div>
                    <div className="usr-detail-row"><span>Total Spent</span><span className="usr-spent">₹{viewUser.totalSpent.toLocaleString()}</span></div>
                    <div className="usr-detail-row">
                      <span>Device Session</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${fullDetail?.user?.isLoggedIn ? 'badge-success' : 'badge-secondary'}`} style={{ fontSize: '0.7rem' }}>
                          {fullDetail?.user?.isLoggedIn ? '🟢 Active on Device' : '⚪ Logged Out'}
                        </span>
                        {fullDetail?.user?.isLoggedIn && (
                          <button className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => {
                            call(() => updateUser(viewUser.id, { isLoggedIn: false }), () => {
                              if (fullDetail?.user) fullDetail.user.isLoggedIn = false;
                              setViewUser({ ...viewUser });
                            });
                          }}>
                            Force Logout
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* KYC Documents Section */}
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <div className="usr-detail-title" style={{ marginBottom: '1rem' }}>
                    <ShieldCheck size={13} /> KYC Documents
                  </div>
                  {loadingDetail ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                      <Loader2 size={16} className="spinner spin" />
                      <span>Loading KYC documents...</span>
                    </div>
                  ) : fullDetail && fullDetail.kyc ? (
                    <div>
                      {/* Document Details (Name and Mobile entered during KYC) */}
                      <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', border: '1px solid #e2e8f0' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>KYC Full Name</span>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{fullDetail.kyc.name || 'N/A'}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>KYC Mobile Number</span>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{fullDetail.kyc.mobileNumber || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Document Images */}
                      {fullDetail.kyc.document ? (
                        <div style={{ maxWidth: '100%' }}>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem' }}>KYC Document File</span>
                          <img 
                            src={getImageUrl(fullDetail.kyc.document)} 
                            alt="KYC Document" 
                            style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getFallbackImageUrl(fullDetail.kyc.document);
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          {fullDetail.kyc.aadharFront && (
                            <div>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginBottom: '0.25rem' }}>Aadhar Front</span>
                              <img 
                                src={getImageUrl(fullDetail.kyc.aadharFront)} 
                                alt="Aadhar Front" 
                                style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getFallbackImageUrl(fullDetail.kyc.aadharFront);
                                }}
                              />
                            </div>
                          )}
                          {fullDetail.kyc.aadharBack && (
                            <div>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginBottom: '0.25rem' }}>Aadhar Back</span>
                              <img 
                                src={getImageUrl(fullDetail.kyc.aadharBack)} 
                                alt="Aadhar Back" 
                                style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getFallbackImageUrl(fullDetail.kyc.aadharBack);
                                }}
                              />
                            </div>
                          )}
                          {fullDetail.kyc.panCard && (
                            <div>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginBottom: '0.25rem' }}>PAN Card</span>
                              <img 
                                src={getImageUrl(fullDetail.kyc.panCard)} 
                                alt="PAN Card" 
                                style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getFallbackImageUrl(fullDetail.kyc.panCard);
                                }}
                              />
                            </div>
                          )}
                          {fullDetail.kyc.selfie && (
                            <div>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginBottom: '0.25rem' }}>Selfie</span>
                              <img 
                                src={getImageUrl(fullDetail.kyc.selfie)} 
                                alt="Selfie" 
                                style={{ width: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = getFallbackImageUrl(fullDetail.kyc.selfie);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                      No KYC record found.
                    </div>
                  )}
                </div>

                {/* Wallet History Section */}
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <div className="usr-detail-title" style={{ marginBottom: '1rem' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> Wallet History
                  </div>
                  {loadingWallet ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                      <Loader2 size={16} className="spinner spin" />
                      <span>Loading wallet history...</span>
                    </div>
                  ) : walletHistory.length > 0 ? (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#fff' }}>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {walletHistory.map((tx, idx) => (
                            <tr key={idx}>
                              <td>{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}</td>
                              <td>{tx.description || (tx.type === 'credit' ? 'Wallet Recharge' : 'Wallet Deduction')}</td>
                              <td style={{ color: tx.type === 'credit' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                      No wallet transactions found.
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="modal-footer">
                <button
                  className={`btn ${viewUser.status === 'Active' ? 'btn-block' : 'btn-unblock'}`}
                  onClick={() => toggleBlock(viewUser.id)}
                  disabled={loading}
                >
                  {loading ? <Loader2 size={15} className="spinner" /> : (
                    viewUser.status === 'Active'
                      ? <><ShieldOff size={15} /> Block User</>
                      : <><ShieldCheck size={15} /> Unblock User</>
                  )}
                </button>
              <button className="btn btn-danger-outline" onClick={() => { setDeleteId(viewUser.id); setViewUser(null); }}>
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showAdd && createPortal(
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content usr-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="btn-icon" onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form className="user-form">

                <div className="form-section-title"><UsersIcon size={13} /> Personal Details</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" placeholder="Enter full name" value={form.name} onChange={f('name')} />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" placeholder="user@example.com" value={form.email} onChange={f('email')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={f('phone')} />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" placeholder="e.g. Bangalore" value={form.city} onChange={f('city')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>KYC Status</label>
                    <select value={form.kyc} onChange={f('kyc')}>
                      <option>Pending</option>
                      <option>Approved</option>
                      <option>Rejected</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Account Status</label>
                    <select value={form.status} onChange={f('status')}>
                      <option>Active</option>
                      <option>Blocked</option>
                    </select>
                  </div>
                </div>

                <div className="form-section-title" style={{ marginTop: '0.5rem' }}><Lock size={13} /> Login Credentials</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Password</label>
                    <div className="pwd-wrap">
                      <input type={showPwd ? 'text' : 'password'} placeholder="Create password" value={form.password} onChange={f('password')} />
                      <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <div className="pwd-wrap">
                      <input type={showCPwd ? 'text' : 'password'} placeholder="Re-enter password" value={form.confirmPassword} onChange={f('confirmPassword')} />
                      <button type="button" className="pwd-toggle" onClick={() => setShowCPwd(!showCPwd)}>
                        {showCPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAdd(false)} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
                {loading ? <Loader2 size={16} className="spinner" /> : 'Create User'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteId && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete User</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-body">
                <div className="delete-icon-wrap"><Trash2 size={26} /></div>
                <p>Are you sure you want to delete <strong>{users.find((u) => u.id === deleteId)?.name}</strong>?</p>
                <p className="delete-sub">All data associated with this user will be permanently removed.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteId(null)} disabled={loading}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)} disabled={loading}>
                {loading ? <Loader2 size={16} className="spinner" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {walletUser && createPortal(
        <div className="modal-overlay" onClick={() => setWalletUser(null)}>
          <div className="modal-content usr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Wallet - {walletUser.name}</h3>
              <button className="btn-icon" onClick={() => setWalletUser(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #d1fae5', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: '#047857', marginBottom: '4px' }}>Current Balance</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#065f46' }}>₹{walletUser.walletBalance.toLocaleString()}</span>
              </div>
              <form className="user-form">
                <div className="form-group">
                  <label>Action</label>
                  <select value={walletForm.action} onChange={e => setWalletForm({...walletForm, action: e.target.value})}>
                    <option value="add">Add Funds</option>
                    <option value="deduct">Deduct Funds</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input type="number" placeholder="Enter amount" value={walletForm.amount} onChange={e => setWalletForm({...walletForm, amount: e.target.value})} min="1" />
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <input type="text" placeholder="e.g. Promotional Bonus" value={walletForm.description} onChange={e => setWalletForm({...walletForm, description: e.target.value})} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setWalletUser(null)} disabled={loading}>Cancel</button>
              <button className={`btn ${walletForm.action === 'add' ? 'btn-primary' : 'btn-danger'}`} onClick={handleWalletSubmit} disabled={loading || !walletForm.amount}>
                {loading ? <Loader2 size={16} className="spinner" /> : (walletForm.action === 'add' ? 'Add Funds' : 'Deduct Funds')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {editingNoteUser && createPortal(
        <div className="modal-overlay" onClick={() => setEditingNoteUser(null)}>
          <div className="modal-content usr-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📝 Driver Notes & Remarks</h3>
              <button className="btn-icon" onClick={() => setEditingNoteUser(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: '1.4' }}>
                Add or update operational remarks for <b>{editingNoteUser.name}</b> ({editingNoteUser.phone}). These comments will be saved dynamically for management reference.
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Quick Select Remark (Client Presets):</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'Good Driver',
                    'Late Payment',
                    'KYC Pending',
                    'Vehicle Damage Reported',
                    'Documents Verified',
                    'Blacklisted Warning',
                    'Follow-up Required',
                    'Clear Note / None'
                  ].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (tag === 'Clear Note / None') {
                          setSelectedNoteTag('');
                          setCustomNoteText('');
                        } else {
                          setSelectedNoteTag(tag);
                          setCustomNoteText(tag);
                        }
                      }}
                      style={{
                        padding: '5px 11px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: customNoteText === tag ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: customNoteText === tag ? '#eff6ff' : '#f8fafc',
                        color: customNoteText === tag ? '#1d4ed8' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {tag === 'Clear Note / None' ? '❌ Clear Note' : `🏷️ ${tag}`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Custom Comment / Detailed Note:</label>
                <textarea
                  rows="3"
                  placeholder="Type any custom comment or remark about driver performance, documents, payment history..."
                  value={customNoteText}
                  onChange={(e) => { setCustomNoteText(e.target.value); setSelectedNoteTag(e.target.value); }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditingNoteUser(null)} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveNotes} disabled={loading}>
                {loading ? <Loader2 size={16} className="spinner" /> : 'Save Remark'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Users;
