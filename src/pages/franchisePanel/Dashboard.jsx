import React, { useState, useEffect } from 'react';
import { Bike, Users, IndianRupee, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FranchiseDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('userData');
    if (data) {
      setUserData(JSON.parse(data));
    }
  }, []);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#333' }}>Welcome, {userData?.owner_name || 'Partner'}!</h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>{userData?.store_name || 'Franchise Store'}</p>
      </div>

      <div className="mobile-stat-grid">
        <div className="stat-box">
          <Bike className="icon" size={28} />
          <div className="value">24</div>
          <div className="label">Total Fleet</div>
        </div>
        <div className="stat-box">
          <TrendingUp className="icon" size={28} />
          <div className="value">18</div>
          <div className="label">Active Rides</div>
        </div>
        <div className="stat-box">
          <IndianRupee className="icon" size={28} />
          <div className="value">₹12.5K</div>
          <div className="label">Today's Earnings</div>
        </div>
        <div className="stat-box">
          <Users className="icon" size={28} />
          <div className="value">142</div>
          <div className="label">Total Customers</div>
        </div>
      </div>

      <div className="mobile-card" style={{ marginTop: '20px' }}>
        <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Recent Rides</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/f/rides')}>View All</span>
        </div>
        
        <div className="mobile-list-item" style={{ padding: '10px 0' }}>
          <div className="item-icon"><Bike size={20} /></div>
          <div className="item-details">
            <div className="item-title">Rahul Sharma</div>
            <div className="item-subtitle">EV-Scooter • 2 hrs</div>
          </div>
          <div className="status-badge status-active">Active</div>
        </div>
        
        <div className="mobile-list-item" style={{ padding: '10px 0' }}>
          <div className="item-icon" style={{ background: '#f5f5f5', color: '#666' }}><Clock size={20} /></div>
          <div className="item-details">
            <div className="item-title">Priya Singh</div>
            <div className="item-subtitle">EV-Bike • Completed</div>
          </div>
          <div className="item-action">₹450</div>
        </div>
      </div>
    </div>
  );
};

export default FranchiseDashboard;
