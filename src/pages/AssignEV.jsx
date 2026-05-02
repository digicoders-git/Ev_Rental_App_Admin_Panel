import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building2, Car, Plus, X, Search, MapPin, Battery, CheckCircle, Trash2, Zap, Loader2, AlertTriangle } from 'lucide-react';
import { getAllStores, getAllVehicles, assignVehicle } from '../services/apiServices';
import useApi from '../services/useApi';
import './AssignEV.css';



const AssignEV = () => {
  const [franchises, setFranchises] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchFranchise, setSearchFranchise] = useState('');
  const [searchVehicle, setSearchVehicle] = useState('');
  const [confirmUnassignId, setConfirmUnassignId] = useState(null);
  const { loading, call } = useApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    call(() => getAllStores(), (res) => setFranchises(res.data?.data || res.data || []));
    call(() => getAllVehicles(), (res) => {
      const vData = res.data?.data || res.data || [];
      setVehicles(vData.map(v => ({
        id: v._id,
        name: v.vehicle_name,
        regNo: v.registration_number,
        type: v.vehicle_type,
        battery: v.current_battery || 100,
        franchiseId: v.franchise?._id || v.franchise || null
      })));
    });
  };

  const totalAssigned = vehicles.filter(v => v.franchiseId).length;

  const getAssignedVehicles = (fid) =>
    vehicles.filter(v => v.franchiseId === fid);

  const getAvailableVehicles = () => {
    return vehicles.filter(
      (v) =>
        !v.franchiseId &&
        (v.name.toLowerCase().includes(searchVehicle.toLowerCase()) ||
          v.regNo.toLowerCase().includes(searchVehicle.toLowerCase()))
    );
  };

  const handleAssign = (vehicleId) => {
    if (!selectedFranchise) return;
    call(
      () => assignVehicle(vehicleId, selectedFranchise._id),
      () => {
        setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, franchiseId: selectedFranchise._id } : v));
        setShowModal(false);
      }
    );
  };

  const handleUnassign = (vid) => {
    setConfirmUnassignId(vid);
  };

  const confirmUnassign = () => {
    if (!confirmUnassignId) return;
    call(
      () => assignVehicle(confirmUnassignId, null),
      () => {
        setVehicles(prev => prev.map(v => v.id === confirmUnassignId ? { ...v, franchiseId: null } : v));
        setConfirmUnassignId(null);
      }
    );
  };

  const openAssignModal = (franchise) => {
    setSelectedFranchise(franchise);
    setSearchVehicle('');
    setShowModal(true);
  };

  const filteredFranchises = franchises.filter(
    (f) =>
      f.store_name?.toLowerCase().includes(searchFranchise.toLowerCase()) ||
      f.city?.toLowerCase().includes(searchFranchise.toLowerCase()) ||
      f.owner_name?.toLowerCase().includes(searchFranchise.toLowerCase())
  );

  return (
    <div className="assign-ev-page">
      <div className="page-header">
        <div>
          <h1>Assign EVs to Franchise</h1>
          <p>Manage vehicle allocation across your franchise network.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="assign-stats">
        <div className="card stat-card">
          <div className="stat-icon"><Building2 size={20} /></div>
          <div>
            <span className="stat-label">Total Franchises</span>
            <h3>{franchises.length}</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon vehicles"><Car size={20} /></div>
          <div>
            <span className="stat-label">Total Fleet</span>
            <h3>{vehicles.length}</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon assigned"><CheckCircle size={20} /></div>
          <div>
            <span className="stat-label">Assigned EVs</span>
            <h3>{totalAssigned}</h3>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon unassigned"><Zap size={20} /></div>
          <div>
            <span className="stat-label">Unassigned EVs</span>
            <h3>{vehicles.length - totalAssigned}</h3>
          </div>
        </div>
      </div>

      {/* Main Franchise Table */}
      <div className="card">
        <div className="table-toolbar">
          <h3>Franchise & EV Assignments</h3>
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search franchise, owner, location..."
              value={searchFranchise}
              onChange={(e) => setSearchFranchise(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Franchise Name</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Status</th>
                <th>Assigned EVs</th>
                <th>Fleet Count</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFranchises.map((f, i) => (
                <tr key={f._id} className="franchise-row">
                  <td>{i + 1}</td>
                  <td>
                    <div className="cell-with-icon">
                      <div className="table-icon"><Building2 size={15} /></div>
                      <span className="fw-600">{f.store_name}</span>
                    </div>
                  </td>
                  <td>{f.owner_name}</td>
                  <td>
                    <span className="location-cell">
                      <MapPin size={13} /> {f.city}, {f.state}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-success">Active</span>
                  </td>
                  <td>
                    <div className="assigned-ev-chips">
                      {getAssignedVehicles(f._id).length === 0 ? (
                        <span className="no-ev-text">No EVs assigned</span>
                      ) : (
                        getAssignedVehicles(f._id).map((v) => (
                          <span key={v.id} className="ev-chip">
                            <Car size={11} />
                            {v.name}
                            <button
                              className="chip-remove"
                              title="Unassign"
                              onClick={() => handleUnassign(v.id)}
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="fleet-count">{getAssignedVehicles(f._id).length} Units</span>
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => openAssignModal(f)}>
                      <Plus size={14} /> Assign EV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assigned EVs Detail Table */}
      <div className="card">
        <div className="table-toolbar">
          <h3>All Assigned EVs</h3>
          <span className="toolbar-badge">{totalAssigned} Total</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Vehicle</th>
                <th>Reg. Number</th>
                <th>Type</th>
                <th>Battery</th>
                <th>Assigned To</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {franchises.flatMap((f) =>
                getAssignedVehicles(f._id).map((v, i) => (
                  <tr key={`${f._id}-${v.id}`}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="cell-with-icon">
                        <div className="table-icon ev"><Car size={15} /></div>
                        <span className="fw-600">{v.name}</span>
                      </div>
                    </td>
                    <td><span className="reg-badge">{v.regNo}</span></td>
                    <td>{v.type}</td>
                    <td>
                      <div className="battery-cell">
                        <div className="battery-bar-wrap">
                          <div
                            className="battery-bar-fill"
                            style={{
                              width: `${v.battery}%`,
                              background: v.battery < 20 ? '#ef4444' : v.battery < 50 ? '#f59e0b' : '#10b981',
                            }}
                          />
                        </div>
                        <span style={{ color: v.battery < 20 ? '#ef4444' : v.battery < 50 ? '#f59e0b' : '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>
                          {v.battery}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-with-icon">
                        <div className="table-icon"><Building2 size={13} /></div>
                        <span>{f.store_name}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn-icon delete"
                        title="Unassign EV"
                        onClick={() => handleUnassign(v.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {totalAssigned === 0 && (
                <tr>
                  <td colSpan={7} className="empty-row">No EVs assigned yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Assign EV</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  To: <strong>{selectedFranchise?.store_name}</strong>
                </p>
              </div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="search-wrapper modal-search">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by vehicle name or reg no..."
                  value={searchVehicle}
                  onChange={(e) => setSearchVehicle(e.target.value)}
                />
              </div>
              <div className="table-container modal-table">
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Reg. Number</th>
                      <th>Type</th>
                      <th>Battery</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getAvailableVehicles().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty-row">
                          <Car size={20} style={{ marginBottom: '0.25rem' }} />
                          <br />No unassigned vehicles available.
                        </td>
                      </tr>
                    ) : (
                      getAvailableVehicles().map((v) => (
                        <tr key={v.id}>
                          <td>
                            <div className="cell-with-icon">
                              <div className="table-icon ev"><Car size={14} /></div>
                              <span className="fw-600">{v.name}</span>
                            </div>
                          </td>
                          <td><span className="reg-badge">{v.regNo}</span></td>
                          <td>{v.type}</td>
                          <td>
                            <div className="battery-cell">
                              <div className="battery-bar-wrap">
                                <div
                                  className="battery-bar-fill"
                                  style={{
                                    width: `${v.battery}%`,
                                    background: v.battery < 20 ? '#ef4444' : v.battery < 50 ? '#f59e0b' : '#10b981',
                                  }}
                                />
                              </div>
                              <span style={{ color: v.battery < 20 ? '#ef4444' : v.battery < 50 ? '#f59e0b' : '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>
                                {v.battery}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <button className="btn btn-primary btn-sm" onClick={() => handleAssign(v.id)}>
                              <Plus size={13} /> Assign
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── UNASSIGN CONFIRMATION MODAL ── */}
      {confirmUnassignId && createPortal(
        <div className="modal-overlay" onClick={() => setConfirmUnassignId(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Unassign Vehicle</h3>
              <button className="btn-icon" onClick={() => setConfirmUnassignId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-body">
                <div className="delete-icon-wrap" style={{ background: '#fee2e2', color: '#ef4444' }}>
                  <Zap size={28} />
                </div>
                <p>Are you sure you want to <strong>Unassign</strong> this vehicle?</p>
                <p className="delete-sub">
                  Vehicle: <strong>{vehicles.find(v => v.id === confirmUnassignId)?.name}</strong><br />
                  Reg. No: {vehicles.find(v => v.id === confirmUnassignId)?.regNo}
                </p>
                <p className="delete-sub" style={{ marginTop: '0.5rem' }}>This vehicle will be moved back to the unassigned fleet.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setConfirmUnassignId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmUnassign} disabled={loading}>
                {loading ? <Loader2 size={16} className="spinner" /> : 'Yes, Unassign'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AssignEV;
