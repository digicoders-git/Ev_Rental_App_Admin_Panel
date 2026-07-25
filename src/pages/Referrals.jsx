import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, CheckCircle, Clock, Loader2, Search } from 'lucide-react';
import { getAllReferrals } from '../services/apiServices';
import useApi from '../services/useApi';

const Referrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [search, setSearch] = useState('');
  const { loading, error, call } = useApi();

  useEffect(() => {
    call(
      () => getAllReferrals(),
      (data) => {
        setReferrals(data.data || []);
      }
    );
  }, []);

  const filtered = referrals.filter(r => 
    (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.mobile || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.referrer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.referrer?.driver_id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h2>Referrals</h2>
          <p>Manage and track all user referrals across the platform</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>All Referrals</h3>
          <div className="search-wrapper" style={{ width: '300px' }}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name, mobile, or Referral ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="spinner" size={32} />
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Referral ID</th>
                  <th>Referrer (Who Referred)</th>
                  <th>Referred User (Who Joined)</th>
                  <th>Scooty Booked</th>
                  <th>Booking Date</th>
                  <th>Registration Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No referrals found.</td>
                  </tr>
                ) : (
                  filtered.map(ref => (
                    <tr key={ref._id}>
                      <td><span style={{ fontWeight: '600' }}>{ref.referrer?.driver_id || 'N/A'}</span></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '500' }}>{ref.referrer?.name || 'Unknown'}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ref.referrer?.mobile || ''}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '500' }}>{ref.name || 'Unknown'}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ref.mobile || ''}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${ref.has_booking ? 'Active' : 'Pending'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {ref.has_booking ? <CheckCircle size={14} color="#10b981" /> : <Clock size={14} color="#f59e0b" />}
                          {ref.has_booking ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>{ref.has_booking && ref.booking_date ? new Date(ref.booking_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</td>
                      <td>{new Date(ref.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Referrals;
