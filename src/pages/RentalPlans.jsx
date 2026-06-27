import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Zap, Clock, Calendar, Check, Plus, X, Trash2, Edit3,
  CreditCard, Tag, IndianRupee, Star, ToggleLeft, ToggleRight,
  Bike, AlertCircle, Loader2
} from 'lucide-react';
import { getAllPlans, createPlan, updatePlan, deletePlan, togglePlan } from '../services/apiServices';
import useApi from '../services/useApi';
import './RentalPlans.css';

const typeIcons = {
  Hourly:  <Clock size={22} />,
  Daily:   <Zap size={22} />,
  Weekly:  <Calendar size={22} />,
  Monthly: <Star size={22} />,
};

const typeUnit = { Hourly: 'hr', Daily: 'day', Weekly: 'week', Monthly: 'month' };

const emptyForm = {
  name: '', type: 'Daily', price: '', badge: '', active: true,
  kmLimit: 'Unlimited', extraKmCharge: '100', helmetIncluded: true,
  insurance: 'Basic', description: '', features: [],
};

const globalDefaults = { deposit: '2000', lateFee: '150', gst: '18', serviceFee: '49' };

const RentalPlans = () => {
  const [plans, setPlans]           = useState([]);
  const [showModal, setShowModal]   = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [featureInput, setFeatureInput] = useState('');
  const [global, setGlobal]         = useState({ deposit: '0', lateFee: '0', gst: '0', serviceFee: '0' });
  const [deleteId, setDeleteId]     = useState(null);
  const { loading, call }           = useApi();

  useEffect(() => {
    fetchPlans();
    fetchSettings();
  }, []);

  const fetchPlans = () => {
    call(() => getAllPlans(), (res) => {
      const data = res.data || [];
      const list = data.map(p => ({
        id: p._id,
        name: p.plan_name,
        type: p.pricing_type.charAt(0).toUpperCase() + p.pricing_type.slice(1),
        price: String(p.price),
        badge: '', // Can be added to schema later if needed
        active: p.status === 'active',
        kmLimit: 'Unlimited',
        extraKmCharge: String(p.late_fee_per_hour || 0),
        helmetIncluded: true,
        insurance: 'Basic',
        description: p.description || '',
        features: p.features || [],
        security_deposit: p.security_deposit || 0
      }));
      setPlans(list);
    });
  };

  const fetchSettings = () => {
    call(() => getPlatformSettings(), (res) => {
      const s = res.data || {};
      setGlobal({
        deposit: s.security_deposit || '2000',
        lateFee: s.late_fee_per_hour || '150',
        gst: s.gst_percentage || '18',
        serviceFee: s.service_fee || '49'
      });
    });
  };

  const handleGlobalSave = () => {
    const payload = {
      security_deposit: global.deposit,
      late_fee_per_hour: global.lateFee,
      gst_percentage: global.gst,
      service_fee: global.serviceFee
    };
    call(() => updatePlatformSettings(payload), () => {
      alert("Global pricing rules updated!");
    });
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const g = (k) => (e) => setGlobal((p) => ({ ...p, [k]: e.target.value }));

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setFeatureInput('');
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setEditId(plan.id);
    setForm({ ...plan });
    setFeatureInput('');
    setShowModal(true);
  };

  const addFeature = () => {
    const val = featureInput.trim();
    if (!val) return;
    setForm((p) => ({ ...p, features: [...p.features, val] }));
    setFeatureInput('');
  };

  const removeFeature = (idx) =>
    setForm((p) => ({ ...p, features: p.features.filter((_, i) => i !== idx) }));

  const handleSave = () => {
    if (!form.name || !form.price) return;
    const payload = {
      plan_name: form.name,
      pricing_type: form.type.toLowerCase(),
      price: Number(form.price),
      status: form.active ? 'active' : 'inactive',
      description: form.description,
      features: form.features,
      late_fee_per_hour: Number(form.extraKmCharge) || 0,
      security_deposit: Number(global.deposit) // Default from global for now
    };
    if (editId) {
      call(
        () => updatePlan(editId, payload),
        () => { 
          fetchPlans();
          setShowModal(false); 
          alert("Plan updated successfully!");
        }
      );
    } else {
      call(
        () => createPlan(payload),
        () => {
          fetchPlans();
          setShowModal(false);
          alert("New plan published!");
        }
      );
    }
  };

  const handleDelete = (id) => {
    call(
      () => deletePlan(id),
      () => { 
        setDeleteId(null);
        fetchPlans();
      }
    );
  };

  const toggleActive = (id) => {
    call(
      () => togglePlan(id),
      () => fetchPlans()
    );
  };

  return (
    <div className="plans-page">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Rental Plans</h1>
          <p>Configure pricing, features and benefits for your EV fleet.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} /> Create New Plan
        </button>
      </div>

      {/* Global Pricing */}
      <div className="card global-pricing-card">
        <div className="global-pricing-header">
          <div className="global-icon"><CreditCard size={18} /></div>
          <div>
            <h3>Global Pricing Rules</h3>
            <p>System-wide fees applied across all plans.</p>
          </div>
        </div>
        <div className="global-fields">
          <div className="form-group">
            <label>Security Deposit (₹)</label>
            <div className="price-input-group">
              <span className="currency-symbol">₹</span>
              <input type="number" value={global.deposit} onChange={g('deposit')} />
            </div>
          </div>
          <div className="form-group">
            <label>Late Fee / Hour (₹)</label>
            <div className="price-input-group">
              <span className="currency-symbol">₹</span>
              <input type="number" value={global.lateFee} onChange={g('lateFee')} />
            </div>
          </div>
          <div className="form-group">
            <label>GST / Tax (%)</label>
            <div className="price-input-group">
              <span className="currency-symbol">%</span>
              <input type="number" value={global.gst} onChange={g('gst')} />
            </div>
          </div>
          <div className="form-group">
            <label>Service Fee / Booking (₹)</label>
            <div className="price-input-group">
              <span className="currency-symbol">₹</span>
              <input type="number" value={global.serviceFee} onChange={g('serviceFee')} />
            </div>
          </div>
          <div className="form-group global-save-btn">
            <button className="btn btn-primary" onClick={handleGlobalSave} disabled={loading}>
              {loading ? <Loader2 size={16} className="spin" /> : 'Save Rules'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="plans-stats">
        <div className="card plans-stat">
          <span className="plans-stat-val">{plans.length}</span>
          <span className="plans-stat-label">Total Plans</span>
        </div>
        <div className="card plans-stat">
          <span className="plans-stat-val">{plans.filter((p) => p.active).length}</span>
          <span className="plans-stat-label">Active Plans</span>
        </div>
        <div className="card plans-stat">
          <span className="plans-stat-val">₹{plans.length > 0 ? Math.min(...plans.map((p) => Number(p.price))) : 0}</span>
          <span className="plans-stat-label">Starting Price</span>
        </div>
        <div className="card plans-stat">
          <span className="plans-stat-val">₹{plans.length > 0 ? Math.max(...plans.map((p) => Number(p.price))) : 0}</span>
          <span className="plans-stat-label">Highest Plan</span>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`card plan-card plan-${plan.type.toLowerCase()} ${!plan.active ? 'plan-inactive' : ''}`}>

            {/* Badge */}
            {plan.active && <span className="plan-badge">Live</span>}
            {!plan.active && <span className="plan-badge" style={{ background: '#94a3b8' }}>Draft</span>}

            {/* Header */}
            <div className="plan-header">
              <div className="plan-icon">{typeIcons[plan.type] || <Zap size={22} />}</div>
              <div className="plan-title-group">
                <h3>{plan.name}</h3>
                <span className="plan-type-label">{plan.type} Plan</span>
              </div>
            </div>

            {/* Price */}
            <div className="plan-price">
              <span className="plan-currency">₹</span>
              {plan.price}
              <span className="plan-unit">/{plan.type.toLowerCase() === 'hourly' ? 'hr' : plan.type.toLowerCase() === 'daily' ? 'day' : plan.type.toLowerCase() === 'weekly' ? 'week' : 'month'}</span>
            </div>

            {/* Description */}
            {plan.description && <p className="plan-desc">{plan.description}</p>}

            {/* Meta info */}
            <div className="plan-meta">
              <span><Bike size={13} /> {plan.kmLimit} km</span>
              <span><AlertCircle size={13} /> {plan.insurance}</span>
              {plan.helmetIncluded && <span><Check size={13} /> Helmet</span>}
            </div>

            {/* Features */}
            <ul className="plan-features">
              {plan.features.map((feat, i) => (
                <li key={i}><Check size={14} className="feature-check" />{feat}</li>
              ))}
            </ul>

            {/* Footer */}
            <div className="plan-footer">
              <button
                className={`toggle-btn ${plan.active ? 'active' : ''}`}
                onClick={() => toggleActive(plan.id)}
                title={plan.active ? 'Deactivate' : 'Activate'}
              >
                {plan.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                <span>{plan.active ? 'Active' : 'Inactive'}</span>
              </button>
              <div className="plan-action-btns">
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(plan)}>
                  <Edit3 size={14} /> Edit
                </button>
                <button className="btn-icon delete" onClick={() => setDeleteId(plan.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit Rental Plan' : 'Create New Rental Plan'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form className="user-form">

                {/* Section 1 — Basic */}
                <div className="form-section-title"><Tag size={14} /> Plan Details</div>
                <div className="form-group">
                  <label>Plan Name *</label>
                  <input type="text" placeholder="e.g. Monthly Commuter" value={form.name} onChange={f('name')} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Duration Type *</label>
                    <select value={form.type} onChange={f('type')}>
                      <option>Hourly</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Base Price (₹) *</label>
                    <div className="price-input-group">
                      <span className="currency-symbol">₹</span>
                      <input type="number" placeholder="0" value={form.price} onChange={f('price')} />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Plan Description</label>
                  <textarea
                    placeholder="Short description shown on the plan card..."
                    value={form.description}
                    onChange={f('description')}
                    rows={2}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Highlight Badge</label>
                    <input type="text" placeholder="e.g. Best Value, Popular" value={form.badge} onChange={f('badge')} />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.active ? 'active' : 'inactive'}
                      onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === 'active' }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Section 2 — Limits */}
                <div className="form-section-title"><Bike size={14} /> Ride Limits & Coverage</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>KM Limit</label>
                    <input type="text" placeholder="e.g. 50 or Unlimited" value={form.kmLimit} onChange={f('kmLimit')} />
                  </div>
                  <div className="form-group">
                    <label>Extra KM Charge (₹/km)</label>
                    <div className="price-input-group">
                      <span className="currency-symbol">₹</span>
                      <input type="number" placeholder="0" value={form.extraKmCharge} onChange={f('extraKmCharge')} />
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Insurance Type</label>
                    <select value={form.insurance} onChange={f('insurance')}>
                      <option>Basic</option>
                      <option>Full Cover</option>
                      <option>Comprehensive</option>
                      <option>None</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Helmet Included</label>
                    <select value={form.helmetIncluded ? 'yes' : 'no'}
                      onChange={(e) => setForm((p) => ({ ...p, helmetIncluded: e.target.value === 'yes' }))}>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                {/* Section 3 — Features */}
                <div className="form-section-title"><Check size={14} /> Plan Features</div>
                <div className="feature-input-row">
                  <input
                    type="text"
                    placeholder="Type a feature and press Add (e.g. Free Helmet, GPS Tracking)"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <button type="button" className="btn btn-primary" onClick={addFeature}>
                    <Plus size={16} /> Add
                  </button>
                </div>

                {form.features.length > 0 ? (
                  <div className="features-list">
                    {form.features.map((feat, i) => (
                      <div key={i} className="feature-tag">
                        <Check size={12} />
                        <span>{feat}</span>
                        <button type="button" className="feat-remove" onClick={() => removeFeature(i)}>
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-features-hint">No features added yet. Add features above.</p>
                )}

              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? <Loader2 size={16} className="spinner" /> : (editId ? 'Save Changes' : 'Publish Plan')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── DELETE CONFIRM ── */}
      {deleteId && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Plan</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-confirm-body">
                <div className="delete-icon"><Trash2 size={28} /></div>
                <p>Are you sure you want to delete <strong>{plans.find((p) => p.id === deleteId)?.name}</strong>?</p>
                <p className="delete-sub">This action cannot be undone.</p>
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
    </div>
  );
};

export default RentalPlans;
