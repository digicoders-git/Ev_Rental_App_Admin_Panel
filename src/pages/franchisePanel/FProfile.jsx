import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Shield, CreditCard, LogOut, Save, Eye, EyeOff, X, Loader, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { updateFranchiseProfile, changeFranchisePassword } from '../../services/apiServices';
import useApi from '../../services/useApi';

const FProfile = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [form, setForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState({});
  const [showLogout, setShowLogout] = useState(false);
  const [success, setSuccess] = useState('');
  const { loading, call } = useApi();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('userData') || '{}');
    setUserData(data);
    setForm({
      store_name: data.store_name || '',
      owner_name: data.owner_name || '',
      mobile: data.mobile || '',
      email: data.email || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
    });
  }, []);

  const handleProfileSave = () => {
    call(() => updateFranchiseProfile(form), (res) => {
      const updatedData = res.data;
      localStorage.setItem('userData', JSON.stringify(updatedData));
      setUserData(updatedData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    });
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    call(() => changeFranchisePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    }), () => {
      setSuccess('Password changed successfully!');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    navigate('/login');
  };

  const initials = userData?.owner_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'FR';

  const TABS = [
    { key: 'profile', label: 'Profile Details', icon: <User size={16} /> },
    { key: 'password', label: 'Security', icon: <Shield size={16} /> },
    { key: 'store', label: 'Store Info', icon: <CreditCard size={16} /> },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Account Settings</h1>
          <p>Manage your franchise account details and preferences.</p>
        </div>
        <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => setShowLogout(true)}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      {success && (
        <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* Profile Hero */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 700 }}>
            {initials}
          </div>
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{userData?.owner_name || 'Franchise Owner'}</h2>
          <p style={{ margin: '4px 0 0' }}>{userData?.store_name} • {userData?.city}, {userData?.state}</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{userData?.email}</p>
          <span className="badge badge-success" style={{ marginTop: '6px', display: 'inline-block' }}>
            {userData?.status || 'Active'} Partner
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Profile Details Tab */}
      {tab === 'profile' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { key: 'owner_name', label: "Owner's Name" },
              { key: 'email', label: 'Email Address', type: 'email' },
              { key: 'mobile', label: 'Mobile Number' },
              { key: 'city', label: 'City' },
              { key: 'state', label: 'State' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{f.label}</label>
                <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }} />
              </div>
            ))}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Address</label>
              <textarea value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} rows={2}
                style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" disabled={loading} onClick={handleProfileSave}>
              {loading ? <Loader size={16} className="spinner" /> : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {tab === 'password' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Change Password</h3>
          <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'oldPassword', label: 'Current Password' },
              { key: 'newPassword', label: 'New Password' },
              { key: 'confirmPassword', label: 'Confirm New Password' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{f.label}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass[f.key] ? 'text' : 'password'}
                    value={passwordForm[f.key]}
                    onChange={e => setPasswordForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.625rem 2.5rem 0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }} />
                  <button type="button" onClick={() => setShowPass(p => ({ ...p, [f.key]: !p[f.key] }))}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    {showPass[f.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
            <button className="btn btn-primary" disabled={loading} onClick={handlePasswordChange}>
              {loading ? <Loader size={16} className="spinner" /> : <><Shield size={16} /> Update Password</>}
            </button>
          </div>
        </div>
      )}

      {/* Store Info Tab */}
      {tab === 'store' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Store Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Store Name', value: userData?.store_name },
              { label: 'Store ID', value: userData?.store_id },
              { label: 'Agreement Date', value: userData?.agreement_date ? new Date(userData.agreement_date).toLocaleDateString('en-IN') : 'N/A' },
              { label: 'Expiry Date', value: userData?.expiry_date ? new Date(userData.expiry_date).toLocaleDateString('en-IN') : 'N/A' },
              { label: 'Status', value: userData?.status },
              { label: 'Registered On', value: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-IN') : 'N/A' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{value || 'N/A'}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Store Name</label>
              <input type="text" value={form.store_name || ''} onChange={e => setForm(p => ({ ...p, store_name: e.target.value }))}
                style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }} />
            </div>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading} onClick={handleProfileSave}>
              {loading ? <Loader size={16} className="spinner" /> : <><Save size={16} /> Save Store Info</>}
            </button>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogout && createPortal(
        <div className="modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Logout</h3>
              <button className="btn-icon" onClick={() => setShowLogout(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-body">
                <div className="delete-icon-wrap" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                  <LogOut size={28} />
                </div>
                <p>Are you sure you want to logout from your franchise account?</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowLogout(false)}>Stay</button>
              <button className="btn btn-danger" onClick={handleLogout}><LogOut size={16} /> Yes, Logout</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FProfile;
