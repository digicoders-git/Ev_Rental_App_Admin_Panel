import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building2, Check, X, MapPin, Plus, Search, MoreVertical, TrendingUp,
  Users, Car, XCircle, CheckCircle, Eye, DollarSign, ArrowUpRight,
  ArrowDownRight, KeyRound, Eye as EyeIcon, EyeOff, Phone, Mail, User, Lock, Loader2, Trash2, AlertTriangle,
  History
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  getFranchiseEnquiries, getAllStores, createStore, deleteStore, getStoreById,
  updateEnquiryStatus, getFranchisePerformance, getDashboardStats, getFranchiseHistory
} from '../services/apiServices';
import useApi from '../services/useApi';
import './Franchise.css';

const Franchise = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchPartners, setSearchPartners] = useState('');
  
  const [stores, setStores] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [dashStats, setDashStats] = useState(null);
  const [form, setForm] = useState({
    store_name: '', owner_name: '', mobile: '', email: '', 
    address: '', city: '', state: '', password: '', confirmPassword: ''
  });
  const [deleteId, setDeleteId] = useState(null);

  const { loading, call } = useApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    call(() => getDashboardStats(), (res) => setDashStats(res.data));
    call(() => getFranchisePerformance(), (res) => setPerformance(res.data || []));
    call(() => getFranchiseEnquiries(), (res) => setEnquiries(res.data?.data || res.data || []));
    call(() => getAllStores(), (res) => setStores(res.data?.data || res.data || []));
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
      setForm({
        store_name: '', owner_name: '', mobile: '', email: '', 
        address: '', city: '', state: '', password: '', confirmPassword: ''
      });
      fetchData();
      alert("Partnership created successfully!");
    }, (err) => alert(err.message || "Failed to create partnership"));
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

  const [historyPartner, setHistoryPartner] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState('overview');

  const openViewModal = (partner) => {
    call(() => getStoreById(partner._id), (res) => {
      setSelectedPartner(res.data); // res.data contains { store, assigned_vehicles }
      setShowViewModal(true);
    });
  };

  const openHistoryModal = (partner) => {
    setActiveHistoryTab('overview');
    call(() => getFranchiseHistory(partner._id), (res) => {
      setHistoryPartner(res.data);
      setShowHistoryModal(true);
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
          <p>Expand and manage your EV rental partner ecosystem.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>Add New Partner</span>
        </button>
      </div>

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
                      <span>Budget: {req.investment_budget || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Phone size={11} /> {req.phone_number}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Mail size={11} /> {req.email}
                      </span>
                    </div>
                    {req.message && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic', background: '#f8fafc', padding: '0.5rem', borderRadius: '6px', borderLeft: '3px solid var(--primary-light)' }}>
                        "{req.message.length > 80 ? req.message.substring(0, 80) + '...' : req.message}"
                      </p>
                    )}
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
                  <td><span style={{ fontWeight: '600' }}>{f.store_name}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{f.owner_name}</span>
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
                      <button className="btn-icon history" title="View History" onClick={() => openHistoryModal(f)} style={{ color: '#8b5cf6' }}><History size={16} /></button>
                      <button className="btn-icon delete" title="Delete Franchise" onClick={() => setDeleteId(f._id)} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Onboard New Partner</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form className="user-form" id="onboard-form" onSubmit={handleOnboard}>

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
                    <label>Password</label>
                    <div className="input-icon-wrap">
                      <Lock size={15} className="input-icon" />
                      <input type={showPassword ? 'text' : 'password'} placeholder="Create password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                      <button type="button" className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={15} /> : <EyeIcon size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <div className="input-icon-wrap">
                      <Lock size={15} className="input-icon" />
                      <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter password" required value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} />
                      <button type="button" className="input-icon-right" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff size={15} /> : <EyeIcon size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" type="submit" form="onboard-form" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Create Partnership"}
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
                      <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Store ID</label>
                      <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', background: 'var(--primary-light)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{selectedPartner.store?.store_id}</span>
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
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="app-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <History size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                    {historyPartner.store?.store_name} History
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Owner: <strong>{historyPartner.store?.owner_name}</strong> | ID: <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 600 }}>{historyPartner.store?.store_id}</span>
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowHistoryModal(false)}>
                <X size={20} />
              </button>
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
                    
                    {/* Revenue Card */}
                    <div style={{ 
                      padding: '1.25rem', 
                      borderRadius: '16px', 
                      background: 'linear-gradient(135deg, #10b981, #059669)', 
                      color: 'white',
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.9 }}>Total Revenue</span>
                        <DollarSign size={20} />
                      </div>
                      <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'white' }}>
                        ₹{historyPartner.revenue?.totalPaid?.toLocaleString('en-IN') || 0}
                      </h3>
                      <p style={{ margin: '8px 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                        Actual collected amount
                      </p>
                    </div>

                    {/* Total Fleet Card */}
                    <div style={{ 
                      padding: '1.25rem', 
                      borderRadius: '16px', 
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
                      color: 'white',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
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
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                      color: 'white',
                      boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)'
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
                      <th>Budget</th>
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
                          <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>{req.investment_budget}</span>
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
    </div>
  );
};

export default Franchise;
