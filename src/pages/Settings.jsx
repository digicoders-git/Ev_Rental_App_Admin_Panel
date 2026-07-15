import { useState, useEffect } from 'react';
import { 
  Save, Shield, IndianRupee, Percent,
  User, Lock, Mail, Phone, Loader2, CheckCircle, AlertCircle, Download, FileText
} from 'lucide-react';
import { 
  getProfile, updateProfile, changePassword, 
  getPlatformSettings, updatePlatformSettings, deleteOldRecords, exportDatabaseBackup
} from '../services/apiServices';
import './Settings.css';

const Settings = () => {
  const [profile, setProfile] = useState({ name: '', email: '', mobile: '' });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [platform, setPlatform] = useState({
    base_fare: 12,
    booking_fee: 25,
    cancellation_fee: 50,
    commission_pct: 15,
    payout_cycle: 'Weekly',
    mandatory_kyc: true,
    auto_approve_franchise: false,
    terms_and_conditions: '',
    global_payment_mode: 'central'
  });

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ type: '', text: '' });
  const [cleanupMonths, setCleanupMonths] = useState(6);
  const [cleaning, setCleaning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, platRes] = await Promise.all([
        getProfile(),
        getPlatformSettings()
      ]);
      if (profRes.data.success) setProfile(profRes.data.data);
      if (platRes.data.success) {
        setPlatform(prev => ({ ...prev, ...platRes.data.data }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3500);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile(profile);
      showMsg('success', 'Profile updated successfully');
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showMsg('error', 'New passwords do not match');
      return;
    }
    try {
      setSaving(true);
      await changePassword({ 
        oldPassword: passwords.oldPassword, 
        newPassword: passwords.newPassword 
      });
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      showMsg('success', 'Password changed successfully');
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handlePlatformSave = async () => {
    try {
      setSaving(true);
      await updatePlatformSettings(platform);
      showMsg('success', 'Platform settings updated');
    } catch (error) {
      showMsg('error', 'Failed to update platform settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete completed/cancelled bookings and tracking logs older than ${cleanupMonths} months?`)) return;
    try {
      setCleaning(true);
      const res = await deleteOldRecords(cleanupMonths);
      showMsg('success', res.data?.message || 'Old records deleted successfully');
    } catch (error) {
      showMsg('error', error.response?.data?.message || 'Failed to delete old records');
    } finally {
      setCleaning(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      setDownloading(true);
      const res = await exportDatabaseBackup();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'EV_Rental_Backup.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showMsg('success', 'Backup downloaded successfully');
    } catch (error) {
      showMsg('error', 'Failed to download backup');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="cp-page-loading">
        <Loader2 className="spinner" size={40} />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">

      {/* ── FIXED TOAST NOTIFICATION ── */}
      {msg.text && (
        <div
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            background: msg.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.9rem',
            minWidth: '260px',
            animation: 'slideInToast 0.3s ease',
          }}
        >
          {msg.type === 'success'
            ? <CheckCircle size={18} />
            : <AlertCircle size={18} />}
          {msg.text}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Settings &amp; Configurations</h1>
          <p>Manage your admin profile, security, and global platform preferences.</p>
        </div>
      </div>

      <div className="settings-grid-layout">
        {/* LEFT COLUMN */}
        <div className="settings-column">

          {/* Admin Profile */}
          <div className="card">
            <div className="settings-card-header">
              <User size={18} className="primary-text" />
              <h3>Admin Profile</h3>
            </div>
            <form onSubmit={handleProfileSave} className="settings-form">
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-wrap">
                  <User size={15} className="input-icon" />
                  <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrap">
                  <Mail size={15} className="input-icon" />
                  <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <div className="input-wrap">
                  <Phone size={15} className="input-icon" />
                  <input type="text" value={profile.mobile} onChange={e => setProfile({...profile, mobile: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <Loader2 className="spinner" size={15} /> : <><Save size={16} /> Update Profile</>}
              </button>
            </form>
          </div>

          {/* Security */}
          <div className="card">
            <div className="settings-card-header">
              <Lock size={18} className="danger-text" />
              <h3>Security &amp; Password</h3>
            </div>
            <form onSubmit={handlePasswordChange} className="settings-form">
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" value={passwords.oldPassword}
                  onChange={e => setPasswords({...passwords, oldPassword: e.target.value})} />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={passwords.newPassword}
                  onChange={e => setPasswords({...passwords, newPassword: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" value={passwords.confirmPassword}
                  onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} disabled={saving}>
                {saving ? <Loader2 className="spinner" size={15} /> : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Policies & Switches */}
          <div className="card">
            <div className="settings-card-header">
              <Shield size={18} style={{ color: '#8b5cf6' }} />
              <h3>Policies &amp; Switches</h3>
            </div>
            <div className="settings-toggle-list">
              <div className="toggle-item">
                <div>
                  <h4>Mandatory KYC</h4>
                  <p>Users must be verified before booking.</p>
                </div>
                <button className={`toggle-btn ${platform.mandatory_kyc ? 'active' : ''}`}
                  onClick={() => setPlatform({...platform, mandatory_kyc: !platform.mandatory_kyc})}>
                  <div className="toggle-thumb" />
                </button>
              </div>
              <div className="toggle-item">
                <div>
                  <h4>Auto-Approve Franchise</h4>
                  <p>Automatic approval for meeting criteria.</p>
                </div>
                <button className={`toggle-btn ${platform.auto_approve_franchise ? 'active' : ''}`}
                  onClick={() => setPlatform({...platform, auto_approve_franchise: !platform.auto_approve_franchise})}>
                  <div className="toggle-thumb" />
                </button>
              </div>
            </div>
            <div className="card-footer-action">
              <button className="btn btn-primary btn-full" onClick={handlePlatformSave} disabled={saving}>
                {saving ? <Loader2 className="spinner" size={16} /> : <><Save size={16} /> Save Platform Settings</>}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="settings-column">

          {/* Global Pricing */}
          <div className="card">
            <div className="settings-card-header">
              <IndianRupee size={18} className="success-text" />
              <h3>Global Pricing</h3>
            </div>
            <div className="settings-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Base Fare (per km)</label>
                  <input type="number" value={platform.base_fare}
                    onChange={e => setPlatform({...platform, base_fare: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Booking Fee</label>
                  <input type="number" value={platform.booking_fee}
                    onChange={e => setPlatform({...platform, booking_fee: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Cancellation Fee</label>
                <input type="number" value={platform.cancellation_fee}
                  onChange={e => setPlatform({...platform, cancellation_fee: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Commission & Settlement */}
          <div className="card">
            <div className="settings-card-header">
              <Percent size={18} className="secondary-text" />
              <h3>Commission &amp; Settlement</h3>
            </div>
            <div className="settings-form">
              <div className="form-group">
                <label>Global Settlement Mode</label>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Choose how customer payments are processed globally.
                </div>
                <select 
                  value={platform.global_payment_mode} 
                  onChange={e => setPlatform({...platform, global_payment_mode: e.target.value})}
                  style={{ border: '1px solid var(--primary)' }}
                >
                  <option value="central">Central Collection (Sab payment Super Admin ko)</option>
                  <option value="direct">Direct Settlement (Payment seedha Franchise ko)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Platform Commission (%)</label>
                <input type="number" value={platform.commission_pct}
                  onChange={e => setPlatform({...platform, commission_pct: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Payout Cycle</label>
                <select value={platform.payout_cycle} onChange={e => setPlatform({...platform, payout_cycle: e.target.value})}>
                  <option>Weekly</option>
                  <option>Fortnightly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <button className="btn btn-primary btn-full" onClick={handlePlatformSave} disabled={saving}>
                {saving ? <Loader2 className="spinner" size={16} /> : <><Save size={16} /> Save Pricing & Settlement</>}
              </button>
            </div>
          </div>

          {/* System Backups */}
          <div className="card">
            <div className="settings-card-header">
              <Download size={18} style={{ color: '#10b981' }} />
              <h3>System Backups</h3>
            </div>
            <div className="settings-form">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Download a complete backup of your database (Users, Vehicles, Bookings, Franchises) in Excel format.
              </p>
              <button
                className="btn btn-primary btn-full"
                style={{ background: '#10b981', borderColor: '#10b981' }}
                onClick={handleExportBackup}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="spinner" size={16} /> : <><Download size={16} /> Download Full Backup (Excel)</>}
              </button>
            </div>
          </div>

          {/* Data Cleanup */}
          <div className="card" style={{ border: '1px solid #ef4444' }}>
            <div className="settings-card-header">
              <AlertCircle size={18} className="danger-text" />
              <h3 className="danger-text">Data Management &amp; Cleanup</h3>
            </div>
            <div className="settings-form">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Permanently delete old historical data (Tracking logs, Approved KYC records, and Completed/Cancelled bookings) to free up database storage.
              </p>
              <div className="form-group">
                <label>Delete records older than:</label>
                <select value={cleanupMonths} onChange={e => setCleanupMonths(Number(e.target.value))}>
                  <option value={0}>All Time (Clear Everything)</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>1 Year</option>
                  <option value={24}>2 Years</option>
                </select>
              </div>
              <button
                className="btn btn-outline btn-full"
                style={{ borderColor: '#ef4444', color: '#ef4444', marginTop: '0.5rem' }}
                onClick={handleCleanup}
                disabled={cleaning}
              >
                {cleaning ? <Loader2 className="spinner" size={16} /> : 'Delete Old Records'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* FULL-WIDTH: Terms & Conditions */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="settings-card-header">
          <FileText size={18} style={{ color: '#6366f1' }} />
          <h3>Terms &amp; Conditions</h3>
        </div>
        <div className="settings-form">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            This text will be shown to riders in the app before they can confirm a booking. They must click <strong>"I Consent"</strong> to proceed.
          </p>
          <div className="form-group">
            <label>Terms &amp; Conditions Text</label>
            <textarea
              rows={10}
              value={platform.terms_and_conditions || ''}
              onChange={e => setPlatform({ ...platform, terms_and_conditions: e.target.value })}
              placeholder="Enter your full Terms & Conditions text here..."
              style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.85rem', lineHeight: '1.6', width: '100%' }}
            />
          </div>
          <button className="btn btn-primary" onClick={handlePlatformSave} disabled={saving} style={{ minWidth: '200px' }}>
            {saving ? <Loader2 className="spinner" size={16} /> : <><Save size={16} /> Save Terms &amp; Conditions</>}
          </button>
        </div>
      </div>

    </div>
  );
};

export default Settings;
