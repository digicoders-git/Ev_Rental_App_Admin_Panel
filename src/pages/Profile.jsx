import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  User, Mail, Phone, MapPin, Shield, Edit3, Save,
  X, Camera, Lock, Eye, EyeOff, Bell, CheckCircle,
  Calendar, Activity, Loader2, Key
} from 'lucide-react';
import { changePassword, updateProfile, getProfile, getNotifications } from '../services/apiServices';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile]       = useState(null);
  const [editMode, setEditMode]     = useState(false);
  const [form, setForm]             = useState({ name: '', email: '', mobile: '', city: 'Bangalore', bio: '' });
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwd, setPwd]               = useState({ current: '', newPwd: '', confirm: '' });
  const [showCur, setShowCur]       = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [showCon, setShowCon]       = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError]     = useState('');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profRes, notifRes] = await Promise.all([
        getProfile(),
        getNotifications()
      ]);
      
      if (profRes.data.success) {
        const data = profRes.data.data;
        setProfile(data);
        setForm({
          name: data.name || '',
          email: data.email || '',
          mobile: data.mobile || '',
          city: data.city || 'Bangalore',
          bio: data.bio || 'Administrator of EVRental EV platform.'
        });
      }

      if (notifRes.data.success) {
        // Use notifications as activity log for now
        const logs = notifRes.data.data.slice(0, 6).map(n => ({
          action: n.title,
          time: new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
          icon: <CheckCircle size={14} />,
          color: n.type === 'booking' ? '#3b82f6' : n.type === 'kyc' ? '#8b5cf6' : '#10b981'
        }));
        setActivities(logs);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const pw = k => e => { setPwd(p => ({ ...p, [k]: e.target.value })); setPwdError(''); };

  const getStrength = (p) => {
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  const strength = getStrength(pwd.newPwd);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await updateProfile({
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        city: form.city,
        bio: form.bio
      });
      if (res.data.success) {
        const updatedData = res.data.data;
        setProfile(updatedData);
        // Sync with localStorage for Navbar
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        localStorage.setItem('adminUser', JSON.stringify({ 
          ...adminUser, 
          name: updatedData.name, 
          email: updatedData.email 
        }));
        setEditMode(false);
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePwdSave = async () => {
    if (!pwd.current || !pwd.newPwd) {
      setPwdError('Please fill all fields');
      return;
    }
    if (pwd.newPwd !== pwd.confirm) {
      setPwdError('New passwords do not match');
      return;
    }
    
    try {
      setSaving(true);
      await changePassword({ 
        oldPassword: pwd.current, 
        newPassword: pwd.newPwd 
      });
      setPwdSuccess(true);
      setTimeout(() => {
        setPwdSuccess(false); 
        setShowPwdModal(false);
        setPwd({ current: '', newPwd: '', confirm: '' });
      }, 2000);
    } catch (error) {
      setPwdError(error.response?.data?.message || "Password update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="cp-page-loading">
        <Loader2 className="spinner" size={40} />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div><h1>Admin Profile</h1><p>Manage your account details and preferences.</p></div>
      </div>

      <div className="profile-layout">
        <div className="profile-left">
          <div className="card profile-avatar-card">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-circle">
                <span>{profile.name?.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <button className="avatar-camera-btn" title="Change Photo"><Camera size={15} /></button>
            </div>
            <h3 className="profile-name">{profile.name}</h3>
            <span className="profile-role-badge">{profile.role?.toUpperCase()}</span>
            <div className="profile-quick-info">
              <div className="pq-item"><Mail size={14} /><span>{profile.email}</span></div>
              <div className="pq-item"><Phone size={14} /><span>{profile.mobile}</span></div>
              <div className="pq-item"><MapPin size={14} /><span>{form.city}</span></div>
              <div className="pq-item"><Calendar size={14} /><span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span></div>
            </div>
            <button className="btn btn-outline profile-pwd-btn" onClick={() => { setShowPwdModal(true); setPwdError(''); }}>
              <Lock size={15} /> Change Password
            </button>
          </div>
        </div>

        <div className="profile-right">
          <div className="card">
            <div className="profile-card-header">
              <h3 className="profile-section-title"><User size={16} /> Profile Details</h3>
              {!editMode
                ? <button className="btn btn-outline btn-sm" onClick={() => setEditMode(true)}><Edit3 size={14} /> Edit</button>
                : <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditMode(false)}><X size={14} /> Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 size={14} className="spinner" /> : <><Save size={14} /> Save</>}
                    </button>
                  </div>
              }
            </div>

            {!editMode ? (
              <div className="profile-detail-grid">
                <div className="profile-detail-item">
                  <span className="profile-detail-label">Full Name</span>
                  <span className="profile-detail-val">{profile.name}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">Email</span>
                  <span className="profile-detail-val">{profile.email}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">Mobile</span>
                  <span className="profile-detail-val">{profile.mobile}</span>
                </div>
                <div className="profile-detail-item">
                  <span className="profile-detail-label">City</span>
                  <span className="profile-detail-val">{form.city}</span>
                </div>
                <div className="profile-detail-item full-width">
                  <span className="profile-detail-label">Bio</span>
                  <span className="profile-detail-val">{form.bio}</span>
                </div>
              </div>
            ) : (
              <form className="user-form" onSubmit={handleSave}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Mobile</label>
                    <input type="tel" value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea rows={3} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} style={{ resize: 'vertical' }} />
                </div>
              </form>
            )}
          </div>

          <div className="card">
            <h3 className="profile-section-title"><Activity size={16} /> Recent Activity</h3>
            <div className="activity-log">
              {activities.length === 0 ? (
                <div className="empty-log">No recent activity logs.</div>
              ) : activities.map((a, i) => (
                <div key={i} className="activity-log-item">
                  <div className="activity-log-icon" style={{ background: a.color + '20', color: a.color }}>{a.icon}</div>
                  <div className="activity-log-info">
                    <span className="activity-log-action">{a.action}</span>
                    <span className="activity-log-time">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showPwdModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowPwdModal(false)}>
          <div className="modal-content pwd-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="btn-icon" onClick={() => setShowPwdModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {pwdSuccess ? (
                <div className="pwd-success">
                  <CheckCircle size={36} color="#10b981" />
                  <p>Password changed successfully!</p>
                </div>
              ) : (
                <div className="user-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="pwd-input-wrap">
                      <input type={showCur ? 'text' : 'password'} value={pwd.current} onChange={pw('current')} />
                      <button type="button" className="pwd-eye" onClick={() => setShowCur(!showCur)}>
                        {showCur ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <div className="pwd-input-wrap">
                      <input type={showNew ? 'text' : 'password'} value={pwd.newPwd} onChange={pw('newPwd')} />
                      <button type="button" className="pwd-eye" onClick={() => setShowNew(!showNew)}>
                        {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {pwd.newPwd && (
                      <div className="pwd-strength">
                        <div className="pwd-strength-bars">
                          {[1,2,3,4].map(i => (
                            <div key={i} className="pwd-strength-bar"
                              style={{ background: i <= strength ? strengthColor[strength] : '#e2e8f0' }} />
                          ))}
                        </div>
                        <span className="pwd-strength-label" style={{ color: strengthColor[strength] }}>
                          {strengthLabel[strength]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <div className="pwd-input-wrap">
                      <input type={showCon ? 'text' : 'password'} value={pwd.confirm} onChange={pw('confirm')} />
                      <button type="button" className="pwd-eye" onClick={() => setShowCon(!showCon)}>
                        {showCon ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  {pwdError && <div className="pwd-global-error"><X size={14} /> {pwdError}</div>}
                </div>
              )}
            </div>
            {!pwdSuccess && (
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowPwdModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handlePwdSave} disabled={saving}>
                  {saving ? <Loader2 size={15} className="spinner" /> : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Profile;
