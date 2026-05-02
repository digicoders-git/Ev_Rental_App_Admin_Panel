import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { adminLogin } from '../services/apiServices';
import './Login.css';

const Login = ({ setIsAuthenticated }) => {
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
      const res = await adminLogin({ email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('adminUser', JSON.stringify(user));
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
          <div className="login-logo-v2">
            <Zap size={28} fill="var(--primary)" stroke="var(--primary)" />
            <span>Volt<span>Rent</span></span>
          </div>
          <h2>Admin Login</h2>
          <p>Access the VoltRent administrative dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="login-form-v2">
          <div className="form-group-v2">
            <label>Email Address</label>
            <div className="input-wrap-v2">
              <Mail size={18} className="input-icon-v2" />
              <input 
                type="email" 
                placeholder="admin@voltrent.com" 
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
