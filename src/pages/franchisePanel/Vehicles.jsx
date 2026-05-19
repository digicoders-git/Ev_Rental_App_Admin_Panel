import React from 'react';
import { Bike, Battery, MapPin, Plus } from 'lucide-react';

const FranchiseVehicles = () => {
  const vehicles = [
    { id: 'V001', name: 'Ather 450X', battery: '85%', status: 'Available', location: 'Store Hub 1' },
    { id: 'V002', name: 'Ola S1 Pro', battery: '42%', status: 'On Ride', location: 'City Center' },
    { id: 'V003', name: 'TVS iQube', battery: '100%', status: 'Maintenance', location: 'Workshop' },
  ];

  return (
    <div className="fade-in">
      <button className="mobile-btn mobile-btn-primary" style={{ marginBottom: '20px' }}>
        <Plus size={20} /> Add New Vehicle
      </button>

      <div className="mobile-card">
        <div className="card-title">My Fleet (24)</div>
        
        {vehicles.map((v) => (
          <div key={v.id} className="mobile-list-item" style={{ padding: '15px 0' }}>
            <div className="item-icon"><Bike size={24} /></div>
            <div className="item-details">
              <div className="item-title">{v.name} ({v.id})</div>
              <div className="item-subtitle" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Battery size={14} color={v.battery > '50%' ? '#00C853' : '#f29900'} /> {v.battery}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} /> {v.location}
                </span>
              </div>
            </div>
            <div className={`status-badge ${v.status === 'Available' ? 'status-active' : v.status === 'On Ride' ? 'status-pending' : 'status-inactive'}`}>
              {v.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FranchiseVehicles;
