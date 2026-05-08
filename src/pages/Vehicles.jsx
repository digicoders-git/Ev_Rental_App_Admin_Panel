import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Battery, MapPin, Plus, Search, Edit, Trash2, X, Upload,
  Eye, Car, CheckCircle, Clock, Wrench, IndianRupee,
  BatteryCharging, Shield, ToggleLeft, ToggleRight,
  AlertTriangle, RefreshCw, SlidersHorizontal, Loader,
  Settings, LayoutGrid
} from 'lucide-react';
import { 
  getAllVehicles, createVehicle, deleteVehicle, updateVehicle, getAllStores,
  getAllCategories, createCategory, updateCategory, deleteCategory
} from '../services/apiServices';
import useApi from '../services/useApi';
import './Vehicles.css';

const emptyForm = {
  name: '', brand: '', regNo: '', category: '', color: '', year: '',
  status: 'Available', battery: '', range: '', topSpeed: '', motorPower: '',
  chargingTime: '', batteryCapacity: '', odometer: '',
  ratePerHour: '', ratePerDay: '',
  franchise: '', location: '',
  insuranceExpiry: '', pucExpiry: '',
};

const statusConfig = {
  Available:   { cls: 'badge-success', icon: <CheckCircle size={12} /> },
  Booked:      { cls: 'badge-info',    icon: <Clock size={12} /> },
  Maintenance: { cls: 'badge-warning', icon: <Wrench size={12} /> },
};

const Vehicles = () => {
  const [vehicles, setVehicles]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [showModal, setShowModal]       = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [viewVehicle, setViewVehicle]   = useState(null);
  const [manageVehicle, setManageVehicle] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch]             = useState('');
  const [form, setForm]                 = useState(emptyForm);
  const [catForm, setCatForm]           = useState({ name: '', description: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteId, setDeleteId]         = useState(null);
  const [avail, setAvail]               = useState({ status: '', battery: '', location: '', reason: '' });
  const [franchises, setFranchises]     = useState([]);
  const fileInputRef = useRef(null);
  const { loading, error, call }        = useApi();

  const fetchCategories = () => {
    call(() => getAllCategories(), (res) => {
      console.log("Categories fetched:", res);
      const catList = res.data || [];
      setCategories(catList);
    });
  };

  /* ── fetch vehicles ── */
  const fetchVehicles = () => {
    call(
      () => getAllVehicles(),
      (data) => {
        const vehiclesData = data.data || data.vehicles || data;
        const list = Array.isArray(vehiclesData) ? vehiclesData.map(v => ({
          id: v._id,
          name: v.vehicle_name,
          brand: v.brand,
          regNo: v.registration_number,
          category: v.category?.name || v.vehicle_type || 'N/A',
          catId: v.category?._id || '',
          status: v.is_busy ? 'Booked' : (v.status === 'active' ? 'Available' : 'Maintenance'),
          battery: v.battery_level || 100,
          location: v.location || '',
          franchise: v.franchise?.store_name || 'Unassigned',
          range: v.range_per_charge || 0,
          topSpeed: v.top_speed || 0,
          motorPower: v.motor_power || '',
          chargingTime: v.charging_time || '',
          batteryCapacity: v.battery_capacity || '',
          year: v.year || '',
          color: v.color || '',
          ratePerHour: v.price_per_hour || 0,
          ratePerDay: v.price_per_day || 0,
          insuranceExpiry: v.insurance_valid_till || '',
          pucExpiry: v.puc_valid_till || '',
          odometer: v.odometer || 0,
        })) : [];
        setVehicles(list);
      }
    );
  };

  useEffect(() => {
    fetchVehicles();
    fetchCategories();

    // Fetch Franchises
    getAllStores().then(res => {
      setFranchises(res.data?.data || res.data || []);
    }).catch(err => console.error("Franchise fetch error:", err));
  }, []);

  const filtered = vehicles.filter((v) => {
    const matchStatus = filterStatus === 'All' || v.status === filterStatus;
    const matchSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.regNo.toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.franchise.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    All: vehicles.length,
    Available: vehicles.filter((v) => v.status === 'Available').length,
    Booked: vehicles.filter((v) => v.status === 'Booked').length,
    Maintenance: vehicles.filter((v) => v.status === 'Maintenance').length,
  };

  const handleAdd = () => {
    if (!form.name || !form.regNo) return;
    const fd = new FormData();
    fd.append('vehicle_name', form.name);
    fd.append('brand', form.brand);
    fd.append('registration_number', form.regNo);
    if (form.category) fd.append('category', form.category);
    if (form.franchise) fd.append('franchise', form.franchise);
    
    fd.append('vehicle_type', 'scooter'); // Legacy fallback
    fd.append('year', form.year);
    fd.append('color', form.color);
    fd.append('battery_capacity', form.batteryCapacity);
    fd.append('range_per_charge', form.range);
    fd.append('top_speed', form.topSpeed);
    fd.append('motor_power', form.motorPower);
    fd.append('charging_time', form.chargingTime);
    fd.append('price_per_day', form.ratePerDay);
    fd.append('price_per_hour', form.ratePerHour);
    fd.append('odometer', form.odometer);
    fd.append('status', form.status === 'Available' ? 'active' : form.status.toLowerCase());
    fd.append('location', form.location);
    fd.append('insurance_valid_till', form.insuranceExpiry);
    fd.append('puc_valid_till', form.pucExpiry);
    if (form.file) fd.append('thumbnail_image', form.file);

    call(
      () => createVehicle(fd),
      () => {
        setForm(emptyForm);
        setImagePreview(null);
        setShowModal(false);
        fetchVehicles();
      },
      (err) => {
        alert(err || "Failed to add vehicle. Please check all fields.");
      }
    );
  };

  const handleDelete = (id) => {
    call(
      () => deleteVehicle(id),
      () => {
        setDeleteId(null);
        fetchVehicles();
      }
    );
  };

  const openManage = (v) => {
    setManageVehicle(v);
    setAvail({ status: v.status, battery: v.battery, location: v.location, reason: '' });
  };

  const handleAvailSave = () => {
    const apiStatus = avail.status === 'Available' ? 'active' : avail.status === 'Maintenance' ? 'maintenance' : 'booked';
    call(
      () => updateVehicle(manageVehicle.id, { status: apiStatus }),
      () => {
        setManageVehicle(null);
        fetchVehicles();
      }
    );
  };

  const quickStatus = (id, status) =>
    setVehicles((prev) => prev.map((v) => v.id === id ? { ...v, status } : v));

  const f  = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const av = (k) => (e) => setAvail((p) => ({ ...p, [k]: e.target.value }));

  const batteryColor = (b) => b < 20 ? '#ef4444' : b < 50 ? '#f59e0b' : '#10b981';

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({ ...prev, file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="vehicles-page">
      <div className="page-header">
        <div>
          <h1>Fleet Management</h1>
          <p>Manage and monitor your entire EV fleet.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={() => setShowCatModal(true)}>
            <LayoutGrid size={18} /> Categories
          </button>
          <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setImagePreview(null); setShowModal(true); }}>
            <Plus size={18} /> Add New Vehicle
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="veh-stats">
        {Object.entries(counts).map(([label, val]) => (
          <div key={label} className="card veh-stat-card" onClick={() => setFilterStatus(label)}
            style={{ cursor: 'pointer', borderColor: filterStatus === label ? 'var(--primary)' : '' }}>
            <div className={`veh-stat-icon ${label.toLowerCase()}`}>
              {label === 'All' ? <Car size={18} /> : label === 'Available' ? <CheckCircle size={18} /> : label === 'Booked' ? <Clock size={18} /> : <Wrench size={18} />}
            </div>
            <div>
              <span className="veh-stat-label">{label}</span>
              <h3>{val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="veh-toolbar">
          <div className="filter-tabs">
            {['All', 'Available', 'Booked', 'Maintenance'].map((s) => (
              <button key={s} className={`filter-tab ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}>
                {s} <span className="tab-count">{counts[s]}</span>
              </button>
            ))}
          </div>
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Search vehicle, brand, reg no..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Vehicle</th>
                <th>Reg. Number</th>
                <th>Category</th>
                <th>Battery</th>
                <th>Range</th>
                <th>Franchise</th>
                <th>Rate/Day</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="veh-empty-row"><Car size={28} /><p>No vehicles found.</p></td></tr>
              ) : (
                filtered.map((v, i) => (
                  <tr key={v.id}>
                    <td className="td-muted">{i + 1}</td>
                    <td>
                      <div className="veh-name-cell">
                        <div className="veh-icon"><Car size={15} /></div>
                        <div>
                          <span className="veh-name">{v.name}</span>
                          <span className="veh-brand">{v.brand} • {v.year}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="reg-badge">{v.regNo}</span></td>
                    <td className="td-muted">{v.category}</td>
                    <td>
                      <div className="battery-cell">
                        <div className="battery-bar-wrap">
                          <div className="battery-bar-fill" style={{ width: `${v.battery}%`, background: batteryColor(v.battery) }} />
                        </div>
                        <span style={{ color: batteryColor(v.battery), fontWeight: 600, fontSize: '0.8rem' }}>{v.battery}%</span>
                      </div>
                    </td>
                    <td className="td-muted">{v.range} km</td>
                    <td>
                      <div className="franchise-cell">
                        <MapPin size={13} />
                        <span>{v.franchise}</span>
                      </div>
                    </td>
                    <td><span className="rate-text">₹{v.ratePerDay}/day</span></td>
                    <td>
                      <span className={`badge badge-icon ${statusConfig[v.status].cls}`}>
                        {statusConfig[v.status].icon} {v.status}
                      </span>
                    </td>
                    <td>
                      <div className="veh-actions">
                        <button className="btn-icon" title="View Details" onClick={() => setViewVehicle(v)}><Eye size={15} /></button>
                        <button className="btn-icon manage" title="Manage Availability" onClick={() => openManage(v)}><SlidersHorizontal size={15} /></button>
                        <button className="btn-icon delete" title="Delete" onClick={() => setDeleteId(v.id)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ADD VEHICLE MODAL ── */}
      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Vehicle</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form className="user-form">

                {/* Image Upload */}
                <div className="form-group">
                  <label>Vehicle Image</label>
                  <div className="image-upload-box" onClick={() => fileInputRef.current.click()}>
                    {imagePreview ? (
                      <div className="upload-preview">
                        <img src={imagePreview} alt="Vehicle Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                        <div className="upload-overlay"><Upload size={20} /> Change Image</div>
                      </div>
                    ) : (
                      <>
                        <Upload size={22} />
                        <span>Click to upload image</span>
                        <small>PNG, JPG up to 5MB</small>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*" />
                </div>

                {/* Section 1 */}
                <div className="form-section-title"><Car size={14} /> Basic Information</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vehicle Model Name *</label>
                    <input type="text" placeholder="e.g. Ather 450X" value={form.name} onChange={f('name')} />
                  </div>
                  <div className="form-group">
                    <label>Brand / Manufacturer *</label>
                    <input type="text" placeholder="e.g. Ather Energy" value={form.brand} onChange={f('brand')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Registration Number *</label>
                    <input type="text" placeholder="KA 01 XX 0000" value={form.regNo} onChange={f('regNo')} />
                  </div>
                  <div className="form-group">
                    <label>Manufacturing Year</label>
                    <input type="number" placeholder="2024" value={form.year} onChange={f('year')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vehicle Category *</label>
                    <select value={form.category} onChange={f('category')} required>
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <input type="text" placeholder="e.g. Space Grey" value={form.color} onChange={f('color')} />
                  </div>
                </div>

                {/* Section 2 */}
                <div className="form-section-title"><BatteryCharging size={14} /> Battery & Performance</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Battery Capacity (kWh)</label>
                    <input type="text" placeholder="e.g. 3.7 kWh" value={form.batteryCapacity} onChange={f('batteryCapacity')} />
                  </div>
                  <div className="form-group">
                    <label>Current Battery (%)</label>
                    <input type="number" placeholder="100" min="0" max="100" value={form.battery} onChange={f('battery')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Range per Charge (km)</label>
                    <input type="number" placeholder="e.g. 146" value={form.range} onChange={f('range')} />
                  </div>
                  <div className="form-group">
                    <label>Top Speed (km/h)</label>
                    <input type="number" placeholder="e.g. 90" value={form.topSpeed} onChange={f('topSpeed')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Motor Power</label>
                    <input type="text" placeholder="e.g. 6 kW" value={form.motorPower} onChange={f('motorPower')} />
                  </div>
                  <div className="form-group">
                    <label>Charging Time</label>
                    <input type="text" placeholder="e.g. 5.45 hrs" value={form.chargingTime} onChange={f('chargingTime')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Odometer Reading (km)</label>
                    <input type="number" placeholder="e.g. 4520" value={form.odometer} onChange={f('odometer')} />
                  </div>
                  <div className="form-group">
                    <label>Current Status</label>
                    <select value={form.status} onChange={f('status')}>
                      <option>Available</option>
                      <option>Booked</option>
                      <option>Maintenance</option>
                    </select>
                  </div>
                </div>

                {/* Section 3 */}
                <div className="form-section-title"><IndianRupee size={14} /> Rental Pricing</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Rate per Hour (₹)</label>
                    <input type="number" placeholder="e.g. 40" value={form.ratePerHour} onChange={f('ratePerHour')} />
                  </div>
                  <div className="form-group">
                    <label>Rate per Day (₹)</label>
                    <input type="number" placeholder="e.g. 600" value={form.ratePerDay} onChange={f('ratePerDay')} />
                  </div>
                </div>

                {/* Section 4 */}
                <div className="form-section-title"><MapPin size={14} /> Location & Assignment</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Franchise / Hub</label>
                    <select value={form.franchise} onChange={f('franchise')}>
                      <option value="">Select Franchise</option>
                      {franchises.map(store => (
                        <option key={store._id} value={store._id}>{store.store_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Current Location</label>
                    <input type="text" placeholder="e.g. Indiranagar, Bangalore" value={form.location} onChange={f('location')} />
                  </div>
                </div>

                {/* Section 5 */}
                <div className="form-section-title"><Shield size={14} /> Documents & Compliance</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Insurance Expiry Date</label>
                    <input type="date" value={form.insuranceExpiry} onChange={f('insuranceExpiry')} />
                  </div>
                  <div className="form-group">
                    <label>PUC Expiry Date</label>
                    <input type="date" value={form.pucExpiry} onChange={f('pucExpiry')} />
                  </div>
                </div>

              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
                {loading ? <Loader size={16} className="spinner" /> : 'Add to Fleet'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MANAGE AVAILABILITY MODAL ── */}
      {manageVehicle && createPortal(
        <div className="modal-overlay" onClick={() => setManageVehicle(null)}>
          <div className="modal-content modal-manage" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="veh-modal-title">
                <div className="veh-icon lg"><SlidersHorizontal size={18} /></div>
                <div>
                  <h3>Manage Availability</h3>
                  <span className="td-muted">{manageVehicle.name} • {manageVehicle.regNo}</span>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setManageVehicle(null)}><X size={20} /></button>
            </div>

            <div className="modal-body">

              {/* Current status banner */}
              <div className={`avail-current-banner avail-${manageVehicle.status.toLowerCase()}`}>
                <span>Current Status:</span>
                <span className={`badge badge-icon ${statusConfig[manageVehicle.status].cls}`}>
                  {statusConfig[manageVehicle.status].icon} {manageVehicle.status}
                </span>
              </div>

              {/* Quick status buttons */}
              <div className="form-section-title" style={{ marginTop: '1rem' }}><RefreshCw size={13} /> Change Status</div>
              <div className="avail-status-btns">
                {['Available', 'Booked', 'Maintenance'].map((s) => (
                  <button
                    key={s}
                    className={`avail-status-btn ${avail.status === s ? 'active-' + s.toLowerCase() : ''}`}
                    onClick={() => setAvail((p) => ({ ...p, status: s }))}
                  >
                    {s === 'Available' && <CheckCircle size={15} />}
                    {s === 'Booked'    && <Clock size={15} />}
                    {s === 'Maintenance' && <Wrench size={15} />}
                    {s}
                  </button>
                ))}
              </div>

              {/* Battery & Location */}
              <div className="form-section-title" style={{ marginTop: '1.25rem' }}><BatteryCharging size={13} /> Battery & Location</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Battery Level (%)</label>
                  <div className="avail-battery-wrap">
                    <input
                      type="number" min="0" max="100"
                      value={avail.battery}
                      onChange={av('battery')}
                    />
                    <div className="avail-battery-bar">
                      <div
                        className="avail-battery-fill"
                        style={{
                          width: `${avail.battery}%`,
                          background: batteryColor(Number(avail.battery))
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: batteryColor(Number(avail.battery)) }}>
                      {avail.battery}%
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Current Location</label>
                  <input type="text" placeholder="e.g. Indiranagar, Bangalore" value={avail.location} onChange={av('location')} />
                </div>
              </div>

              {/* Reason */}
              {avail.status === 'Maintenance' && (
                <>
                  <div className="form-section-title" style={{ marginTop: '0.5rem' }}><AlertTriangle size={13} /> Maintenance Reason</div>
                  <div className="form-group">
                    <textarea
                      rows={3}
                      placeholder="Describe the maintenance issue (e.g. Brake pad replacement, Battery check)..."
                      value={avail.reason}
                      onChange={av('reason')}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </>
              )}

            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setManageVehicle(null)} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAvailSave} disabled={loading}>
                {loading ? <Loader size={16} className="spinner" /> : <><CheckCircle size={15} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── VIEW DETAIL MODAL ── */}
      {viewVehicle && createPortal(
        <div className="modal-overlay" onClick={() => setViewVehicle(null)}>
          <div className="modal-content modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="veh-modal-title">
                <div className="veh-icon lg"><Car size={20} /></div>
                <div>
                  <h3>{viewVehicle.name}</h3>
                  <span className="td-muted">{viewVehicle.regNo} • {viewVehicle.brand}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span className={`badge badge-icon ${statusConfig[viewVehicle.status].cls}`}>
                  {statusConfig[viewVehicle.status].icon} {viewVehicle.status}
                </span>
                <button className="btn-icon" onClick={() => setViewVehicle(null)}><X size={20} /></button>
              </div>
            </div>
            <div className="modal-body">
              <div className="veh-detail-grid">
                <div className="veh-detail-section">
                  <div className="veh-detail-section-title"><Car size={13} /> Basic Info</div>
                  <div className="veh-detail-rows">
                    <div className="veh-detail-row"><span>Brand</span><span>{viewVehicle.brand}</span></div>
                    <div className="veh-detail-row"><span>Category</span><span>{viewVehicle.category}</span></div>
                    <div className="veh-detail-row"><span>Year</span><span>{viewVehicle.year}</span></div>
                    <div className="veh-detail-row"><span>Color</span><span>{viewVehicle.color}</span></div>
                    <div className="veh-detail-row"><span>Odometer</span><span>{viewVehicle.odometer?.toLocaleString()} km</span></div>
                  </div>
                </div>
                <div className="veh-detail-section">
                  <div className="veh-detail-section-title"><BatteryCharging size={13} /> Battery & Performance</div>
                  <div className="veh-detail-rows">
                    <div className="veh-detail-row"><span>Battery</span>
                      <span style={{ color: batteryColor(viewVehicle.battery), fontWeight: 700 }}>{viewVehicle.battery}%</span>
                    </div>
                    <div className="veh-detail-row"><span>Capacity</span><span>{viewVehicle.batteryCapacity}</span></div>
                    <div className="veh-detail-row"><span>Range</span><span>{viewVehicle.range} km</span></div>
                    <div className="veh-detail-row"><span>Top Speed</span><span>{viewVehicle.topSpeed} km/h</span></div>
                    <div className="veh-detail-row"><span>Motor Power</span><span>{viewVehicle.motorPower}</span></div>
                    <div className="veh-detail-row"><span>Charging Time</span><span>{viewVehicle.chargingTime}</span></div>
                  </div>
                </div>
                <div className="veh-detail-section">
                  <div className="veh-detail-section-title"><IndianRupee size={13} /> Pricing</div>
                  <div className="veh-detail-rows">
                    <div className="veh-detail-row"><span>Per Hour</span><span>₹{viewVehicle.ratePerHour}</span></div>
                    <div className="veh-detail-row"><span>Per Day</span><span>₹{viewVehicle.ratePerDay}</span></div>
                  </div>
                  <div className="veh-detail-section-title" style={{ marginTop: '1rem' }}><MapPin size={13} /> Location</div>
                  <div className="veh-detail-rows">
                    <div className="veh-detail-row"><span>Franchise</span><span>{viewVehicle.franchise}</span></div>
                    <div className="veh-detail-row"><span>Location</span><span>{viewVehicle.location}</span></div>
                  </div>
                </div>
                <div className="veh-detail-section">
                  <div className="veh-detail-section-title"><Shield size={13} /> Documents</div>
                  <div className="veh-detail-rows">
                    <div className="veh-detail-row"><span>Insurance Expiry</span><span>{viewVehicle.insuranceExpiry}</span></div>
                    <div className="veh-detail-row"><span>PUC Expiry</span><span>{viewVehicle.pucExpiry}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MANAGE CATEGORIES MODAL ── */}
      {showCatModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Categories</h3>
              <button className="btn-icon" onClick={() => setShowCatModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="cat-manage-wrap">
                <div className="cat-add-box">
                  <input 
                    type="text" 
                    placeholder="Category Name (e.g. Scooters)" 
                    value={catForm.name}
                    onChange={(e) => setCatForm({...catForm, name: e.target.value})}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    if (!catForm.name.trim()) return;
                    call(() => createCategory(catForm), 
                      () => {
                        setCatForm({ name: '', description: '' });
                        fetchCategories();
                        alert('Category added successfully!');
                      }, 
                      (err) => alert('Failed to add category: ' + err)
                    );
                  }} disabled={loading || !catForm.name}>
                    {loading ? '...' : 'Add'}
                  </button>
                </div>
                
                <div className="cat-list">
                  {categories && categories.length > 0 ? categories.map(cat => (
                    <div key={cat._id} className="cat-item">
                      <span>{cat.name}</span>
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
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )) : (
                    <div className="td-muted" style={{ textAlign: 'center', padding: '1rem' }}>No categories found.</div>
                  )}
                </div>
              </div>
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
              <h3>Delete Vehicle</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-body">
                <div className="delete-icon-wrap"><AlertTriangle size={28} /></div>
                <p>Are you sure you want to remove <strong>{vehicles.find(v => v.id === deleteId)?.name}</strong> from the fleet?</p>
                <p className="delete-sub">Registration: {vehicles.find(v => v.id === deleteId)?.regNo}</p>
                <p className="delete-sub">This action cannot be undone and all data will be lost.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteId(null)} disabled={loading}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)} disabled={loading}>
                {loading ? <Loader size={16} className="spinner" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Vehicles;
