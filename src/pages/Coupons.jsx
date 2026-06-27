import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Tag, Plus, Search, Eye, Edit3, Trash2, X,
  CheckCircle, Clock, XCircle, Copy, ToggleLeft,
  ToggleRight, Percent, IndianRupee, Calendar,
  Users, Car, Zap, AlertTriangle, Gift, Loader2
} from 'lucide-react';
import { getAllOffers, createOffer, updateOffer, deleteOffer, toggleOffer } from '../services/apiServices';
import './Coupons.css';

const STATUS_CFG = {
  Active:    { cls: 'badge-success', icon: <CheckCircle size={11} /> },
  Scheduled: { cls: 'badge-info',    icon: <Clock size={11} /> },
  Expired:   { cls: 'badge-danger',  icon: <XCircle size={11} /> },
  Inactive:  { cls: 'badge-warning', icon: <AlertTriangle size={11} /> },
};

const TABS = ['All', 'Active', 'Scheduled', 'Expired'];

const emptyForm = {
  code: '', title: '', type: 'Percentage', value: '', minOrder: '',
  maxDiscount: '', usageLimit: '', perUser: 1,
  applicableTo: 'All Plans', franchise: 'All',
  startDate: '', endDate: '', description: '',
};

const Coupons = () => {
  const [coupons, setCoupons]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('All');
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState(null);
  const [viewCoupon, setViewCoupon] = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [copied, setCopied]         = useState('');
  const [form, setForm]             = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data } = await getAllOffers();
      const items = data.data || [];
      const list = items.map(o => ({
        id: o._id,
        code: o.coupon_code,
        title: o.title,
        type: o.offer_type === 'discount_percentage' ? 'Percentage' : 'Flat',
        value: o.discount_value,
        minOrder: o.min_booking_amount || 0,
        maxDiscount: o.max_discount_amount || 0,
        usageLimit: o.usage_limit || 0,
        usedCount: o.usage_count || 0,
        perUser: 1,
        applicableTo: 'All Plans',
        franchise: 'All',
        startDate: o.start_date?.slice(0, 10) || '',
        endDate: o.end_date?.slice(0, 10) || '',
        status: o.status === 'active' ? 'Active' : o.status === 'expired' ? 'Expired' : 'Inactive',
        description: o.description || '',
      }));
      setCoupons(list);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ── counts ── */
  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'All' ? coupons.length : coupons.filter(c => c.status === t).length;
    return acc;
  }, {});

  /* ── filter ── */
  const filtered = coupons.filter(c => {
    const matchTab = activeTab === 'All' || c.status === activeTab;
    const q = search.toLowerCase();
    return matchTab && (
      (c.code || '').toLowerCase().includes(q) ||
      (c.title || '').toLowerCase().includes(q) ||
      (c.applicableTo || '').toLowerCase().includes(q)
    );
  });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = c => {
    setEditId(c.id);
    setForm({ ...c });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.value || !form.endDate) return;
    
    try {
      setSubmitting(true);
      const payload = {
        title: form.title,
        coupon_code: form.code,
        offer_type: form.type === 'Percentage' ? 'discount_percentage' : 'flat_discount',
        discount_value: Number(form.value),
        max_discount_amount: Number(form.maxDiscount) || 0,
        min_booking_amount: Number(form.minOrder) || 0,
        usage_limit: Number(form.usageLimit) || 0,
        start_date: form.startDate,
        end_date: form.endDate,
        description: form.description,
      };

      if (editId) {
        await updateOffer(editId, payload);
      } else {
        await createOffer(payload);
      }
      
      setShowModal(false);
      fetchCoupons();
    } catch (error) {
      console.error("Error saving coupon:", error);
      alert(error.response?.data?.message || "Failed to save coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setSubmitting(true);
      const res = await deleteOffer(id);
      if (res.data.success) {
        setDeleteId(null);
        fetchCoupons();
      } else {
        alert(res.data.message || "Failed to delete coupon");
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      alert(error.response?.data?.message || "Error deleting coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleOffer(id);
      fetchCoupons();
    } catch (error) {
      console.error("Error toggling coupon status:", error);
      alert(error.response?.data?.message || "Error toggling coupon status");
    }
  };

  const handleCopy = code => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const usagePct = c => c.usageLimit ? Math.min(Math.round((c.usedCount / c.usageLimit) * 100), 100) : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="cp-page-loading">
        <Loader2 className="spinner" size={40} />
        <p>Loading coupons...</p>
      </div>
    );
  }

  return (
    <div className="coupons-page">
      <div className="page-header">
        <div>
          <h1>Offers & Coupons</h1>
          <p>Create and manage discount coupons across your TRIS Electric network.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={17} /> Create Coupon
        </button>
      </div>

      <div className="cp-stats">
        <div className="card cp-stat-card">
          <div className="cp-stat-icon total"><Tag size={19} /></div>
          <div><span className="cp-stat-label">Total Coupons</span><h3>{coupons.length}</h3></div>
        </div>
        <div className="card cp-stat-card">
          <div className="cp-stat-icon active"><CheckCircle size={19} /></div>
          <div><span className="cp-stat-label">Active</span><h3>{counts.Active}</h3></div>
        </div>
        <div className="card cp-stat-card">
          <div className="cp-stat-icon used"><Users size={19} /></div>
          <div>
            <span className="cp-stat-label">Total Redemptions</span>
            <h3>{coupons.reduce((s, c) => s + (c.usedCount || 0), 0)}</h3>
          </div>
        </div>
        <div className="card cp-stat-card">
          <div className="cp-stat-icon scheduled"><Clock size={19} /></div>
          <div><span className="cp-stat-label">Scheduled</span><h3>{counts.Scheduled}</h3></div>
        </div>
      </div>

      <div className="card">
        <div className="cp-toolbar">
          <div className="filter-tabs">
            {TABS.map(t => (
              <button key={t} className={`filter-tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}>
                {t} <span className="tab-count">{counts[t]}</span>
              </button>
            ))}
          </div>
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Search code, title, plan..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="cp-table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Coupon Code</th>
                <th>Title</th>
                <th>Discount</th>
                <th>Usage Status</th>
                <th>Validity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="cp-empty-row"><Tag size={28} /><p>No coupons found.</p></td></tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={c.id}>
                    <td className="td-muted">{i + 1}</td>
                    <td>
                      <div className="cp-code-cell">
                        <span className="cp-code">{c.code}</span>
                        <button className="cp-copy-btn" title="Copy Code" onClick={() => handleCopy(c.code)}>
                          {copied === c.code ? <CheckCircle size={13} color="#10b981" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="cell-main">{c.title}</span>
                      <span className="cell-sub">{c.description}</span>
                    </td>
                    <td>
                      <span className="cp-discount">
                        {c.type === 'Percentage'
                          ? <><Percent size={13} /> {c.value}% off</>
                          : <><IndianRupee size={13} /> ₹{c.value} off</>}
                      </span>
                      {c.minOrder > 0 && <span className="cell-sub">Min ₹{c.minOrder}</span>}
                    </td>
                    <td>
                      <div className="cp-usage-cell">
                        <div className="cp-usage-bar-wrap">
                          <div className="cp-usage-bar-fill"
                            style={{
                              width: `${usagePct(c)}%`,
                              background: usagePct(c) >= 90 ? '#ef4444' : usagePct(c) >= 60 ? '#f59e0b' : '#10b981'
                            }} />
                        </div>
                        <span className="cp-usage-text">{c.usedCount} used of {c.usageLimit || '∞'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="cell-main">{formatDate(c.endDate)}</span>
                      <span className="cell-sub">From {formatDate(c.startDate)}</span>
                    </td>
                    <td>
                      <span className={`badge badge-icon ${STATUS_CFG[c.status]?.cls || 'badge-warning'}`}>
                        {STATUS_CFG[c.status]?.icon || <AlertTriangle size={11} />} {c.status}
                      </span>
                    </td>
                    <td>
                      <div className="cp-actions">
                        <button className="btn-icon" title="View" onClick={() => setViewCoupon(c)}><Eye size={15} /></button>
                        <button className="btn-icon edit" title="Edit" onClick={() => openEdit(c)}><Edit3 size={15} /></button>
                        <button
                          className={`btn-icon toggle ${c.status === 'Active' ? 'on' : 'off'}`}
                          title={c.status === 'Active' ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggle(c.id)}
                        >
                          {c.status === 'Active' ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                        </button>
                        <button className="btn-icon delete" title="Delete" onClick={() => setDeleteId(c.id)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewCoupon && createPortal(
        <div className="modal-overlay" onClick={() => setViewCoupon(null)}>
          <div className="modal-content cp-view-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="cp-modal-head">
                <div className="cp-modal-icon"><Gift size={20} /></div>
                <div>
                  <h3>{viewCoupon.title}</h3>
                  <span className="td-muted">{viewCoupon.description}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <span className={`badge badge-icon ${STATUS_CFG[viewCoupon.status]?.cls || 'badge-warning'}`}>
                  {STATUS_CFG[viewCoupon.status]?.icon || <AlertTriangle size={11} />} {viewCoupon.status}
                </span>
                <button className="btn-icon" onClick={() => setViewCoupon(null)}><X size={20} /></button>
              </div>
            </div>
            <div className="modal-body">
              <div className="cp-code-hero">
                <span className="cp-hero-label">Coupon Code</span>
                <div className="cp-hero-code">
                  <span>{viewCoupon.code}</span>
                  <button className="cp-copy-btn lg" onClick={() => handleCopy(viewCoupon.code)}>
                    {copied === viewCoupon.code ? <CheckCircle size={16} color="#10b981" /> : <Copy size={16} />}
                  </button>
                </div>
                <span className="cp-hero-discount">
                  {viewCoupon.type === 'Percentage' ? `${viewCoupon.value}% off` : `₹${viewCoupon.value} flat off`}
                  {viewCoupon.maxDiscount ? ` (max ₹${viewCoupon.maxDiscount})` : ''}
                </span>
              </div>

              <div className="cp-detail-grid">
                <div className="cp-detail-section">
                  <div className="cp-detail-title"><Tag size={13} /> Coupon Details</div>
                  <div className="cp-detail-rows">
                    <div className="cp-detail-row"><span>Type</span><span>{viewCoupon.type}</span></div>
                    <div className="cp-detail-row"><span>Min Order</span><span>₹{viewCoupon.minOrder}</span></div>
                    <div className="cp-detail-row"><span>Max Discount</span><span>₹{viewCoupon.maxDiscount}</span></div>
                  </div>
                </div>
                <div className="cp-detail-section">
                  <div className="cp-detail-title"><Calendar size={13} /> Validity & Usage</div>
                  <div className="cp-detail-rows">
                    <div className="cp-detail-row"><span>Start Date</span><span>{formatDate(viewCoupon.startDate)}</span></div>
                    <div className="cp-detail-row"><span>End Date</span><span>{formatDate(viewCoupon.endDate)}</span></div>
                    <div className="cp-detail-row"><span>Used / Limit</span><span>{viewCoupon.usedCount} / {viewCoupon.usageLimit || '∞'}</span></div>
                  </div>
                </div>
              </div>

              <div className="cp-usage-section">
                <div className="cp-usage-header">
                  <span>Usage Progress</span>
                  <span>{usagePct(viewCoupon)}%</span>
                </div>
                <div className="cp-usage-bar-wrap lg">
                  <div className="cp-usage-bar-fill"
                    style={{
                      width: `${usagePct(viewCoupon)}%`,
                      background: usagePct(viewCoupon) >= 90 ? '#ef4444' : usagePct(viewCoupon) >= 60 ? '#f59e0b' : '#10b981'
                    }} />
                </div>
                <span className="cp-usage-text">{viewCoupon.usedCount} of {viewCoupon.usageLimit || 'unlimited'} uses</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setViewCoupon(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setViewCoupon(null); openEdit(viewCoupon); }}>
                <Edit3 size={15} /> Edit Coupon
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content cp-form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Coupon' : 'Create New Coupon'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form className="user-form">
                <div className="form-section-title"><Tag size={13} /> Basic Info</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Coupon Code *</label>
                    <input type="text" placeholder="e.g. VOLT20" value={form.code}
                      onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
                  </div>
                  <div className="form-group">
                    <label>Title *</label>
                    <input type="text" placeholder="e.g. Flat 20% Off" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input type="text" placeholder="Short description of the offer" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>

                <div className="form-section-title" style={{ marginTop: '0.5rem' }}><Percent size={13} /> Discount Config</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Discount Type *</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                      <option value="Percentage">Percentage (%)</option>
                      <option value="Flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{form.type === 'Percentage' ? 'Discount (%)' : 'Discount (₹)'} *</label>
                    <input type="number" placeholder={form.type === 'Percentage' ? 'e.g. 20' : 'e.g. 50'}
                      value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Min Order Amount (₹)</label>
                    <input type="number" placeholder="e.g. 200" value={form.minOrder} onChange={e => setForm(p => ({ ...p, minOrder: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Max Discount (₹)</label>
                    <input type="number" placeholder="e.g. 150" value={form.maxDiscount} onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))} />
                  </div>
                </div>

                <div className="form-section-title" style={{ marginTop: '0.5rem' }}><Users size={13} /> Usage Limits</div>
                <div className="form-group">
                  <label>Total Usage Limit (0 for unlimited)</label>
                  <input type="number" placeholder="e.g. 500" value={form.usageLimit} onChange={e => setForm(p => ({ ...p, usageLimit: e.target.value }))} />
                </div>

                <div className="form-section-title" style={{ marginTop: '0.5rem' }}><Calendar size={13} /> Validity Period</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? <Loader2 className="spinner" size={15} /> : (editId ? 'Save Changes' : 'Create Coupon')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteId && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content cp-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Coupon</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="cp-delete-body">
                <div className="cp-delete-icon"><Trash2 size={26} /></div>
                <p>Are you sure you want to delete this coupon?</p>
                <p className="cp-delete-sub">This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteId(null)} disabled={submitting}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)} disabled={submitting}>
                {submitting ? <Loader2 className="spinner" size={15} /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Coupons;

