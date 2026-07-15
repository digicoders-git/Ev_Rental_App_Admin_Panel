import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  MapPin, Plus, Search, Edit, Trash2, X, Upload,
  Eye, Car, CheckCircle, Clock, Wrench, IndianRupee,
  BatteryCharging, Shield, 
  AlertTriangle, RefreshCw, SlidersHorizontal, Loader,
  LayoutGrid, Hash, AlertCircle
} from 'lucide-react';
import { 
  getAllVehicles, createVehicle, deleteVehicle, updateVehicle, getAllStores,
  getAllCategories, createCategory, deleteCategory, updateCategory,
  updateVehicleStatus
} from '../services/apiServices';
import useApi from '../services/useApi';
import { io } from 'socket.io-client';
import './Vehicles.css';

const emptyForm = {
  name: '', brand: '', regNo: '', vehicleId: '', category: '', color: '', year: '',
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
  'Out of Order': { cls: 'badge-danger', icon: <AlertTriangle size={12} /> },
};

const Vehicles = () => {
  const [vehicles, setVehicles]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [showModal, setShowModal]       = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [viewVehicle, setViewVehicle]   = useState(null);
  const [manageVehicle, setManageVehicle] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch]             = useState('');
  const [form, setForm]                 = useState(emptyForm);
  const [catForm, setCatForm]           = useState({ name: '', description: '', file: null });
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatForm, setEditCatForm]   = useState({ name: '', description: '', file: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteId, setDeleteId]         = useState(null);
  const [editVehicle, setEditVehicle]   = useState(null); // holds raw vehicle object for editing
  const [editForm, setEditForm]         = useState({});
  const [avail, setAvail]               = useState({ status: '', battery: '', location: '', reason: '' });
  const [franchises, setFranchises]     = useState([]);
  const [forceConfirm, setForceConfirm] = useState(null); // holds conflict info for force-override modal
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
    const params = {};
    if (filterCategory) params.category = filterCategory;
    call(
      () => getAllVehicles(params),
      (data) => {
        const vehiclesData = data.data || data.vehicles || data;
        const list = Array.isArray(vehiclesData) ? vehiclesData.map(v => ({
          id: v._id,
          name: v.vehicle_name,
          brand: v.brand,
          regNo: v.registration_number,
          vehicleId: v.vehicle_id || '',
          category: v.category?.name || v.vehicle_type || 'N/A',
          catId: v.category?._id || '',
          status: v.is_busy ? 'Booked' : (v.status === 'active' ? 'Available' : (v.status === 'out_of_order' ? 'Out of Order' : 'Maintenance')),
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
          thumbnail_image: v.thumbnail_image,
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
  }, [filterCategory]);

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
  }, [filterCategory]);

  const filtered = vehicles.filter((v) => {
    const matchStatus = filterStatus === 'All' || v.status === filterStatus;
    const matchSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.regNo.toLowerCase().includes(search.toLowerCase()) ||
      v.vehicleId.toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.franchise.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    All: vehicles.length,
    Available: vehicles.filter((v) => v.status === 'Available').length,
    Booked: vehicles.filter((v) => v.status === 'Booked').length,
    Maintenance: vehicles.filter((v) => v.status === 'Maintenance').length,
    'Out of Order': vehicles.filter((v) => v.status === 'Out of Order').length,
  };

  const handleAdd = () => {
    if (!form.name || !form.regNo) return;
    const fd = new FormData();
    fd.append('vehicle_name', form.name);
    fd.append('brand', form.brand);
    fd.append('registration_number', form.regNo);
    if (form.vehicleId) fd.append('vehicle_id', form.vehicleId);
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
    fd.append('status', form.status === 'Available' ? 'active' : (form.status === 'Out of Order' ? 'out_of_order' : form.status.toLowerCase()));
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
    setForceConfirm(null);
  };

  const handleAvailSave = async () => {
    // 'Booked' is a computed display status — it means the DB status is 'active'
    // but there is an active booking. We handle this via the conflict flow.
    let targetStatus;
    if (avail.status === 'Booked') {
      // User is trying to change to 'Booked' manually — this is not a real DB status
      // We treat it as a no-op or show info. The vehicle is already effectively booked.
      alert('"Booked" is set automatically when there is an active booking. To mark as Available, please select Available instead.');
      return;
    } else if (avail.status === 'Available') {
      targetStatus = 'available';
    } else if (avail.status === 'Maintenance') {
      targetStatus = 'maintenance';
    } else if (avail.status === 'Out of Order') {
      targetStatus = 'out_of_order';
    } else {
      targetStatus = avail.status.toLowerCase();
    }

    try {
      const res = await updateVehicleStatus(manageVehicle.id, targetStatus, false);
      if (res.data?.success) {
        setManageVehicle(null);
        setForceConfirm(null);
        fetchVehicles();
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.conflict) {
        // Vehicle has an active booking — show force-override confirmation
        setForceConfirm({
          vehicleId: manageVehicle.id,
          booking_id: data.booking_id,
          booking_status: data.booking_status,
          booking_db_id: data.booking_db_id,
          targetStatus,
          vehicleName: manageVehicle.name
        });
      } else {
        alert(data?.message || 'Failed to update vehicle status');
      }
    }
  };

  const handleForceOverride = async () => {
    if (!forceConfirm) return;
    try {
      const res = await updateVehicleStatus(forceConfirm.vehicleId, forceConfirm.targetStatus, true);
      if (res.data?.success) {
        setForceConfirm(null);
        setManageVehicle(null);
        fetchVehicles();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Force override failed');
    }
  };

  const quickStatus = (id, status) =>
    setVehicles((prev) => prev.map((v) => v.id === id ? { ...v, status } : v));

  const f  = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const ef = (k) => (e) => setEditForm((p) => ({ ...p, [k]: e.target.value }));
  const av = (k) => (e) => setAvail((p) => ({ ...p, [k]: e.target.value }));

  const openEdit = (v) => {
    setEditForm({
      name: v.name, brand: v.brand, regNo: v.regNo, vehicleId: v.vehicleId,
      category: v.catId, color: v.color, year: v.year,
      batteryCapacity: v.batteryCapacity, range: v.range,
      topSpeed: v.topSpeed, motorPower: v.motorPower, chargingTime: v.chargingTime,
      odometer: v.odometer, ratePerHour: v.ratePerHour, ratePerDay: v.ratePerDay,
      location: v.location, franchise: '',
      insuranceExpiry: v.insuranceExpiry ? new Date(v.insuranceExpiry).toISOString().split('T')[0] : '',
      pucExpiry: v.pucExpiry ? new Date(v.pucExpiry).toISOString().split('T')[0] : '',
      status: v.status,
    });
    setEditVehicle(v);
  };

  const handleEdit = () => {
    const fd = new FormData();
    fd.append('vehicle_name', editForm.name);
    fd.append('brand', editForm.brand);
    fd.append('registration_number', editForm.regNo);
    if (editForm.vehicleId) fd.append('vehicle_id', editForm.vehicleId);
    if (editForm.category) fd.append('category', editForm.category);
    fd.append('year', editForm.year);
    fd.append('color', editForm.color);
    fd.append('battery_capacity', editForm.batteryCapacity);
    fd.append('range_per_charge', editForm.range);
    fd.append('top_speed', editForm.topSpeed);
    fd.append('motor_power', editForm.motorPower);
    fd.append('charging_time', editForm.chargingTime);
    fd.append('price_per_day', editForm.ratePerDay);
    fd.append('price_per_hour', editForm.ratePerHour);
    fd.append('odometer', editForm.odometer);
    fd.append('status', editForm.status === 'Available' ? 'active' : (editForm.status === 'Out of Order' ? 'out_of_order' : (editForm.status === 'Maintenance' ? 'maintenance' : 'active')));
    fd.append('location', editForm.location);
    if (editForm.insuranceExpiry) fd.append('insurance_valid_till', editForm.insuranceExpiry);
    if (editForm.pucExpiry) fd.append('puc_valid_till', editForm.pucExpiry);
    if (editForm.file) fd.append('thumbnail_image', editForm.file);
    call(
      () => updateVehicle(editVehicle.id, fd),
      () => { setEditVehicle(null); fetchVehicles(); },
      (err) => alert(err || 'Failed to update vehicle')
    );
  };

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
            {['All', 'Available', 'Booked', 'Maintenance', 'Out of Order'].map((s) => (
              <button key={s} className={`filter-tab ${filterStatus === s ? 'active' : ''}`}
                onClick={() => setFilterStatus(s)}>
                {s} <span className="tab-count">{counts[s]}</span>
              </button>
            ))}
          </div>
          <div className="search-wrapper" style={{ display: 'flex', gap: '10px' }}>
            <select 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
              style={{ padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} className="search-icon" style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search vehicle, reg no..."
                value={search} onChange={(e) => setSearch(e.target.value)} 
                style={{ padding: '0.4rem 0.4rem 0.4rem 30px', border: '1px solid var(--border)', borderRadius: '6px' }}
              />
            </div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Vehicle</th>
                <th>Reg. Number</th>
                <th>Vehicle ID</th>
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
                    <td><span className="reg-badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>{v.vehicleId || '—'}</span></td>
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
                        <button className="btn-icon manage" title="Edit Vehicle" onClick={() => openEdit(v)}><Edit size={15} /></button>
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
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={13} /> Vehicle ID</span>
                      <button type="button"
                        style={{ fontSize: '0.72rem', color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => setForm(p => ({ ...p, vehicleId: 'VEH-' + Date.now().toString().slice(-6) }))}>
                        Auto Generate
                      </button>
                    </label>
                    <input type="text" placeholder="e.g. VEH-123456 (leave blank to auto-generate)" value={form.vehicleId} onChange={f('vehicleId')} />
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <input type="text" placeholder="e.g. Space Grey" value={form.color} onChange={f('color')} />
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
                    <label>Current Status</label>
                    <select value={form.status} onChange={f('status')}>
                      <option>Available</option>
                      <option>Booked</option>
                      <option>Maintenance</option>
                      <option>Out of Order</option>
                    </select>
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

              {/* Status info for Booked vehicles */}
              {manageVehicle.status === 'Booked' && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <AlertCircle size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.5 }}>
                    <strong>Auto-Booked:</strong> This vehicle is currently linked to an active booking. To mark it as Available again, click <strong>Available</strong> below — you will be asked to confirm if you want to cancel the active booking.
                  </div>
                </div>
              )}

              {/* Quick status buttons */}
              <div className="form-section-title" style={{ marginTop: '1rem' }}><RefreshCw size={13} /> Change Status</div>
              <div className="avail-status-btns" style={{ flexWrap: 'wrap' }}>
                {['Available', 'Maintenance', 'Out of Order'].map((s) => (
                  <button
                    key={s}
                    className={`avail-status-btn ${avail.status === s ? 'active-' + s.toLowerCase().replace(/\s+/g, '-') : ''}`}
                    onClick={() => setAvail((p) => ({ ...p, status: s }))}
                  >
                    {s === 'Available' && <CheckCircle size={15} />}
                    {s === 'Maintenance' && <Wrench size={15} />}
                    {s === 'Out of Order' && <AlertTriangle size={15} />}
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
              {(avail.status === 'Maintenance' || avail.status === 'Out of Order') && (
                <>
                  <div className="form-section-title" style={{ marginTop: '0.5rem' }}><AlertTriangle size={13} /> {avail.status} Reason</div>
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

      {/* ── FORCE OVERRIDE CONFIRMATION MODAL ── */}
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
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b', lineHeight: 1.6 }}>
                  ⚠️ <strong>Vehicle "{forceConfirm.vehicleName}"</strong> has an active booking:<br />
                  <strong>Booking ID:</strong> {forceConfirm.booking_id}&nbsp;•&nbsp;
                  <strong>Status:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{forceConfirm.booking_status}</span>
                </p>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                If you proceed, the active booking will be <strong>automatically cancelled</strong> and the vehicle will be marked as <strong>Available</strong>.
                <br /><br />
                ⚠️ This action <strong>cannot be undone</strong>. Ensure you have communicated with the customer before forcing.
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
              {viewVehicle.thumbnail_image ? (
                <img src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}/${viewVehicle.thumbnail_image}`} alt={viewVehicle.name}
                  style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
              ) : (
                <div style={{ width: '100%', height: '220px', borderRadius: '8px', background: 'var(--background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Car size={48} color="var(--primary)" />
                  <span style={{ color: 'var(--text-secondary)' }}>No image uploaded</span>
                </div>
              )}
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
                <div className="cat-add-box" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    placeholder="Category Name (e.g. Scooters)" 
                    value={catForm.name}
                    onChange={(e) => setCatForm({...catForm, name: e.target.value})}
                    style={{ flex: 1, minWidth: '150px' }}
                  />
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => { const file = e.target.files[0]; if(file) setCatForm({...catForm, file}) }}
                    style={{ flex: 1, minWidth: '150px', fontSize: '0.8rem' }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => {
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
                  }} disabled={loading || !catForm.name}>
                    {loading ? '...' : 'Add'}
                  </button>
                </div>
                
                <div className="cat-list">
                  {categories && categories.length > 0 ? categories.map(cat => (
                    <div key={cat._id} className="cat-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                      {editingCategory === cat._id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={editCatForm.name}
                            onChange={(e) => setEditCatForm({...editCatForm, name: e.target.value})}
                            style={{ flex: 1, minWidth: '150px' }}
                          />
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => { const file = e.target.files[0]; if(file) setEditCatForm({...editCatForm, file}) }}
                            style={{ flex: 1, minWidth: '150px', fontSize: '0.8rem' }}
                          />
                          <button className="btn btn-primary btn-sm" onClick={() => {
                            if (!editCatForm.name.trim()) return;
                            const fd = new FormData();
                            fd.append('name', editCatForm.name);
                            if (editCatForm.description) fd.append('description', editCatForm.description);
                            if (editCatForm.file) fd.append('image', editCatForm.file);
        
                            call(() => updateCategory(cat._id, fd), 
                              () => {
                                setEditingCategory(null);
                                fetchCategories();
                                alert('Category updated successfully!');
                              }, 
                              (err) => alert('Failed to update category: ' + err)
                            );
                          }} disabled={loading || !editCatForm.name}>
                            Save
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => setEditingCategory(null)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span>{cat.name}</span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-icon manage" onClick={() => {
                              setEditingCategory(cat._id);
                              setEditCatForm({ name: cat.name, description: cat.description || '', file: null });
                            }}>
                              <Edit size={14} />
                            </button>
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
                        </div>
                      )}
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
      {/* ── EDIT VEHICLE MODAL ── */}
      {editVehicle && createPortal(
        <div className="modal-overlay" onClick={() => setEditVehicle(null)}>
          <div className="modal-content modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="veh-modal-title">
                <div className="veh-icon lg"><Edit size={18} /></div>
                <div>
                  <h3>Edit Vehicle</h3>
                  <span className="td-muted">{editVehicle.regNo} • {editVehicle.name}</span>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setEditVehicle(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form className="user-form">
                <div className="form-section-title"><Car size={14} /> Basic Information</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vehicle Model Name *</label>
                    <input type="text" value={editForm.name} onChange={ef('name')} />
                  </div>
                  <div className="form-group">
                    <label>Brand / Manufacturer *</label>
                    <input type="text" value={editForm.brand} onChange={ef('brand')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Registration Number *</label>
                    <input type="text" value={editForm.regNo} onChange={ef('regNo')} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={13} /> Vehicle ID</span>
                      <button type="button"
                        style={{ fontSize: '0.72rem', color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => setEditForm(p => ({ ...p, vehicleId: 'VEH-' + Date.now().toString().slice(-6) }))}>
                        Auto Generate
                      </button>
                    </label>
                    <input type="text" value={editForm.vehicleId} onChange={ef('vehicleId')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vehicle Category</label>
                    <select value={editForm.category} onChange={ef('category')}>
                      <option value="">Select Category</option>
                      {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <input type="text" value={editForm.color} onChange={ef('color')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Manufacturing Year</label>
                    <input type="number" value={editForm.year} onChange={ef('year')} />
                  </div>
                  <div className="form-group">
                    <label>Current Status</label>
                    <select value={editForm.status} onChange={ef('status')}>
                      <option>Available</option>
                      <option>Booked</option>
                      <option>Maintenance</option>
                      <option>Out of Order</option>
                    </select>
                  </div>
                </div>

                <div className="form-section-title"><BatteryCharging size={14} /> Battery & Performance</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Battery Capacity (kWh)</label>
                    <input type="text" value={editForm.batteryCapacity} onChange={ef('batteryCapacity')} />
                  </div>
                  <div className="form-group">
                    <label>Range per Charge (km)</label>
                    <input type="number" value={editForm.range} onChange={ef('range')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Top Speed (km/h)</label>
                    <input type="number" value={editForm.topSpeed} onChange={ef('topSpeed')} />
                  </div>
                  <div className="form-group">
                    <label>Motor Power</label>
                    <input type="text" value={editForm.motorPower} onChange={ef('motorPower')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Charging Time</label>
                    <input type="text" value={editForm.chargingTime} onChange={ef('chargingTime')} />
                  </div>
                  <div className="form-group">
                    <label>Odometer Reading (km)</label>
                    <input type="number" value={editForm.odometer} onChange={ef('odometer')} />
                  </div>
                </div>

                <div className="form-section-title"><IndianRupee size={14} /> Rental Pricing</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Rate per Hour (₹)</label>
                    <input type="number" value={editForm.ratePerHour} onChange={ef('ratePerHour')} />
                  </div>
                  <div className="form-group">
                    <label>Rate per Day (₹)</label>
                    <input type="number" value={editForm.ratePerDay} onChange={ef('ratePerDay')} />
                  </div>
                </div>

                <div className="form-section-title"><MapPin size={14} /> Location & Assignment</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Franchise / Hub</label>
                    <select value={editForm.franchise} onChange={ef('franchise')}>
                      <option value="">Select Franchise</option>
                      {franchises.map(store => <option key={store._id} value={store._id}>{store.store_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Current Location</label>
                    <input type="text" value={editForm.location} onChange={ef('location')} />
                  </div>
                </div>

                <div className="form-section-title"><Shield size={14} /> Documents & Compliance</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Insurance Expiry Date</label>
                    <input type="date" value={editForm.insuranceExpiry} onChange={ef('insuranceExpiry')} />
                  </div>
                  <div className="form-group">
                    <label>PUC Expiry Date</label>
                    <input type="date" value={editForm.pucExpiry} onChange={ef('pucExpiry')} />
                  </div>
                </div>

                <div className="form-section-title"><Upload size={14} /> Update Image (Optional)</div>
                <div className="form-group">
                  <input type="file" accept="image/*"
                    onChange={e => { const file = e.target.files[0]; if (file) setEditForm(p => ({ ...p, file })); }}
                    style={{ padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '6px', width: '100%' }} />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Leave blank to keep existing image</small>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setEditVehicle(null)} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEdit} disabled={loading}>
                {loading ? <Loader size={16} className="spinner" /> : <><CheckCircle size={15} /> Save Changes</>}
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
