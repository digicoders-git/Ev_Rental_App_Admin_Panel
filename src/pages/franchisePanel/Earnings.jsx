import React from 'react';
import { IndianRupee, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const FranchiseEarnings = () => {
  return (
    <div className="fade-in">
      <div className="stat-box" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '25px', marginBottom: '20px' }}>
        <div style={{ fontSize: '1rem', opacity: 0.9 }}>Total Available Balance</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0', display: 'flex', alignItems: 'center' }}>
          <IndianRupee size={32} /> 45,250
        </div>
        <button className="mobile-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '10px' }}>Withdraw Funds</button>
      </div>

      <div className="mobile-card">
        <div className="card-title">Recent Transactions</div>
        
        <div className="mobile-list-item" style={{ padding: '12px 0' }}>
          <div className="item-icon" style={{ background: '#e6f4ea', color: '#1e8e3e' }}><ArrowDownRight size={20} /></div>
          <div className="item-details">
            <div className="item-title">Ride R-1028</div>
            <div className="item-subtitle">Today, 10:00 AM</div>
          </div>
          <div className="item-action" style={{ color: '#1e8e3e' }}>+₹1,200</div>
        </div>

        <div className="mobile-list-item" style={{ padding: '12px 0' }}>
          <div className="item-icon" style={{ background: '#fce8e6', color: '#d93025' }}><ArrowUpRight size={20} /></div>
          <div className="item-details">
            <div className="item-title">Withdrawal</div>
            <div className="item-subtitle">Yesterday, 04:30 PM</div>
          </div>
          <div className="item-action" style={{ color: '#d93025' }}>-₹10,000</div>
        </div>
        
        <div className="mobile-list-item" style={{ padding: '12px 0' }}>
          <div className="item-icon" style={{ background: '#e6f4ea', color: '#1e8e3e' }}><ArrowDownRight size={20} /></div>
          <div className="item-details">
            <div className="item-title">Ride R-1021</div>
            <div className="item-subtitle">Yesterday, 02:15 PM</div>
          </div>
          <div className="item-action" style={{ color: '#1e8e3e' }}>+₹450</div>
        </div>
      </div>
    </div>
  );
};

export default FranchiseEarnings;
