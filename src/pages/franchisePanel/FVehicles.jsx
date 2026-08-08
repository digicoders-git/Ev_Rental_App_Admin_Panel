import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bike, Search, Eye, Battery, MapPin, X, Loader, Plus, Upload, Edit,
  Shield, CheckCircle, Wrench, BatteryCharging, AlertTriangle, IndianRupee,
  LayoutGrid, Trash2, Hash, SlidersHorizontal, RefreshCw, AlertCircle
} from 'lucide-react';
import useApi from '../../services/useApi';
import api from '../../services/api';
import { 
  createFranchiseVehicle, 
  getAllCategories, 
  createCategory, 
  deleteCategory,
  updateVehicleStatus
} from '../../services/apiServices';
import { io } from 'socket.io-client';

const emptyForm = {
  brand: '',
  name: '',
  regNo: '',
  vehicleId: '',
  category: '',
  type: 'scooter',
  range: '',
  battery: '100',
  features: '',
  batteryCapacity: '',
  chargingTime: '',
  file: null
};

const FVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [catForm, setCatForm] = useState({ name: '', description: '', file: null });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { loading, call } = useApi();
  const [manageStatusVehicle, setManageStatusVehicle] = useState(null); // for status modal
  const [statusTarget, setStatusTarget] = useState('');
  const [forceConfirm, setForceConfirm] = useState(null);

  const fetchVehicles = () => {
    call(() => api.get('/vehicles/franchise/my'), (res) => {
      setVehicles(res.data || []);
    });
  };

  const fetchCategories = () => {
    call(() => getAllCategories(), (res) => {
      setCategories(res.data || []);
    });
  };

  useEffect(() => { 
    fetchVehicles(); 
    fetchCategories();
  }, []);

  useEffect(() => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(BASE_URL);

    socket.on('admin_data_changed', () => {
      fetchVehicles();
      fetchCategories();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const filtered = vehicles.filter(v =>
    (v.vehicle_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.registration_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.vehicle_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.brand || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const map = { active: 'badge-success', inactive: 'badge-danger', maintenance: 'badge-warning' };
    return map[status] || 'badge-warning';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({ ...prev, file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!form.brand || !form.name || !form.regNo || !form.category) {
      alert('Please fill in all required fields (Brand, Model, Reg. Number, and Category).');
      return;
    }

    const fd = new FormData();
    fd.append('brand', form.brand);
    fd.append('vehicle_name', form.name);
    fd.append('registration_number', form.regNo);
    if (form.vehicleId) fd.append('vehicle_id', form.vehicleId);
    fd.append('category', form.category);
    fd.append('vehicle_type', form.type);
    if (form.range) fd.append('range_per_charge', form.range);
    if (form.battery) fd.append('current_battery', form.battery);
    if (form.batteryCapacity) fd.append('battery_capacity', form.batteryCapacity);
    if (form.chargingTime) fd.append('charging_time', form.chargingTime);
    if (form.features) fd.append('features', form.features);
    if (form.file) fd.append('thumbnail_image', form.file);

    call(() => createFranchiseVehicle(fd), () => {
      setShowModal(false);
      setImagePreview(null);
      setForm(emptyForm);
      fetchVehicles();
    }, (err) => {
      alert(err || 'Failed to add vehicle.');
    });
  };

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const batteryColor = (b) => b < 20 ? '#ef4444' : b < 50 ? '#f59e0b' : '#10b981';
  const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

  // ── Status Management ──
  const openManageStatus = (v) => {
    const displayStatus = v.is_busy ? 'On Ride' : (v.status === 'active' ? 'Available' : v.status === 'maintenance' ? 'Maintenance' : v.status === 'out_of_order' ? 'Out of Order' : v.status);
    setManageStatusVehicle({ ...v, displayStatus });
    setStatusTarget(displayStatus);
    setForceConfirm(null);
  };

  const handleStatusSave = async () => {
    let apiStatus;
    if (statusTarget === 'Available') apiStatus = 'available';
    else if (statusTarget === 'Maintenance') apiStatus = 'maintenance';
    else if (statusTarget === 'Out of Order') apiStatus = 'out_of_order';
    else return;

    try {
      await updateVehicleStatus(manageStatusVehicle._id, apiStatus, false);
      setManageStatusVehicle(null);
      fetchVehicles();
    } catch (err) {
      const data = err.response?.data;
      if (data?.conflict) {
        setForceConfirm({
          vehicleId: manageStatusVehicle._id,
          vehicleName: manageStatusVehicle.vehicle_name,
          booking_id: data.booking_id,
          booking_status: data.booking_status,
          targetStatus: apiStatus
        });
      } else {
        alert(data?.message || 'Failed to update vehicle status');
      }
    }
  };

  const handleForceOverride = async () => {
    if (!forceConfirm) return;
    try {
      await updateVehicleStatus(forceConfirm.vehicleId, forceConfirm.targetStatus, true);
      setForceConfirm(null);
      setManageStatusVehicle(null);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Force override failed');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1>My Fleet</h1>
          <p>Vehicles assigned to your franchise store.</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--primary)' }}>{vehicles.length}</h2>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Total Fleet</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#10b981' }}>{vehicles.filter(v => v.status === 'active' && !v.is_busy).length}</h2>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Available</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#f59e0b' }}>{vehicles.filter(v => v.is_busy).length}</h2>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>On Ride</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3>Fleet List</h3>
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Search vehicles, reg no, vehicle ID..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading && vehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><Loader size={28} className="spinner" color="var(--primary)" /></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Reg. Number</th>
                  <th>Driver</th>
                  <th>Booking Start</th>
                  <th>Submission Date</th>
                  <th>Submission Time</th>
                  <th>Ownership Source</th>
                  <th>Category</th>
                  <th>Battery</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    <Bike size={28} style={{ display: 'block', margin: '0 auto 0.5rem' }} />
                    No vehicles found in your fleet.
                  </td></tr>
                ) : filtered.map(v => (
                  <tr key={v._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {v.thumbnail_image ? (
                          <img src={`${BASE_URL}/${v.thumbnail_image}`} alt={v.vehicle_name}
                            style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bike size={20} color="#065f46" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{v.vehicle_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{v.registration_number || 'N/A'}</td>
                    <td style={{ fontWeight: 600, color: '#334155' }}>{v.driver_name || '—'}</td>
                    <td style={{ fontWeight: 600, color: '#334155' }}>
                      {v.booking_start_date ? new Date(v.booking_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0369a1' }}>
                      {v.submission_date ? new Date(v.submission_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ fontWeight: 600, color: '#15803d' }}>
                      {v.submission_date ? new Date(v.submission_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td>
                      {v.added_by_franchise ? (
                        <span className="badge" style={{ background: '#ede9fe', color: '#5b21b6', border: '1px solid #ddd6fe', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <Shield size={12} /> Franchise Owned
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <CheckCircle size={12} /> Assigned by Admin
                        </span>
                      )}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{v.category?.name || v.vehicle_type || 'scooter'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Battery size={16} color={batteryColor(v.current_battery || v.battery_level || 100)} />
                        {(v.current_battery != null) ? `${v.current_battery}%` : (v.battery_level != null ? `${v.battery_level}%` : '100%')}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        v.submission_status === 'Pending Approval' ? 'badge-warning' :
                        v.submission_status === 'Submitted' ? 'badge-info' :
                        v.submission_status === 'Submission Rejected' ? 'badge-danger' :
                        v.is_busy ? 'badge-warning' : getStatusBadge(v.status)
                      }`}>
                        {v.submission_status || (v.is_busy ? 'On Ride' : v.status)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className="btn-icon" title="View Details" onClick={() => setSelected(v)}>
                          <Eye size={16} />
                        </button>
                        <button className="btn-icon" title="Manage Status" style={{ color: '#8b5cf6' }} onClick={() => openManageStatus(v)}>
                          <SlidersHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Vehicle Modal */}
      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-xl" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Own Vehicle to Fleet</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form className="user-form" onSubmit={handleAddSubmit}>
                {/* Image Upload */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Vehicle Thumbnail Image</label>
                  <div className="image-upload-box" onClick={() => fileInputRef.current.click()} style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '2rem', textAlign: 'center', cursor: 'pointer', background: 'var(--background)' }}>
                    {imagePreview ? (
                      <div className="upload-preview" style={{ position: 'relative', height: '140px' }}>
                        <img src={imagePreview} alt="Vehicle Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                        <div className="upload-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0, transition: 'opacity 0.2s', borderRadius: '8px' }}><Upload size={20} /> Change Image</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <Upload size={24} color="var(--primary)" />
                        <span style={{ fontWeight: 500 }}>Click to upload vehicle photo</span>
                        <small style={{ color: 'var(--text-secondary)' }}>PNG, JPG up to 5MB</small>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*" />
                </div>

                <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}><Bike size={16} /> Basic Information</div>
                
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Brand / Manufacturer *</label>
                    <input type="text" placeholder="e.g. Ola Electric, Ather" value={form.brand} onChange={f('brand')} required style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px' }} />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Model Name *</label>
                    <input type="text" placeholder="e.g. S1 Pro, 450X" value={form.name} onChange={f('name')} required style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px' }} />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Registration Number *</label>
                    <input type="text" placeholder="e.g. UP32 AB 1234" value={form.regNo} onChange={f('regNo')} required style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px' }} />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Category *</label>
                    <select value={form.category} onChange={f('category')} required style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Vehicle ID</span>
                      <button type="button"
                        style={{ fontSize: '0.72rem', color: 'var(--primary)', background: '#eff6ff', border: 'none', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => setForm(p => ({ ...p, vehicleId: 'VEH-' + Date.now().toString().slice(-6) }))}>
                        Auto Generate
                      </button>
                    </label>
                    <input type="text" placeholder="e.g. VEH-123456 (leave blank to auto-generate)" value={form.vehicleId} onChange={f('vehicleId')} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px' }} />
                  </div>
                  <div className="form-group">
                    <label>Legacy Vehicle Type (Optional)</label>
                    <select value={form.type} onChange={f('type')} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <option value="scooter">Scooter</option>
                      <option value="bike">Bike</option>
                      <option value="car">Car</option>
                    </select>
                  </div>
                </div>

                <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1.5rem' }}><BatteryCharging size={16} /> Performance & EV Info</div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Range per Charge (km)</label>
                    <input type="number" placeholder="e.g. 150" value={form.range} onChange={f('range')} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px' }} />
                  </div>
                  <div className="form-group">
                    <label>Battery Capacity (kWh)</label>
                    <input type="text" placeholder="e.g. 4.0 kWh" value={form.batteryCapacity} onChange={f('batteryCapacity')} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px' }} />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Charging Time</label>
                    <input type="text" placeholder="e.g. 6.5 hrs" value={form.chargingTime} onChange={f('chargingTime')} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px' }} />
                  </div>
                  <div className="form-group">
                    <label>Current Battery Level (%)</label>
                    <input type="number" placeholder="100" min="0" max="100" value={form.battery} onChange={f('battery')} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Features (comma separated)</label>
                  <input type="text" placeholder="e.g. GPS Tracking, Touchscreen, Reverse Mode, Bluetooth" value={form.features} onChange={f('features')} style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px' }} />
                </div>
              </form>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddSubmit} disabled={loading}>
                {loading ? <Loader size={16} className="spinner" /> : 'Add Vehicle'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Manage Categories Modal */}
      {showCatModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Manage Categories</h3>
              <button className="btn-icon" onClick={() => setShowCatModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="cat-manage-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="cat-add-box" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Category Name (e.g. Scooters)" 
                    value={catForm.name}
                    onChange={(e) => setCatForm({...catForm, name: e.target.value})}
                    style={{ flex: 1, padding: '0.6rem', border: '1px solid var(--border)', borderRadius: '6px', minWidth: '150px' }}
                  />
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => { const file = e.target.files[0]; if(file) setCatForm({...catForm, file}) }}
                    style={{ flex: 1, padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '6px', minWidth: '150px', fontSize: '0.8rem' }}
                  />
                  <button className="btn btn-primary" onClick={() => {
                    if (!catForm.name.trim()) return;
                    
                    const fd = new FormData();
                    fd.append('name', catForm.name);
                    if (catForm.description) fd.append('description', catForm.description);
                    if (catForm.file) fd.append('image', catForm.file);

                    call(() => createCategory(fd), 
                      () => {
                        setCatForm({ name: '', description: '', file: null });
                        fetchCategories();
                        alert('Category added successfully!');
                      }, 
                      (err) => alert('Failed to add category: ' + err)
                    );
                  }} disabled={loading || !catForm.name} style={{ whiteSpace: 'nowrap' }}>
                    {loading ? '...' : 'Add'}
                  </button>
                </div>
                
                <div className="cat-list" style={{ border: '1px solid var(--border)', borderRadius: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                  {categories && categories.length > 0 ? categories.map(cat => (
                    <div key={cat._id} className="cat-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 500 }}>{cat.name}</span>
                      <button className="btn-icon delete" onClick={() => {
                        if(window.confirm(`Delete "${cat.name}" category?`)) {
                          call(() => deleteCategory(cat._id), 
                            () => {
                              fetchCategories();
                              alert('Category deleted!');
                            }, 
                            (err) => alert('Error: ' + err)
                          );
                        }
                      }}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No categories found.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowCatModal(false)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Vehicle Detail Modal */}
      {selected && createPortal(
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0 }}>{selected.vehicle_name}</h3>
                {selected.added_by_franchise ? (
                  <span className="badge" style={{ background: '#ede9fe', color: '#5b21b6', border: '1px solid #ddd6fe', fontSize: '0.75rem' }}>Franchise Owned</span>
                ) : (
                  <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe', fontSize: '0.75rem' }}>Admin Assigned</span>
                )}
              </div>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {selected.thumbnail_image ? (
                <img src={`${BASE_URL}/${selected.thumbnail_image}`} alt={selected.vehicle_name}
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
              ) : (
                <div style={{ width: '100%', height: '180px', borderRadius: '8px', background: 'var(--background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Bike size={48} color="var(--primary)" />
                  <span style={{ color: 'var(--text-secondary)' }}>No image uploaded</span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  ['Brand', selected.brand], ['Model', selected.vehicle_name],
                  ['Reg. Number', selected.registration_number], ['Category', selected.category?.name || selected.vehicle_type],
                  ['Driver', selected.driver_name || '—'], ['Status', selected.submission_status || (selected.is_busy ? 'On Ride' : selected.status)],
                  ['Submission Date', selected.submission_date ? new Date(selected.submission_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
                  ['Submission Time', selected.submission_date ? new Date(selected.submission_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'],
                  ['Battery', (selected.current_battery != null) ? `${selected.current_battery}%` : (selected.battery_level != null ? `${selected.battery_level}%` : '100%')],
                  ['Range', selected.range_per_charge ? `${selected.range_per_charge} km` : (selected.range_km ? `${selected.range_km} km` : 'N/A')],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: 'var(--background)', padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontWeight: 600, textTransform: label === 'Submission Date' || label === 'Submission Time' || label === 'Driver' || label === 'Reg. Number' ? 'none' : 'capitalize' }}>{value || 'N/A'}</div>
                  </div>
                ))}
              </div>
              {selected.features?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Features</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selected.features.map(f => (
                      <span key={f} className="badge badge-info" style={{ textTransform: 'capitalize' }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MANAGE STATUS MODAL (Franchise) ── */}
      {manageStatusVehicle && createPortal(
        <div className="modal-overlay" onClick={() => { setManageStatusVehicle(null); setForceConfirm(null); }}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SlidersHorizontal size={18} color="var(--primary)" />
                <h3>Manage Vehicle Status</h3>
              </div>
              <button className="btn-icon" onClick={() => { setManageStatusVehicle(null); setForceConfirm(null); }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{manageStatusVehicle.vehicle_name} • {manageStatusVehicle.registration_number}</span>
                <span className={`badge ${getStatusBadge(manageStatusVehicle.status)}`} style={{ textTransform: 'capitalize' }}>{manageStatusVehicle.status}</span>
              </div>

              {manageStatusVehicle.status === 'active' && manageStatusVehicle.is_busy && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <AlertCircle size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: '0.83rem', color: '#1e40af', lineHeight: 1.5 }}>
                    This vehicle has an <strong>active booking</strong>. Selecting Available and saving will prompt a confirmation to cancel the booking.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {['Available', 'Maintenance', 'Out of Order'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusTarget(s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500,
                      border: statusTarget === s ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: statusTarget === s ? 'var(--primary-light)' : 'transparent',
                      color: statusTarget === s ? 'var(--primary)' : 'var(--text-primary)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {s === 'Available' && <CheckCircle size={16} />}
                    {s === 'Maintenance' && <Wrench size={16} />}
                    {s === 'Out of Order' && <AlertTriangle size={16} />}
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => { setManageStatusVehicle(null); setForceConfirm(null); }}>Cancel</button>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleStatusSave}>
                <CheckCircle size={15} /> Save Status
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── FORCE OVERRIDE CONFIRMATION MODAL (Franchise) ── */}
      {forceConfirm && createPortal(
        <div className="modal-overlay" onClick={() => setForceConfirm(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} color="#dc2626" />
                <h3 style={{ color: '#dc2626' }}>Active Booking Conflict</h3>
              </div>
              <button className="btn-icon" onClick={() => setForceConfirm(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b', lineHeight: 1.6 }}>
                  ⚠️ <strong>Vehicle "{forceConfirm.vehicleName}"</strong> has an active booking:<br />
                  <strong>Booking ID:</strong> {forceConfirm.booking_id}&nbsp;•&nbsp;
                  <strong>Status:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{forceConfirm.booking_status}</span>
                </p>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Proceeding will <strong>cancel the active booking</strong> and mark the vehicle as <strong>Available</strong>.
                <br /><br />
                ⚠️ This <strong>cannot be undone</strong>. Please communicate with the customer first.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setForceConfirm(null)}>Go Back</button>
              <button
                className="btn"
                style={{ background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                onClick={handleForceOverride}
              >
                <AlertTriangle size={15} /> Force Override & Mark Available
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default FVehicles;
