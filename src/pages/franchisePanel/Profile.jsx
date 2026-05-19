import React, { useState, useEffect } from 'react';
import { User, Shield, CreditCard, HelpCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FranchiseProfile = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('userData');
    if (data) {
      setUserData(JSON.parse(data));
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="fade-in">
      <div className="mobile-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
          {userData?.owner_name?.charAt(0) || 'F'}
        </div>
        <div>
          <h3 style={{ margin: 0, color: '#333' }}>{userData?.owner_name || 'Franchise Admin'}</h3>
          <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.9rem' }}>{userData?.store_name || 'Store Hub'}</p>
          <p style={{ margin: '2px 0 0', color: '#999', fontSize: '0.8rem' }}>{userData?.email || 'admin@store.com'}</p>
        </div>
      </div>

      <div className="mobile-card" style={{ padding: '10px 20px' }}>
        <div className="mobile-list-item" style={{ padding: '15px 0' }}>
          <User size={20} color="#666" style={{ marginRight: '15px' }} />
          <div style={{ flex: 1, fontWeight: '500', color: '#333' }}>Personal Details</div>
        </div>
        <div className="mobile-list-item" style={{ padding: '15px 0' }}>
          <Shield size={20} color="#666" style={{ marginRight: '15px' }} />
          <div style={{ flex: 1, fontWeight: '500', color: '#333' }}>Security & Password</div>
        </div>
        <div className="mobile-list-item" style={{ padding: '15px 0' }}>
          <CreditCard size={20} color="#666" style={{ marginRight: '15px' }} />
          <div style={{ flex: 1, fontWeight: '500', color: '#333' }}>Bank Details</div>
        </div>
        <div className="mobile-list-item" style={{ padding: '15px 0', borderBottom: 'none' }}>
          <HelpCircle size={20} color="#666" style={{ marginRight: '15px' }} />
          <div style={{ flex: 1, fontWeight: '500', color: '#333' }}>Help & Support</div>
        </div>
      </div>

      <button 
        className="mobile-btn" 
        style={{ background: '#fff', color: '#d93025', border: '1px solid #fce8e6', marginTop: '20px' }}
        onClick={handleLogout}
      >
        <LogOut size={20} /> Logout
      </button>
    </div>
  );
};

export default FranchiseProfile;
