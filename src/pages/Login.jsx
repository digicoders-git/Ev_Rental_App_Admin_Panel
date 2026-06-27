import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, User, Store } from 'lucide-react';
import { adminLogin, franchiseLogin } from '../services/apiServices';
import './Login.css';

const Login = ({ setIsAuthenticated }) => {
  const [role, setRole]         = useState('admin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      let res;
      let userData;
      if (role === 'admin') {
        res = await adminLogin({ email, password });
        userData = res.data.user;
      } else {
        res = await franchiseLogin({ email, password });
        userData = res.data.data;
      }

      const { token } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', role);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      setIsAuthenticated(true);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-v2">
      <div className="login-card-v2 fade-in">
        <div className="login-header-v2">
          <div className="login-logo-v2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="TRIS Electric" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: '4px' }} 
                 onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
            <Zap size={28} fill="var(--primary)" stroke="var(--primary)" style={{ display: 'none' }} />
            <span>TRIS <span>Electric</span></span>
          </div>
          <h2>{role === 'admin' ? 'Admin Login' : 'Franchise Login'}</h2>
          <p>Access the TRIS Electric {role === 'admin' ? 'administrative dashboard' : 'franchise panel'}</p>
        </div>

        <div className="role-toggle-container" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            type="button" 
            className={`role-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: role === 'admin' ? 'var(--primary)' : 'var(--card-bg)', color: role === 'admin' ? '#fff' : 'var(--text-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '500' }}
          >
            <User size={18} /> Admin
          </button>
          <button 
            type="button" 
            className={`role-btn ${role === 'franchise' ? 'active' : ''}`}
            onClick={() => setRole('franchise')}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: role === 'franchise' ? 'var(--primary)' : 'var(--card-bg)', color: role === 'franchise' ? '#fff' : 'var(--text-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '500' }}
          >
            <Store size={18} /> Franchise
          </button>
        </div>

        <form onSubmit={handleLogin} className="login-form-v2">
          <div className="form-group-v2">
            <label>Email Address</label>
            <div className="input-wrap-v2">
              <Mail size={18} className="input-icon-v2" />
              <input 
                type="email" 
                placeholder={role === 'admin' ? "admin@evrental.com" : "franchise@evrental.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="form-group-v2">
            <label>Password</label>
            <div className="input-wrap-v2">
              <Lock size={18} className="input-icon-v2" />
              <input 
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <button type="button" className="pwd-toggle-v2" onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="login-error-v2">{error}</div>}

          <button type="submit" className="login-submit-v2" disabled={isLoading}>
            {isLoading ? <Loader2 size={20} className="spinner" /> : <>Sign In <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="login-footer-v2">
          <p> Created with ❤️ by <span style={{color: 'var(--primary)', fontWeight: 'bold' , cursor: 'pointer' , textDecoration: 'underline'}} onClick={() => window.open('https://digicoders.in', '_blank')}>Team Digicoders</span></p>
        </div>
      </div>
    </div>
  );
};

export default Login;

