import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FileSignature, FileText, Clock, 
  Building2, X, MapPin, Plus, Search, TrendingUp,
  Users, Car, XCircle, CheckCircle, Eye, DollarSign, 
  KeyRound, Eye as EyeIcon, EyeOff, Phone, Mail, User, Lock, Loader2, Trash2, AlertTriangle,
  History, Pencil, Navigation, Crosshair, ExternalLink, Download
} from 'lucide-react';
import { 
  getFranchiseEnquiries, getAllStores, createStore, deleteStore, getStoreById,
  updateEnquiryStatus, getFranchisePerformance, getDashboardStats, getFranchiseHistory,
  uploadStoreAgreement, getAllWithdrawalsAdmin, 
  releaseFranchiseFundsAdmin, updateFranchiseWithdrawalStatusAdmin
} from '../services/apiServices';
import useApi from '../services/useApi';
import './Franchise.css';
import SettlementBillModal from '../components/SettlementBillModal';

const Franchise = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchPartners, setSearchPartners] = useState('');
  
  const [stores, setStores] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [dashStats, setDashStats] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [activeTab, setActiveTab] = useState('partners');
  const [subTab, setSubTab] = useState('pending');
  const initialFormState = {
    store_name: '', owner_name: '', mobile: '', email: '', 
    address: '', city: '', state: '', password: '', confirmPassword: '',
    payment_model: 'platform', franchise_share_percentage: 80,
    razorpay_linked_account_id: '', razorpay_key_id: '', razorpay_key_secret: ''
  };

  const [form, setForm] = useState(initialFormState);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { loading, call } = useApi();

  // ── Map Picker State ──
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
  const [mapSearching, setMapSearching] = useState(false);
  const [mapPreviewUrl, setMapPreviewUrl] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [pickedCoords, setPickedCoords] = useState({ lat: '', lng: '' });

  const openMapPicker = () => {
    setPickedCoords({ lat: form.latitude || '', lng: form.longitude || '' });
    setMapSearch('');
    if (form.latitude && form.longitude) {
      setMapPreviewUrl(`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=16&output=embed`);
    } else {
      setMapPreviewUrl('');
    }
    setShowMapPicker(true);
  };

  const searchMapLocation = async () => {
    if (!mapSearch.trim()) return;
    setMapSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearch)}&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setPickedCoords({ lat: parseFloat(lat).toFixed(6), lng: parseFloat(lon).toFixed(6) });
        setMapPreviewUrl(`https://maps.google.com/maps?q=${lat},${lon}&z=16&output=embed`);
      } else {
        alert('Location not found. Try a more specific address.');
      }
    } catch {
      alert('Search failed. Please try again.');
    }
    setMapSearching(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported by your browser.');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setPickedCoords({ lat, lng });
        setMapPreviewUrl(`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`);
        setGpsLoading(false);
      },
      () => { alert('Could not get your location. Please allow location access.'); setGpsLoading(false); }
    );
  };

  const confirmMapLocation = () => {
    if (!pickedCoords.lat || !pickedCoords.lng) return alert('Please set a location first.');
    setForm(f => ({ ...f, latitude: pickedCoords.lat, longitude: pickedCoords.lng }));
    setShowMapPicker(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    call(() => getDashboardStats(), (res) => setDashStats(res.data));
    call(() => getFranchisePerformance(), (res) => setPerformance(res.data || []));
    call(() => getFranchiseEnquiries(), (res) => setEnquiries(res.data?.data || res.data || []));
    call(() => getAllStores(), (res) => setStores(res.data?.data || res.data || []));
    call(() => getAllWithdrawalsAdmin(), (res) => setWithdrawals(res.data?.data || res.data || []));
  };

  const handleEnquiryAction = (id, status) => {
    call(() => updateEnquiryStatus(id, { status }), () => {
      fetchData();
      if (status === 'approved') alert("Enquiry approved and partner onboarded!");
    }, (err) => alert(err.message || "Failed to update enquiry"));
  };

  const handleOnboard = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    call(() => createStore(form), () => {
      setShowAddModal(false);
      setForm(initialFormState);
      fetchData();
      alert("Partnership created successfully!");
    }, (err) => alert(err.message || "Failed to create partnership"));
  };

  const handleEditClick = (f) => {
    setEditId(f._id);
    setForm({
      store_name: f.store_name || '',
      owner_name: f.owner_name || '',
      mobile: f.mobile || '',
      email: f.email || '',
      address: f.address || '',
      city: f.city || '',
      state: f.state || '',
      password: '',
      confirmPassword: '',
      payment_model: f.payment_model || 'platform',
      franchise_share_percentage: f.franchise_share_percentage || 80,
      razorpay_linked_account_id: f.razorpay_linked_account_id || '',
      razorpay_key_id: f.razorpay_key_id || '',
      razorpay_key_secret: f.razorpay_key_secret || '',
      latitude: f.latitude || '',
      longitude: f.longitude || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    import('../services/apiServices').then(({ updateStore }) => {
      const updateData = { ...form };
      if (!updateData.password) {
        delete updateData.password;
      }
      delete updateData.confirmPassword;

      call(() => updateStore(editId, updateData), () => {
        setShowEditModal(false);
        setForm(initialFormState);
        setEditId(null);
        fetchData();
        alert("Partnership updated successfully!");
      }, (err) => alert(err.message || "Failed to update partnership"));
    });
  };

  const handleDeleteStore = (id) => {
    call(() => deleteStore(id), () => {
      setDeleteId(null);
      fetchData();
    }, (err) => alert(err.message || "Failed to delete franchise"));
  };

  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAllRequestsModal, setShowAllRequestsModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementFile, setAgreementFile] = useState(null);

  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [newWithdrawalStatus, setNewWithdrawalStatus] = useState('processing');

  const handleReleaseFunds = (franchiseId) => {
    if (!window.confirm("Are you sure you want to release the full wallet balance for this franchise?")) return;
    call(() => releaseFranchiseFundsAdmin({ franchiseId }), () => {
      fetchData();
      alert("Funds released successfully! Settlement initiated.");
    }, (err) => alert(err.message || "Failed to release funds"));
  };

  const [historyPartner, setHistoryPartner] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState('overview');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  const openViewModal = (partner) => {
    call(() => getStoreById(partner._id), (res) => {
      setSelectedPartner(res.data); // res.data contains { store, assigned_vehicles }
      setShowViewModal(true);
    });
  };

  const openHistoryModal = (partner) => {
    setActiveHistoryTab('overview');
    setHistoryStartDate('');
    setHistoryEndDate('');
    call(() => getFranchiseHistory(partner._id), (res) => {
      setHistoryPartner(res.data);
      setShowHistoryModal(true);
    });
  };

  const applyHistoryDateFilter = () => {
    if (!historyPartner?.store?._id) return;
    call(() => getFranchiseHistory(historyPartner.store._id, historyStartDate, historyEndDate), (res) => {
      setHistoryPartner(res.data);
    });
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  const chartData = performance.map((p, i) => ({
    name: p.store_name,
    revenue: p.total_revenue,
    color: COLORS[i % COLORS.length]
  }));

  const formatRevenue = (val) => {
    if (!val) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  const statsList = [
    { label: 'Total Partners', value: dashStats?.franchise?.total_stores || 0, icon: <Building2 size={20} /> },
    { label: 'Total Vehicles', value: dashStats?.fleet?.total || 0, icon: <Car size={20} /> },
    { label: 'Total Revenue', value: formatRevenue(dashStats?.revenue?.total), icon: <TrendingUp size={20} /> },
    { label: 'Pending Apps', value: enquiries.length, icon: <Users size={20} /> },
  ];

  return (
    <div className="franchise-page">
      <div className="page-header">
        <div>
          <h1>Franchise Network</h1>
          <p>Expand and manage your TRIS Electric partner ecosystem.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(initialFormState); setShowAddModal(true); }}>
          <Plus size={18} />
          <span>Add New Partner</span>
        </button>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <button onClick={() => setActiveTab('partners')} style={{ background: activeTab === 'partners' ? 'var(--primary)' : 'transparent', color: activeTab === 'partners' ? '#fff' : 'var(--text)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Partners & Applications</button>
        <button onClick={() => setActiveTab('withdrawals')} style={{ background: activeTab === 'withdrawals' ? 'var(--primary)' : 'transparent', color: activeTab === 'withdrawals' ? '#fff' : 'var(--text)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Withdrawals {withdrawals.filter(w => w.status === 'pending').length > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '10px' }}>{withdrawals.filter(w => w.status === 'pending').length}</span>}
        </button>
      </div>
      
      {activeTab === 'partners' && (
        <>
      <div className="franchise-stats">
        {statsList.map((stat, i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem' }}>
            <div className="app-icon">{stat.icon}</div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>{stat.label}</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        <button
          onClick={() => setSubTab('pending')}
          style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
            background: subTab === 'pending' ? '#fff' : 'transparent',
            color: subTab === 'pending' ? '#f59e0b' : '#64748b',
            boxShadow: subTab === 'pending' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          ⏳ Pending Applications
          {enquiries.filter(e => e.status === 'new').length > 0 && (
            <span style={{ background: '#f59e0b', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontSize: '11px', fontWeight: 700 }}>
              {enquiries.filter(e => e.status === 'new').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab('active')}
          style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
            background: subTab === 'active' ? '#fff' : 'transparent',
            color: subTab === 'active' ? '#10b981' : '#64748b',
            boxShadow: subTab === 'active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          ✅ Active Partners
          <span style={{ background: '#10b981', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontSize: '11px', fontWeight: 700 }}>
            {stores.length}
          </span>
        </button>
      </div>

      {/* Pending Applications Tab */}
      {subTab === 'pending' && (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem' }}>Pending Applications</h3>
          <button className="btn-text" onClick={() => setShowAllRequestsModal(true)}>View All Requests</button>
        </div>
        <div className="application-grid">
          {enquiries.filter(e => e.status === 'new').length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1/-1' }}>
              No new pending applications found.
            </div>
          ) : (
            enquiries.filter(e => e.status === 'new').map((req) => (
              <div key={req._id} className="application-card">
                <div className="app-info-group">
                  <div className="app-icon">
                    <Building2 size={24} />
                  </div>
                  <div className="app-text">
                    <h4>{req.full_name}</h4>
                    <div className="app-meta">
                      <span><MapPin size={12} /> {req.city}, {req.state}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Phone size={11} /> {req.phone_number}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Mail size={11} /> {req.email}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="app-actions">
                  <button className="btn-icon" style={{ color: '#ef4444' }} title="Reject" onClick={() => handleEnquiryAction(req._id, 'rejected')}><XCircle size={20} /></button>
                  <button className="btn-icon" style={{ color: 'var(--primary)' }} title="Approve" onClick={() => handleEnquiryAction(req._id, 'approved')}><CheckCircle size={20} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      )}

      {/* Active Partners Tab */}
      {subTab === 'active' && (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem' }}>Active Partners</h3>
          <div className="search-wrapper" style={{ maxWidth: '300px' }}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search partners..." 
              value={searchPartners}
              onChange={(e) => setSearchPartners(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.25rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem' }} 
            />
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Franchise ID</th>
                <th>Franchise Name</th>
                <th>Owner Details</th>
                <th>Location</th>
                <th>Fleet Size</th>
                <th>Revenue (MTD)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.filter(s => 
                s.store_name?.toLowerCase().includes(searchPartners.toLowerCase()) ||
                s.owner_name?.toLowerCase().includes(searchPartners.toLowerCase())
              ).map((f) => (
                <tr key={f._id}>
                  <td>
                    <span style={{ fontWeight: '500', color: 'var(--text-main)', fontFamily: 'monospace' }}>
                      {f.franchise_id || f.store_id || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{ fontWeight: '600', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline dotted' }}
                      onClick={() => openHistoryModal(f)}
                      title="Click to view history"
                    >{f.store_name}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => openHistoryModal(f)} title="Click to view history">
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--primary)' }}>{f.owner_name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.mobile}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={14} color="var(--text-muted)" /> {f.city}, {f.state}
                    </span>
                  </td>
                  <td><span style={{ fontWeight: '600' }}>{performance.find(p => p._id === f._id)?.total_bookings || 0} Units</span></td>
                  <td><span className="revenue-text">₹{((performance.find(p => p._id === f._id)?.total_revenue || 0) / 1000).toFixed(1)}k</span></td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
                      <span className="status-dot" style={{ background: f.status === 'active' ? '#10b981' : '#f59e0b' }}></span> 
                      {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-icon" title="View Profile" onClick={() => openViewModal(f)}><Eye size={16} /></button>
                      <button className="btn-icon" title="Edit Franchise" onClick={() => handleEditClick(f)} style={{ color: '#3b82f6' }}><Pencil size={16} /></button>
                      <button className="btn-icon history" title="View History" onClick={() => openHistoryModal(f)} style={{ color: '#8b5cf6' }}><History size={16} /></button>
                      <button className="btn-icon" title="Upload Agreement" onClick={() => { setSelectedPartner(f); setShowAgreementModal(true); }} style={{ color: '#10b981' }}><FileSignature size={16} /></button>
                      {(f.latitude && f.longitude) && (
                        <button className="btn-icon" title="View on Map" style={{ color: '#ef4444' }}
                          onClick={() => window.open(`https://www.google.com/maps?q=${f.latitude},${f.longitude}`, '_blank')}>
                          <MapPin size={16} />
                        </button>
                      )}
                      <button className="btn-icon delete" title="Delete Franchise" onClick={() => setDeleteId(f._id)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
      </>
      )}

      {activeTab === 'withdrawals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Active Franchise Wallets</h3>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Franchise ID</th>
                    <th>Store Name</th>
                    <th>Owner</th>
                    <th>Wallet Balance</th>
                    <th>Next Settlement</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.filter(s => s.status === 'active').length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No active franchises found</td></tr>
                  ) : stores.filter(s => s.status === 'active').map(s => (
                    <tr key={s._id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{s.store_id}</td>
                      <td style={{ fontWeight: 600 }}>{s.store_name}</td>
                      <td>{s.owner_name}<br/><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.mobile}</span></td>
                      <td style={{ fontWeight: 700, color: '#10b981', fontSize: '1.1rem' }}>₹{(s.wallet_balance || 0).toLocaleString()}</td>
                      <td>Tuesday</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary" 
                          onClick={() => handleReleaseFunds(s._id)}
                          disabled={!s.wallet_balance || s.wallet_balance <= 0}
                        >
                          Release Funds
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Settlements & Withdrawal Requests</h3>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Franchise</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No withdrawal requests found</td></tr>
                  ) : withdrawals.map(w => (
                    <tr key={w._id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{w.withdrawal_id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{w.franchise?.store_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.franchise?.owner_name} | {w.franchise?.mobile}</div>
                      </td>
                      <td>{new Date(w.createdAt).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: '#10b981' }}>₹{w.amount.toLocaleString()}</td>
                      <td>
                        <span style={{ 
                          color: (w.status === 'approved' || w.status === 'released') ? '#10b981' : (w.status === 'rejected' || w.status === 'failed') ? '#ef4444' : w.status === 'processing' ? '#3b82f6' : '#f59e0b', 
                          display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.05)', 
                          padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem' 
                        }}>
                          {(w.status === 'approved' || w.status === 'released') ? <CheckCircle size={14}/> : (w.status === 'rejected' || w.status === 'failed') ? <XCircle size={14}/> : w.status === 'processing' ? <Loader2 size={14} className="spin-anim"/> : <Clock size={14}/>}
                          {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button className="btn btn-sm btn-outline" onClick={() => { 
                            setSelectedWithdrawal(w); 
                            setNewWithdrawalStatus(w.status === 'pending' ? 'processing' : w.status);
                            setShowWithdrawalModal(true); 
                          }}>Update Status</button>
                          
                          <button className="btn btn-sm" onClick={() => setSelectedBill(w)} style={{ background: '#e2e8f0', color: '#0f172a', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <FileText size={14} /> View Bill
                          </button>

                          {w.payment_proof && (
                            <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${w.payment_proof}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem', background: '#eff6ff', padding: '4px 8px', borderRadius: '4px' }}><Download size={14} /> Proof</a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(showAddModal || showEditModal) && createPortal(
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showEditModal ? 'Edit Partner' : 'Onboard New Partner'}</h3>
              <button className="btn-icon" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form className="user-form" id="onboard-form" onSubmit={showEditModal ? handleUpdate : handleOnboard}>

                {/* Section 1: Business Info */}
                <div className="form-section-title">
                  <Building2 size={15} />
                  Business Information
                </div>

                <div className="form-group">
                  <label>Franchise / Business Name</label>
                  <input type="text" placeholder="e.g. GreenRide Bangalore" required value={form.store_name} onChange={e => setForm({...form, store_name: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Operating City</label>
                    <input type="text" placeholder="e.g. Mumbai" required value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Operating State</label>
                    <input type="text" placeholder="e.g. Maharashtra" required value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Full Business Address</label>
                  <input type="text" placeholder="Complete office/hub address" required value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>

                {/* Section 2: Owner Info */}
                <div className="form-section-title" style={{ marginTop: '1.25rem' }}>
                  <User size={15} />
                  Owner Details
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Owner Full Name</label>
                    <input type="text" placeholder="Enter owner name" required value={form.owner_name} onChange={e => setForm({...form, owner_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="input-icon-wrap">
                      <Phone size={15} className="input-icon" />
                      <input type="tel" placeholder="+91 98765 43210" required value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Section 3: Login Credentials */}
                <div className="form-section-title" style={{ marginTop: '1.25rem' }}>
                  <KeyRound size={15} />
                  Login Credentials
                </div>

                <div className="form-group">
                  <label>Login Email</label>
                  <div className="input-icon-wrap">
                    <Mail size={15} className="input-icon" />
                    <input type="email" placeholder="franchise@example.com" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Password {showEditModal && "(Leave blank to keep current)"}</label>
                    <div className="input-icon-wrap">
                      <Lock size={15} className="input-icon" />
                      <input type={showPassword ? 'text' : 'password'} placeholder={showEditModal ? "New password" : "Create password"} required={!showEditModal} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                      <button type="button" className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={15} /> : <EyeIcon size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <div className="input-icon-wrap">
                      <Lock size={15} className="input-icon" />
                      <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter password" required={!!form.password} value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} />
                      <button type="button" className="input-icon-right" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff size={15} /> : <EyeIcon size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 4: Payment Gateway Configuration */}
                <div className="form-section-title" style={{ marginTop: '1.25rem' }}>
                  <DollarSign size={15} />
                  Payment Gateway Configuration
                </div>
                <div className="form-group">
                  <label>Payment Model</label>
                  <select style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)' }} required value={form.payment_model} onChange={e => setForm({...form, payment_model: e.target.value})}>
                    <option value="platform">Platform (Default)</option>
                    <option value="split">Split / Route</option>
                    <option value="direct">Direct</option>
                  </select>
                </div>
                {form.payment_model === 'split' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Franchise Share Percentage (%)</label>
                      <input type="number" required value={form.franchise_share_percentage} onChange={e => setForm({...form, franchise_share_percentage: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Razorpay Linked Account ID</label>
                      <input type="text" placeholder="acc_..." required value={form.razorpay_linked_account_id} onChange={e => setForm({...form, razorpay_linked_account_id: e.target.value})} />
                    </div>
                  </div>
                )}
                {form.payment_model === 'direct' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Razorpay Key ID</label>
                      <input type="text" placeholder="rzp_..." required value={form.razorpay_key_id} onChange={e => setForm({...form, razorpay_key_id: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Razorpay Key Secret</label>
                      <input type="text" placeholder="..." required value={form.razorpay_key_secret} onChange={e => setForm({...form, razorpay_key_secret: e.target.value})} />
                    </div>
                  </div>
                )}

                {/* Section 5: Hub Location */}
                <div className="form-section-title" style={{ marginTop: '1.25rem' }}>
                  <MapPin size={15} />
                  Hub Location (for Driver Navigation)
                </div>

                {/* Location Preview Card */}
                <div style={{ background: '#f8fafc', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
                  {form.latitude && form.longitude ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '7px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={14} color="#10b981" />
                          </div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#10b981' }}>Location Set ✓</span>
                        </div>
                        <button type="button" onClick={() => window.open(`https://www.google.com/maps?q=${form.latitude},${form.longitude}`, '_blank')}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                          <ExternalLink size={12} /> Preview
                        </button>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)', background: '#fff', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        📍 {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <MapPin size={16} />
                      <span>No location set yet. Click below to pick hub location.</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={openMapPicker}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <MapPin size={15} />
                    {form.latitude && form.longitude ? 'Change Location' : 'Pick Location on Map'}
                  </button>
                  {form.latitude && form.longitude && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, latitude: '', longitude: '' }))}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                      <X size={14} /> Clear
                    </button>
                  )}
                </div>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.4rem', display: 'block' }}>📍 Set coordinates so drivers can navigate directly to this hub via Google Maps.</small>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Cancel</button>
              <button className="btn btn-primary" type="submit" form="onboard-form" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : (showEditModal ? "Update Partnership" : "Create Partnership")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View Partner Modal */}
      {showViewModal && selectedPartner && createPortal(
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="app-icon" style={{ width: '40px', height: '40px', borderRadius: '10px' }}><Building2 size={20} /></div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Franchise Partnership Profile</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detailed business and operational overview</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowViewModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="veh-detail-grid">
                <div className="veh-detail-section" style={{ flex: 1, padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div className="veh-detail-section-title" style={{ color: 'var(--primary)', marginBottom: '1rem', borderBottom: '2px solid var(--primary-light)', paddingBottom: '0.5rem' }}>Store Information</div>
                  <div className="veh-detail-rows">
                    <div className="veh-info-item" style={{ marginBottom: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Store Name</label>
                      <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>{selectedPartner.store?.store_name}</span>
                    </div>
                    <div className="veh-info-item" style={{ marginBottom: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Franchise ID</label>
                      <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', background: 'var(--primary-light)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace' }}>{selectedPartner.store?.franchise_id || selectedPartner.store?.store_id}</span>
                    </div>
                    <div className="veh-info-item" style={{ marginBottom: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Operating City</label>
                      <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>{selectedPartner.store?.city}, {selectedPartner.store?.state}</span>
                    </div>
                    <div className="veh-info-item">
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Full Address</label>
                      <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-main)', display: 'block', lineHeight: '1.4' }}>{selectedPartner.store?.address}</span>
                    </div>
                  </div>
                </div>
                <div className="veh-detail-section" style={{ flex: 1, padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div className="veh-detail-section-title" style={{ color: '#10b981', marginBottom: '1rem', borderBottom: '2px solid #dcfce7', paddingBottom: '0.5rem' }}>Owner Details</div>
                  <div className="veh-detail-rows">
                    <div className="veh-info-item" style={{ marginBottom: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Owner Name</label>
                      <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>{selectedPartner.store?.owner_name}</span>
                    </div>
                    <div className="veh-info-item" style={{ marginBottom: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Contact Number</label>
                      <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)' }}>{selectedPartner.store?.mobile}</span>
                    </div>
                    <div className="veh-info-item" style={{ marginBottom: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Business Email</label>
                      <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', wordBreak: 'break-all' }}>{selectedPartner.store?.email}</span>
                    </div>
                    <div className="veh-info-item">
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Partner Status</label>
                      <span className="status-badge" style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        background: '#dcfce7',
                        color: '#15803d',
                        display: 'inline-block'
                      }}>{selectedPartner.store?.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agreements Section */}
              <div className="veh-detail-section" style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div className="veh-detail-section-title" style={{ color: '#8b5cf6', marginBottom: '1rem', borderBottom: '2px solid #ede9fe', paddingBottom: '0.5rem' }}>Agreements</div>
                  <div className="veh-detail-rows" style={{ display: 'flex', gap: '2rem' }}>
                    <div className="veh-info-item" style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Admin Agreement</label>
                      {selectedPartner.store?.admin_agreement_document ? (
                        <a href={`${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '')}${selectedPartner.store.admin_agreement_document}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                          <Eye size={14} /> View Admin Signed
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Not uploaded</span>
                      )}
                    </div>
                    <div className="veh-info-item" style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Franchise Agreement</label>
                      {selectedPartner.store?.franchise_agreement_document ? (
                        <a href={`${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '')}${selectedPartner.store.franchise_agreement_document}`} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 0.8rem', borderColor: '#10b981', color: '#10b981' }}>
                          <Eye size={14} /> View Franchise Signed
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Not uploaded</span>
                      )}
                    </div>
                  </div>
                </div>

              {/* Assigned EVs Section */}
              <div className="veh-detail-section" style={{ marginTop: '1.5rem' }}>
                <div className="veh-detail-section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Assigned EV Fleet</span>
                  <span style={{ fontSize: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.1rem 0.6rem', borderRadius: '12px' }}>
                    {selectedPartner.assigned_vehicles?.length || 0} Units
                  </span>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  {selectedPartner.assigned_vehicles?.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      No vehicles currently assigned to this franchise.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      {selectedPartner.assigned_vehicles.map((veh) => (
                        <div key={veh._id} style={{ 
                          padding: '0.75rem', 
                          background: '#fff', 
                          border: '1px solid var(--border)', 
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}>
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            background: '#f1f5f9', 
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)'
                          }}>
                            <Car size={20} />
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600' }}>{veh.vehicle_name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{veh.registration_number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card" style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Performance</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>
                      ₹{((performance.find(p => p._id === selectedPartner.store?._id)?.total_revenue || 0) / 1000).toFixed(1)}k Total Revenue
                    </h4>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Operational Health</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#10b981' }}>Active</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setShowViewModal(false)}>Close Detail View</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── FRANCHISE HISTORY DETAIL MODAL ── */}
      {showHistoryModal && historyPartner && createPortal(
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content modal-xl" style={{ maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 min-content' }}>
                <div className="app-icon" style={{ width: '48px', height: '48px', minWidth: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <History size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                    {historyPartner.store?.store_name} History
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    <span>Owner: <strong>{historyPartner.store?.owner_name}</strong> | ID: </span>
                    <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}>{historyPartner.store?.store_id}</span>
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="date" value={historyStartDate} onChange={e => setHistoryStartDate(e.target.value)} style={{ padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--bg-card)', minWidth: '130px' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>to</span>
                  <input type="date" value={historyEndDate} onChange={e => setHistoryEndDate(e.target.value)} style={{ padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--bg-card)', minWidth: '130px' }} />
                  <button className="btn btn-primary" onClick={applyHistoryDateFilter} disabled={loading} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {loading ? <Loader2 size={14} className="spinner" /> : 'Filter'}
                  </button>
                </div>
                <button className="btn-icon" onClick={() => setShowHistoryModal(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* Modal Tabs */}
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem', paddingBottom: '2px' }}>
                <button 
                  onClick={() => setActiveHistoryTab('overview')} 
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: activeHistoryTab === 'overview' ? '#8b5cf6' : 'var(--text-muted)',
                    borderBottom: activeHistoryTab === 'overview' ? '3px solid #8b5cf6' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Overview & Stats
                </button>
                <button 
                  onClick={() => setActiveHistoryTab('vehicles')} 
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: activeHistoryTab === 'vehicles' ? '#8b5cf6' : 'var(--text-muted)',
                    borderBottom: activeHistoryTab === 'vehicles' ? '3px solid #8b5cf6' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Fleet (Vehicles)
                </button>
                <button 
                  onClick={() => setActiveHistoryTab('bookings')} 
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: activeHistoryTab === 'bookings' ? '#8b5cf6' : 'var(--text-muted)',
                    borderBottom: activeHistoryTab === 'bookings' ? '3px solid #8b5cf6' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Bookings Log
                </button>
              </div>

              {/* TAB 1: OVERVIEW & STATS */}
              {activeHistoryTab === 'overview' && (
                <div className="fade-in">
                  
                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    
                    {/* Available Balance Card */}
                    <div style={{ 
                      padding: '1.25rem', 
                      borderRadius: '16px', 
                      background: 'linear-gradient(135deg, #0f172a, #1e293b)', 
                      color: 'white',
                      boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.9 }}>Available Balance</span>
                        <DollarSign size={20} />
                      </div>
                      <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'white' }}>
                        ₹{historyPartner.revenue?.walletBalance?.toLocaleString('en-IN') || 0}
                      </h3>
                      <p style={{ margin: '8px 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                        Current wallet balance
                      </p>
                    </div>

                    {/* Total Revenue Card */}
                    <div style={{ 
                      padding: '1.25rem', 
                      borderRadius: '16px', 
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                      color: 'white',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.9 }}>Total Revenue</span>
                        <DollarSign size={20} />
                      </div>
                      <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'white' }}>
                        ₹{historyPartner.revenue?.totalEarnings?.toLocaleString('en-IN') || 0}
                      </h3>
                      <p style={{ margin: '8px 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                        Gross collection
                      </p>
                    </div>

                    {/* Service Fee Card */}
                    <div style={{ 
                      padding: '1.25rem', 
                      borderRadius: '16px', 
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
                      color: 'white',
                      boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.9 }}>Service Fee (8%)</span>
                        <DollarSign size={20} />
                      </div>
                      <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'white' }}>
                        ₹{historyPartner.revenue?.serviceFee?.toLocaleString('en-IN') || 0}
                      </h3>
                      <p style={{ margin: '8px 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                        Platform deduction
                      </p>
                    </div>

                    {/* Net Revenue Card */}
                    <div style={{ 
                      padding: '1.25rem', 
                      borderRadius: '16px', 
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
                      color: 'white',
                      boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.2)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.9 }}>Net Revenue</span>
                        <DollarSign size={20} />
                      </div>
                      <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'white' }}>
                        ₹{historyPartner.revenue?.netEarnings?.toLocaleString('en-IN') || 0}
                      </h3>
                      <p style={{ margin: '8px 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                        Actual franchise earning
                      </p>
                    </div>

                    {/* Total Withdrawn Card */}
                    <div style={{ 
                      padding: '1.25rem', 
                      borderRadius: '16px', 
                      background: 'linear-gradient(135deg, #10b981, #059669)', 
                      color: 'white',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.9 }}>Total Withdrawn</span>
                        <DollarSign size={20} />
                      </div>
                      <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'white' }}>
                        ₹{historyPartner.revenue?.totalWithdrawn?.toLocaleString('en-IN') || 0}
                      </h3>
                      <p style={{ margin: '8px 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                        Approved withdrawals
                      </p>
                    </div>

                    {/* Pending Withdrawal Card */}
                    <div style={{ 
                      padding: '1.25rem', 
                      borderRadius: '16px', 
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                      color: 'white',
                      boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.9 }}>Pending Withdrawal</span>
                        <DollarSign size={20} />
                      </div>
                      <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'white' }}>
                        ₹{historyPartner.revenue?.pendingWithdrawn?.toLocaleString('en-IN') || 0}
                      </h3>
                      <p style={{ margin: '8px 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                        Requested but not approved
                      </p>
                    </div>

                    {/* Total Fleet Card */}
                    <div style={{ 
                      padding: '1.25rem', 
                      borderRadius: '16px', 
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
                      color: 'white',
                      boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.2)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.9 }}>Total Fleet Size</span>
                        <Car size={20} />
                      </div>
                      <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'white' }}>
                        {historyPartner.vehicles?.total || 0} Units
                      </h3>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '8px', fontSize: '0.72rem', opacity: 0.9 }}>
                        <span>Admin: <strong>{historyPartner.vehicles?.assigned || 0}</strong></span>
                        <span>•</span>
                        <span>Owned: <strong>{historyPartner.vehicles?.owned || 0}</strong></span>
                      </div>
                    </div>

                    {/* Total Bookings Card */}
                    <div style={{ 
                      padding: '1.25rem', 
                      borderRadius: '16px', 
                      background: 'linear-gradient(135deg, #ec4899, #db2777)', 
                      color: 'white',
                      boxShadow: '0 4px 6px -1px rgba(236, 72, 153, 0.2)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.9 }}>Total Bookings</span>
                        <Users size={20} />
                      </div>
                      <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'white' }}>
                        {historyPartner.bookings?.total || 0} Rides
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '0.72rem', opacity: 0.9 }}>
                        <span>Pending: <strong style={{ textDecoration: 'underline' }}>{historyPartner.bookings?.pending || 0}</strong></span>
                        <span>•</span>
                        <span>Completed: <strong>{historyPartner.bookings?.completed || 0}</strong></span>
                      </div>
                    </div>

                  </div>

                  {/* Split Visual Section */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                    
                    {/* Vehicle Ownership Details */}
                    <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '12px', background: '#f8fafc' }}>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Car size={18} color="#3b82f6" /> Vehicle Breakdown
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Admin Assigned Fleet</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{historyPartner.vehicles?.assigned || 0} Vehicles</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Franchise Self-Owned Fleet</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{historyPartner.vehicles?.owned || 0} Vehicles</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem', color: '#3b82f6', paddingTop: '0.2rem' }}>
                          <span>Total Dynamic Fleet</span>
                          <span>{historyPartner.vehicles?.total || 0} Vehicles</span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Stats Details */}
                    <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '12px', background: '#f8fafc' }}>
                      <h4 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={18} color="#f59e0b" /> Bookings Summary
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b', display: 'block' }}>
                            {historyPartner.bookings?.pending || 0}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pending</span>
                        </div>
                        <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981', display: 'block' }}>
                            {historyPartner.bookings?.completed || 0}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Completed</span>
                        </div>
                        <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6', display: 'block' }}>
                            {historyPartner.bookings?.ongoing || 0}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Ongoing</span>
                        </div>
                        <div style={{ background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444', display: 'block' }}>
                            {historyPartner.bookings?.cancelled || 0}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Cancelled</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div style={{ padding: '1rem', background: '#eff6ff', borderLeft: '4px solid #3b82f6', borderRadius: '6px', color: '#1e40af', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    <strong>Note:</strong> Vehicles assigned by admin are dispatched from the central fleet to boost the franchise's availability. Self-owned fleet is onboarded independently by this franchise under the premium revenue share plan.
                  </div>

                </div>
              )}

              {/* TAB 2: VEHICLES FLEET LIST */}
              {activeHistoryTab === 'vehicles' && (
                <div className="fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Current Fleet Inventory ({historyPartner.vehicles?.list?.length || 0} Vehicles)</h4>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Vehicle Name</th>
                          <th>Reg. Number</th>
                          <th>Source</th>
                          <th>Price / Day</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!historyPartner.vehicles?.list || historyPartner.vehicles.list.length === 0) ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                              No vehicles in fleet yet.
                            </td>
                          </tr>
                        ) : (
                          historyPartner.vehicles.list.map((v) => (
                            <tr key={v._id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Car size={16} color="var(--primary)" />
                                  <span style={{ fontWeight: 600 }}>{v.vehicle_name}</span>
                                </div>
                              </td>
                              <td><span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem' }}>{v.registration_number}</span></td>
                              <td>
                                <span style={{ 
                                  padding: '0.2rem 0.5rem', 
                                  borderRadius: '4px', 
                                  fontSize: '0.7rem', 
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  background: v.added_by_franchise ? '#faf5ff' : '#eff6ff',
                                  color: v.added_by_franchise ? '#8b5cf6' : '#3b82f6',
                                  border: v.added_by_franchise ? '1px solid #d8b4fe' : '1px solid #bfdbfe'
                                }}>
                                  {v.added_by_franchise ? 'Franchise Owned' : 'Admin Assigned'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 600 }}>₹{v.price_per_day || 0}/day</td>
                              <td>
                                <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                                  <span className="status-dot" style={{ 
                                    background: v.status === 'active' ? '#10b981' : v.status === 'maintenance' ? '#ef4444' : '#f59e0b' 
                                  }}></span> 
                                  {v.status ? (v.status.charAt(0).toUpperCase() + v.status.slice(1)) : 'Active'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: BOOKINGS LOG */}
              {activeHistoryTab === 'bookings' && (
                <div className="fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Recent Booking Transactions</h4>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Customer</th>
                          <th>Vehicle</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Booking Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!historyPartner.bookings?.recent || historyPartner.bookings.recent.length === 0) ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                              No bookings found for this franchise.
                            </td>
                          </tr>
                        ) : (
                          historyPartner.bookings.recent.map((b) => (
                            <tr key={b._id}>
                              <td>
                                <span style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>
                                  {b.booking_id || 'N/A'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{b.user?.name || 'N/A'}</span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.user?.mobile || 'N/A'}</span>
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{b.vehicle?.vehicle_name || 'N/A'}</span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{b.vehicle?.registration_number || ''}</span>
                                </div>
                              </td>
                              <td style={{ fontWeight: 700 }}>₹{(b.grand_total || 0).toLocaleString('en-IN')}</td>
                              <td>
                                <span className={`status-badge ${b.booking_status}`} style={{ 
                                  padding: '0.2rem 0.5rem', 
                                  borderRadius: '20px', 
                                  fontSize: '0.7rem', 
                                  fontWeight: '600',
                                  textTransform: 'uppercase',
                                  background: b.booking_status === 'completed' ? '#dcfce7' : b.booking_status === 'cancelled' ? '#fee2e2' : b.booking_status === 'ongoing' ? '#eff6ff' : '#fef9c3',
                                  color: b.booking_status === 'completed' ? '#15803d' : b.booking_status === 'cancelled' ? '#b91c1c' : b.booking_status === 'ongoing' ? '#1d4ed8' : '#854d0e'
                                }}>
                                  {b.booking_status}
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge ${b.payment_status}`} style={{ 
                                  padding: '0.2rem 0.5rem', 
                                  borderRadius: '20px', 
                                  fontSize: '0.7rem', 
                                  fontWeight: '600',
                                  textTransform: 'uppercase',
                                  background: b.payment_status === 'paid' ? '#dcfce7' : b.payment_status === 'pending' ? '#fef9c3' : '#fee2e2',
                                  color: b.payment_status === 'paid' ? '#15803d' : b.payment_status === 'pending' ? '#854d0e' : '#b91c1c'
                                }}>
                                  {b.payment_status}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {new Date(b.createdAt).toLocaleDateString('en-IN')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
            
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowHistoryModal(false)}>
                Close History
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* View All Requests Modal */}
      {showAllRequestsModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowAllRequestsModal(false)}>
          <div className="modal-content modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="app-icon" style={{ width: '40px', height: '40px' }}><Users size={20} /></div>
                <div>
                  <h3>All Franchise Requests</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>History of all received partnership applications</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowAllRequestsModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Applicant Name</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((req) => (
                      <tr key={req._id}>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{req.full_name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.email}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.875rem' }}>{req.city}, {req.state}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${req.status}`} style={{ 
                            padding: '0.25rem 0.6rem', 
                            borderRadius: '20px', 
                            fontSize: '0.7rem', 
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            background: req.status === 'approved' ? '#dcfce7' : req.status === 'rejected' ? '#fee2e2' : '#fef9c3',
                            color: req.status === 'approved' ? '#15803d' : req.status === 'rejected' ? '#b91c1c' : '#854d0e'
                          }}>
                            {req.status}
                          </span>
                        </td>
                        <td>
                          {req.status === 'new' && (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button className="btn-icon" onClick={() => handleEnquiryAction(req._id, 'approved')} title="Approve" style={{ color: '#10b981' }}><CheckCircle size={16} /></button>
                              <button className="btn-icon" onClick={() => handleEnquiryAction(req._id, 'rejected')} title="Reject" style={{ color: '#ef4444' }}><XCircle size={16} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowAllRequestsModal(false)}>Close Application History</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {deleteId && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Remove Franchise Partner</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-body">
                <div className="delete-icon-wrap"><AlertTriangle size={28} /></div>
                <p>Are you sure you want to remove <strong>{stores.find(s => s._id === deleteId)?.store_name}</strong>?</p>
                <p className="delete-sub">Location: {stores.find(s => s._id === deleteId)?.city}, {stores.find(s => s._id === deleteId)?.state}</p>
                <p className="delete-sub">All assigned vehicles and revenue data records will be affected. This action is permanent.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteId(null)} disabled={loading}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDeleteStore(deleteId)} disabled={loading}>
                {loading ? <Loader2 size={16} className="spinner" /> : 'Yes, Remove Partner'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showAgreementModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowAgreementModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Upload Agreement</h3>
              <button className="btn-icon" onClick={() => setShowAgreementModal(false)}><X size={20} /></button>
            </div>
            <form className="modal-body" onSubmit={(e) => {
              e.preventDefault();
              if (!agreementFile) return alert('Please select a file');
              const fd = new FormData();
              fd.append('agreement_document', agreementFile);
              call(() => uploadStoreAgreement(selectedPartner._id, fd), () => {
                alert('Agreement uploaded successfully!');
                setShowAgreementModal(false);
                setAgreementFile(null);
                fetchData();
              }, (err) => alert(err.message));
            }}>
              <div className="form-group">
                <label>Franchise: {selectedPartner?.store_name}</label>
                <input type="file" accept="image/*,application/pdf" className="form-input" onChange={e => setAgreementFile(e.target.files[0])} required />
                <small style={{ color: 'var(--text-muted)' }}>Upload PDF or Image of the signed agreement</small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAgreementModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MAP PICKER MODAL ── */}
      {showMapPicker && createPortal(
        <div className="modal-overlay" onClick={() => setShowMapPicker(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', width: '95vw' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '9px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={18} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>Pick Hub Location</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Search address or use GPS to set hub coordinates</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowMapPicker(false)}><X size={20} /></button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Search bar */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Search address, landmark, city..."
                    value={mapSearch}
                    onChange={e => setMapSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchMapLocation()}
                    style={{ width: '100%', padding: '0.6rem 0.875rem 0.6rem 2.25rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }}
                  />
                </div>
                <button type="button" onClick={searchMapLocation} disabled={mapSearching}
                  style={{ padding: '0.6rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  {mapSearching ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={15} />}
                  Search
                </button>
              </div>

              {/* GPS Button */}
              <button type="button" onClick={useMyLocation} disabled={gpsLoading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.65rem', background: gpsLoading ? '#f1f5f9' : '#eff6ff', color: gpsLoading ? 'var(--text-muted)' : 'var(--primary)', border: '1.5px dashed var(--primary)', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                {gpsLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Crosshair size={16} />}
                {gpsLoading ? 'Getting your location...' : 'Use My Current Location (GPS)'}
              </button>

              {/* Manual input */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Latitude</label>
                  <input type="number" step="any" placeholder="e.g. 26.8467"
                    value={pickedCoords.lat}
                    onChange={e => {
                      const lat = e.target.value;
                      setPickedCoords(p => ({ ...p, lat }));
                      if (lat && pickedCoords.lng) setMapPreviewUrl(`https://maps.google.com/maps?q=${lat},${pickedCoords.lng}&z=16&output=embed`);
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Longitude</label>
                  <input type="number" step="any" placeholder="e.g. 80.9462"
                    value={pickedCoords.lng}
                    onChange={e => {
                      const lng = e.target.value;
                      setPickedCoords(p => ({ ...p, lng }));
                      if (pickedCoords.lat && lng) setMapPreviewUrl(`https://maps.google.com/maps?q=${pickedCoords.lat},${lng}&z=16&output=embed`);
                    }}
                    style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              {/* Map Preview */}
              <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--border)', background: '#f1f5f9', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {mapPreviewUrl ? (
                  <iframe
                    src={mapPreviewUrl}
                    width="100%" height="220"
                    style={{ border: 'none', display: 'block' }}
                    loading="lazy"
                    title="Map Preview"
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    <MapPin size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.85rem' }}>Search an address or enter coordinates<br/>to preview location on map</p>
                  </div>
                )}
              </div>

              {/* Open in Google Maps link */}
              {pickedCoords.lat && pickedCoords.lng && (
                <a href={`https://www.google.com/maps?q=${pickedCoords.lat},${pickedCoords.lng}`} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  <ExternalLink size={13} /> Open in Google Maps to verify
                </a>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowMapPicker(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmMapLocation} disabled={!pickedCoords.lat || !pickedCoords.lng}>
                <MapPin size={15} /> Confirm Location
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showWithdrawalModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowWithdrawalModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Update Settlement Status</h3>
              <button className="btn-icon" onClick={() => setShowWithdrawalModal(false)}><X size={20} /></button>
            </div>
            <form className="modal-body" onSubmit={(e) => {
              e.preventDefault();
              if (newWithdrawalStatus === 'released' && !paymentProof && selectedWithdrawal.status !== 'released' && selectedWithdrawal.status !== 'approved') {
                 return alert('Please upload payment screenshot to mark as released.');
              }
              const fd = new FormData();
              fd.append('status', newWithdrawalStatus);
              if (adminNote) fd.append('admin_note', adminNote);
              if (paymentProof && newWithdrawalStatus === 'released') fd.append('payment_proof', paymentProof);

              call(() => updateFranchiseWithdrawalStatusAdmin(selectedWithdrawal._id, fd), () => {
                alert(`Settlement marked as ${newWithdrawalStatus}`);
                setShowWithdrawalModal(false);
                setPaymentProof(null);
                setAdminNote('');
                fetchData();
              }, (err) => alert(err.message || "Failed to update status"));
            }}>
              <div className="form-group" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Franchise:</span>
                  <span style={{ fontWeight: 600 }}>{selectedWithdrawal?.franchise?.store_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
                  <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1.2rem' }}>₹{(selectedWithdrawal?.amount || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select className="form-input" value={newWithdrawalStatus} onChange={e => setNewWithdrawalStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="released">Released</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              {newWithdrawalStatus === 'released' && (
                <div className="form-group">
                  <label>Payment Proof (Screenshot)</label>
                  <input type="file" accept="image/*" className="form-input" onChange={e => setPaymentProof(e.target.files[0])} required={!selectedWithdrawal?.payment_proof} />
                  {selectedWithdrawal?.payment_proof && <small style={{color:'var(--text-muted)'}}>Upload to replace existing proof.</small>}
                </div>
              )}

              <div className="form-group">
                <label>Admin Note (Optional)</label>
                <input type="text" className="form-input" placeholder="e.g. UTR Number, Remarks" value={adminNote} onChange={e => setAdminNote(e.target.value)} />
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowWithdrawalModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Updating...' : 'Update Status'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Settlement Bill Modal */}
      <SettlementBillModal 
        show={!!selectedBill} 
        onClose={() => setSelectedBill(null)} 
        billData={selectedBill} 
        franchiseName={selectedBill?.franchise?.store_name} 
      />
    </div>
  );
};

export default Franchise;

