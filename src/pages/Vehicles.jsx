import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Battery, MapPin, Plus, Search, Edit, Trash2, X, Upload,
  Eye, Car, CheckCircle, Clock, Wrench, IndianRupee,
  BatteryCharging, Shield, ToggleLeft, ToggleRight,
  AlertTriangle, RefreshCw, SlidersHorizontal, Loader
} from 'lucide-react';
import { getAllVehicles, createVehicle, deleteVehicle, updateVehicle, getAllStores } from '../services/apiServices';
import useApi from '../services/useApi';
import './Vehicles.css';

const initialVehicles = [
  {
    id: 1, name: 'Ather 450X', brand: 'Ather', regNo: 'KA 01 EK 1234',
    category: 'Electric Scooter', status: 'Available', battery: 85,
    location: 'Indiranagar, Bangalore', franchise: 'City EV Rentals',
    range: 146, topSpeed: 90, motorPower: '6 kW', chargingTime: '5.45 hrs',
    batteryCapacity: '3.7 kWh', year: 2023, color: 'Space Grey',
    ratePerHour: 40, ratePerDay: 600, insuranceExpiry: '2025-08-15',
    pucExpiry: '2025-03-10', odometer: 4520,
  },
  {
    id: 2, name: 'Ola S1 Pro', brand: 'Ola Electric', regNo: 'KA 03 HP 5678',
    category: 'Electric Scooter', status: 'Booked', battery: 42,
    location: 'Koramangala, Bangalore', franchise: 'ElectroWheel Hub',
    range: 181, topSpeed: 116, motorPower: '8.5 kW', chargingTime: '6.5 hrs',
    batteryCapacity: '3.97 kWh', year: 2023, color: 'Jet Black',
    ratePerHour: 45, ratePerDay: 700, insuranceExpiry: '2025-11-20',
    pucExpiry: '2025-06-05', odometer: 7830,
  },
  {
    id: 3, name: 'TVS iQube', brand: 'TVS', regNo: 'KA 05 EM 9012',
    category: 'Electric Scooter', status: 'Maintenance', battery: 12,
    location: 'Service Center', franchise: 'VoltStation',
    range: 100, topSpeed: 78, motorPower: '4.4 kW', chargingTime: '5 hrs',
    batteryCapacity: '3.04 kWh', year: 2022, color: 'Pearl White',
    ratePerHour: 35, ratePerDay: 550, insuranceExpiry: '2024-12-31',
    pucExpiry: '2024-11-15', odometer: 12400,
  },
  {
    id: 4, name: 'Ather 450X', brand: 'Ather', regNo: 'KA 01 EK 4321',
    category: 'Electric Scooter', status: 'Available', battery: 98,
    location: 'HSR Layout, Bangalore', franchise: 'City EV Rentals',
    range: 146, topSpeed: 90, motorPower: '6 kW', chargingTime: '5.45 hrs',
    batteryCapacity: '3.7 kWh', year: 2024, color: 'Green',
    ratePerHour: 40, ratePerDay: 600, insuranceExpiry: '2026-01-10',
    pucExpiry: '2025-09-20', odometer: 1200,
  },
  {
    id: 5, name: 'Ola S1 Air', brand: 'Ola Electric', regNo: 'KA 03 HP 8765',
    category: 'Electric Scooter', status: 'Available', battery: 76,
    location: 'Whitefield, Bangalore', franchise: 'ElectroWheel Hub',
    range: 101, topSpeed: 90, motorPower: '6 kW', chargingTime: '4.5 hrs',
    batteryCapacity: '2.5 kWh', year: 2023, color: 'Coral',
    ratePerHour: 35, ratePerDay: 550, insuranceExpiry: '2025-07-30',
    pucExpiry: '2025-04-18', odometer: 5670,
  },
  {
    id: 6, name: 'Bajaj Chetak', brand: 'Bajaj', regNo: 'KA 05 EM 2109',
    category: 'Electric Scooter', status: 'Booked', battery: 55,
    location: 'Jayanagar, Bangalore', franchise: 'VoltStation',
    range: 126, topSpeed: 73, motorPower: '4 kW', chargingTime: '5 hrs',
    batteryCapacity: '3 kWh', year: 2022, color: 'Indigo Metallic',
    ratePerHour: 38, ratePerDay: 580, insuranceExpiry: '2025-05-22',
    pucExpiry: '2025-02-28', odometer: 9100,
  },
  {
    id: 7, name: 'Hero Vida V1', brand: 'Hero', regNo: 'KA 02 EV 3344',
    category: 'Electric Scooter', status: 'Available', battery: 90,
    location: 'Indiranagar, Bangalore', franchise: 'City EV Rentals',
    range: 165, topSpeed: 80, motorPower: '6 kW', chargingTime: '5 hrs',
    batteryCapacity: '3.94 kWh', year: 2024, color: 'Matte Red',
    ratePerHour: 42, ratePerDay: 650, insuranceExpiry: '2026-03-15',
    pucExpiry: '2025-10-10', odometer: 890,
  },
  {
    id: 8, name: 'Revolt RV400', brand: 'Revolt', regNo: 'KA 04 EV 7788',
    category: 'Electric Bike', status: 'Available', battery: 63,
    location: 'Whitefield, Bangalore', franchise: 'ElectroWheel Hub',
    range: 150, topSpeed: 85, motorPower: '3 kW', chargingTime: '4.5 hrs',
    batteryCapacity: '3.24 kWh', year: 2023, color: 'Rebel Red',
    ratePerHour: 50, ratePerDay: 800, insuranceExpiry: '2025-09-01',
    pucExpiry: '2025-05-30', odometer: 6340,
  },
];

const statusConfig = {
  Available:   { cls: 'badge-success', icon: <CheckCircle size={12} /> },
  Booked:      { cls: 'badge-info',    icon: <Clock size={12} /> },
  Maintenance: { cls: 'badge-warning', icon: <Wrench size={12} /> },
};

const emptyForm = {
  name: '', brand: '', regNo: '', category: 'Electric Scooter', color: '', year: '',
  status: 'Available', battery: '', range: '', topSpeed: '', motorPower: '',
  chargingTime: '', batteryCapacity: '', odometer: '',
  ratePerHour: '', ratePerDay: '',
  franchise: '', location: '',
  insuranceExpiry: '', pucExpiry: '',
};

const CATEGORY_MAP = {
  'Electric Scooter': 'scooter',
  'Electric Bike':    'bike',
  'Electric Cycle':   'bike', // Backend only has car, bike, scooter
  'Electric Auto':    'car'   // Mapping auto to car for now or check backend
};

const Vehicles = () => {
  const [vehicles, setVehicles]         = useState([]);
  const [showModal, setShowModal]       = useState(false);
  const [viewVehicle, setViewVehicle]   = useState(null);
  const [manageVehicle, setManageVehicle] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch]             = useState('');
  const [form, setForm]                 = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [deleteId, setDeleteId]         = useState(null);
  const [avail, setAvail]               = useState({ status: '', battery: '', location: '', reason: '' });
  const [franchises, setFranchises]     = useState([]);
  const fileInputRef = useRef(null);
  const { loading, error, call }        = useApi();

  useEffect(() => {
    // Fetch Vehicles
    call(
      () => getAllVehicles(),
      (data) => {
        const vehiclesData = data.data || data.vehicles || data;
        const list = Array.isArray(vehiclesData) ? vehiclesData.map(v => ({
          id: v._id,
          name: v.vehicle_name,
          brand: v.brand,
          regNo: v.registration_number,
          category: v.vehicle_type,
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
    fd.append('vehicle_type', CATEGORY_MAP[form.category] || 'scooter');
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
    if (form.franchise) fd.append('franchise', form.franchise);
    fd.append('insurance_valid_till', form.insuranceExpiry);
    fd.append('puc_valid_till', form.pucExpiry);
    if (form.file) fd.append('thumbnail_image', form.file);
    call(
      () => createVehicle(fd),
      (data) => {
        const v = data.vehicle || data;
        setVehicles(prev => [...prev, { ...form, id: v._id || Date.now(), battery: Number(form.battery) || 100 }]);
        setForm(emptyForm);
        setImagePreview(null);
        setShowModal(false);
      },
      (err) => {
        alert(err.message || "Failed to add vehicle. Please check all fields.");
      }
    );
  };

  const handleDelete = (id) => {
    call(
      () => deleteVehicle(id),
      () => {
        setVehicles(prev => prev.filter(v => v.id !== id));
        setDeleteId(null);
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
        setVehicles(prev => prev.map(v => v.id === manageVehicle.id
          ? { ...v, status: avail.status, battery: Number(avail.battery), location: avail.location } : v));
        setManageVehicle(null);
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
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setImagePreview(null); setShowModal(true); }}>
          <Plus size={18} /> Add New Vehicle
        </button>
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
                    <label>Vehicle Category</label>
                    <select value={form.category} onChange={f('category')}>
                      <option>Electric Scooter</option>
                      <option>Electric Bike</option>
                      <option>Electric Cycle</option>
                      <option>Electric Auto</option>
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
