import React, { useState } from 'react';
import { CalendarDays, Clock, CheckCircle } from 'lucide-react';

const FranchiseRides = () => {
  const [filter, setFilter] = useState('active');

  const rides = [
    { id: 'R-1029', user: 'Amit Kumar', vehicle: 'Ather 450X', duration: '4 Hours', status: 'active', time: 'Started 1hr ago' },
    { id: 'R-1028', user: 'Neha Gupta', vehicle: 'Ola S1', duration: '2 Days', status: 'completed', time: 'Ended Today 10:00 AM', amount: '₹1200' },
  ];

  const filteredRides = rides.filter(r => r.status === filter);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          className="mobile-btn" 
          style={{ padding: '8px', flex: 1, background: filter === 'active' ? 'var(--primary)' : '#fff', color: filter === 'active' ? '#fff' : '#333' }}
          onClick={() => setFilter('active')}
        >Active</button>
        <button 
          className="mobile-btn" 
          style={{ padding: '8px', flex: 1, background: filter === 'completed' ? 'var(--primary)' : '#fff', color: filter === 'completed' ? '#fff' : '#333' }}
          onClick={() => setFilter('completed')}
        >Completed</button>
      </div>

      <div className="mobile-card">
        {filteredRides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No {filter} rides found.</div>
        ) : (
          filteredRides.map(r => (
            <div key={r.id} className="mobile-list-item" style={{ padding: '15px 0' }}>
              <div className="item-icon" style={{ background: r.status === 'active' ? '#e6f4ea' : '#f0f0f0', color: r.status === 'active' ? 'var(--primary)' : '#666' }}>
                {r.status === 'active' ? <Clock size={20} /> : <CheckCircle size={20} />}
              </div>
              <div className="item-details">
                <div className="item-title">{r.user}</div>
                <div className="item-subtitle">{r.vehicle} • {r.duration}</div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '4px' }}>{r.time}</div>
              </div>
              {r.amount && <div className="item-action">{r.amount}</div>}
              {r.status === 'active' && <button className="mobile-btn mobile-btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}>End</button>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FranchiseRides;
