import { useState, useEffect } from 'react';
import { 
  Save, Shield, IndianRupee, Percent,
  User, Lock, Mail, Phone, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import { 
  getProfile, updateProfile, changePassword, 
  getPlatformSettings, updatePlatformSettings 
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
    auto_approve_franchise: false
  });

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ type: '', text: '' });
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
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
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
      <div className="page-header">
        <div>
          <h1>Settings & Configurations</h1>
          <p>Manage your admin profile, security, and global platform preferences.</p>
        </div>
        {msg.text && (
          <div className={`settings-msg ${msg.type}`}>
            {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {msg.text}
          </div>
        )}
      </div>

      <div className="settings-grid-layout">
        {/* LEFT COLUMN: Admin Profile & Security */}
        <div className="settings-column">
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

          <div className="card">
            <div className="settings-card-header">
              <Lock size={18} className="danger-text" />
              <h3>Security & Password</h3>
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
        </div>

        {/* RIGHT COLUMN: Platform & Pricing */}
        <div className="settings-column">
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

          <div className="card">
            <div className="settings-card-header">
              <Percent size={18} className="secondary-text" />
              <h3>Commission & Settlement</h3>
            </div>
            <div className="settings-form">
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
            </div>
          </div>

          <div className="card">
            <div className="settings-card-header">
              <Shield size={18} style={{ color: '#8b5cf6' }} />
              <h3>Policies & Switches</h3>
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

          {/* Push Notifications section removed - FCM token is now saved automatically at login */}
        </div>
      </div>
    </div>
  );
};

export default Settings;
