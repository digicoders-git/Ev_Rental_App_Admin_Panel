import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Search, Eye, Phone, Mail, X, Loader, UserCircle, Plus, CheckCircle, Lock, EyeOff, Edit3, MessageSquare } from 'lucide-react';
import { getFranchiseBookings, addRider, updateUser } from '../../services/apiServices';
import useApi from '../../services/useApi';

const FCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [editingNoteCustomer, setEditingNoteCustomer] = useState(null);
  const [selectedNoteTag, setSelectedNoteTag] = useState('');
  const [customNoteText, setCustomNoteText] = useState('');
  
  // Registration Modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Form States
  const [customerForm, setCustomerForm] = useState({ name: '', mobile: '', email: '', city: '', password: '', confirmPassword: '' });

  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);

  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { loading, call } = useApi();

  const handleSaveNotes = () => {
    if (!editingNoteCustomer) return;
    const finalNote = customNoteText.trim();
    call(
      () => updateUser(editingNoteCustomer._id || editingNoteCustomer.id, { notes: finalNote }),
      () => {
        setCustomers(prev => prev.map(c => (c._id === editingNoteCustomer._id) ? { ...c, notes: finalNote } : c));
        if (selected && selected._id === editingNoteCustomer._id) {
          setSelected(prev => ({ ...prev, notes: finalNote }));
        }
        setEditingNoteCustomer(null);
      }
    );
  };

  const fetchCustomers = () => {
    call(
      () => getFranchiseBookings(),
      (bookingsData) => {
        // useApi passes res.data — so actual array is in bookingsData.data
        const fBookings = Array.isArray(bookingsData?.data) ? bookingsData.data
          : Array.isArray(bookingsData) ? bookingsData : [];

        // Derive unique users directly from franchise bookings (single source of truth)
        const userMap = {};
        fBookings.forEach(b => {
          if (!b.user) return;
          const uid = typeof b.user === 'object' ? b.user._id : b.user;
          if (!userMap[uid]) {
            const u = typeof b.user === 'object' ? b.user : {};
            userMap[uid] = {
              _id: uid,
              driver_id: u.driver_id || '',
              name: u.name || 'N/A',
              mobile: u.mobile || '',
              email: u.email || '',
              city: u.city || '',
              isKycVerified: u.isKycVerified || false,
              isLoggedIn: u.isLoggedIn || false,
              profile_picture: u.profile_picture || '',
              notes: u.notes || '',
              bookings: []
            };
          }
          userMap[uid].bookings.push(b);
        });

        const customerList = Object.values(userMap).map(u => {
          const myBookings = u.bookings;
          const totalSpent = myBookings.reduce((sum, b) => sum + (b.grand_total || 0), 0);
          let lastRide = null;
          if (myBookings.length > 0) {
            const sorted = [...myBookings].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
            lastRide = sorted[0].start_date;
          }
          return {
            _id: u._id,
            driver_id: u.driver_id,
            name: u.name,
            mobile: u.mobile,
            email: u.email,
            city: u.city,
            isKycVerified: u.isKycVerified,
            isLoggedIn: u.isLoggedIn || false,
            profile_picture: u.profile_picture,
            notes: u.notes || '',
            totalRides: myBookings.length,
            totalSpent,
            lastRide,
            bookings: myBookings
          };
        });

        setCustomers(customerList);
      }
    );
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.mobile || '').includes(search) ||
    (c.driver_id || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const map = { confirmed: 'badge-success', ongoing: 'badge-info', completed: 'badge-secondary', pending: 'badge-warning', cancelled: 'badge-danger' };
    return map[status] || 'badge-warning';
  };

  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!customerForm.name || !customerForm.email || !customerForm.mobile) {
      setFormError('Name, Email, and Mobile number are required.');
      return;
    }

    if (customerForm.password && customerForm.password !== customerForm.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    call(() => addRider({
      name: customerForm.name,
      mobile: customerForm.mobile,
      email: customerForm.email,
      city: customerForm.city,
      password: customerForm.password || '123456'
    }), (res) => {
      setSuccessMsg('Customer created successfully! 🎉');
      setCustomerForm({ name: '', mobile: '', email: '', city: '', password: '', confirmPassword: '' });
      
      // Immediately refresh the table
      fetchCustomers();
      
      setTimeout(() => {
        setShowAddCustomer(false);
        setSuccessMsg('');
      }, 1500);
    }, (err) => {
      setFormError(err?.response?.data?.message || 'Failed to add customer. Please check if email or phone already exists.');
    });
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1>My Customers</h1>
          <p>All online riders and offline walk-in customers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setCustomerForm({ name: '', mobile: '', email: '', city: '', password: '', confirmPassword: '' }); setShowAddCustomer(true); }}>
          <Plus size={16} /> Add New User
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Registered Customers', value: customers.length, color: 'var(--primary)' },
          { label: 'KYC Verified Customers', value: customers.filter(c => c.isKycVerified).length, color: '#10b981' },
          { label: 'KYC Pending / Not Verified', value: customers.filter(c => !c.isKycVerified).length, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ color: s.color, margin: 0 }}>{s.value}</h2>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3>Customers List</h3>
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Search name, mobile or ID..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading && customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><Loader size={28} className="spinner" color="var(--primary)" /></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Customer Info</th>
                  <th>Mobile</th>
                  <th>City</th>
                  <th>KYC Status</th>
                  <th>Total Rides</th>
                  <th>Spent</th>
                  <th>Last Ride</th>
                  <th>Notes / Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No customers found.
                  </td></tr>
                ) : filtered.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.email}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e40af', marginTop: '4px', whiteSpace: 'nowrap' }}>{c.driver_id ? `Driver ID: ${c.driver_id}` : 'No Driver ID'}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{c.mobile}</td>
                    <td>{c.city || 'N/A'}</td>
                    <td>
                      <span className={`badge ${c.isKycVerified ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {c.isKycVerified ? 'Approved' : 'Pending / Not Verified'}
                      </span>
                    </td>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{c.totalRides}</span></td>
                    <td style={{ fontWeight: 600 }}>₹{c.totalSpent.toLocaleString()}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {c.lastRide ? new Date(c.lastRide).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {c.notes ? (
                          <span style={{ 
                            background: '#eff6ff', 
                            color: '#1e3a8a', 
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            fontSize: '0.78rem', 
                            fontWeight: 600,
                            border: '1px solid #bfdbfe',
                            display: 'inline-block',
                            maxWidth: '150px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'pointer'
                          }} title={c.notes} onClick={() => { setEditingNoteCustomer(c); setSelectedNoteTag(c.notes); setCustomNoteText(c.notes); }}>
                            💬 {c.notes}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontStyle: 'italic', cursor: 'pointer' }} onClick={() => { setEditingNoteCustomer(c); setSelectedNoteTag(''); setCustomNoteText(''); }}>
                            + Add Remark
                          </span>
                        )}
                        <button className="btn-icon" title="Edit Remark/Note" style={{ padding: '4px', height: 'auto', color: '#2563eb' }} onClick={() => { setEditingNoteCustomer(c); setSelectedNoteTag(c.notes || ''); setCustomNoteText(c.notes || ''); }}>
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <button className="btn-icon" title="View Ride History" onClick={() => setSelected(c)}><Eye size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Rider Modal */}
      {showAddCustomer && createPortal(
        <div className="modal-overlay" onClick={() => setShowAddCustomer(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register Walk-in Customer</h3>
              <button className="btn-icon" onClick={() => setShowAddCustomer(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddCustomerSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formError && <div style={{ color: '#ef4444', background: '#fee2e2', padding: '0.625rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500 }}>{formError}</div>}
                {successMsg && <div style={{ color: '#047857', background: '#d1fae5', padding: '0.625rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500 }}>{successMsg}</div>}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Full Name *</label>
                  <input type="text" required placeholder="Customer Full Name" value={customerForm.name} onChange={e => setCustomerForm(p => ({ ...p, name: e.target.value }))}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Email *</label>
                    <input type="email" required placeholder="customer@domain.com" value={customerForm.email} onChange={e => setCustomerForm(p => ({ ...p, email: e.target.value }))}
                      style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Phone / Mobile *</label>
                    <input type="text" required placeholder="Mobile Number" value={customerForm.mobile} onChange={e => setCustomerForm(p => ({ ...p, mobile: e.target.value }))}
                      style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>City</label>
                    <input type="text" placeholder="Customer Residence City" value={customerForm.city} onChange={e => setCustomerForm(p => ({ ...p, city: e.target.value }))}
                      style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Password (Default: 123456)</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPwd ? "text" : "password"} placeholder="Enter strong password" value={customerForm.password} onChange={e => setCustomerForm(p => ({ ...p, password: e.target.value }))}
                        style={{ width: '100%', padding: '0.625rem 2rem 0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }} />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showCPwd ? "text" : "password"} placeholder="Confirm password" value={customerForm.confirmPassword} onChange={e => setCustomerForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      style={{ width: '100%', padding: '0.625rem 2rem 0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }} />
                    <button type="button" onClick={() => setShowCPwd(!showCPwd)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      {showCPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddCustomer(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <Loader size={16} className="spinner" /> : 'Register Rider'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Customer Detail Modal */}
      {selected && createPortal(
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                  {selected.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{selected.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{selected.mobile}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '8px' }}>Customer Profile</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    <div><strong>Email:</strong> {selected.email}</div>
                    <div><strong>Phone:</strong> {selected.mobile}</div>
                    <div><strong>City:</strong> {selected.city || 'N/A'}</div>
                    <div><strong>KYC Status:</strong> <span className={`badge ${selected.isKycVerified ? 'badge-success' : 'badge-warning'}`}>{selected.isKycVerified ? 'Verified' : 'Pending'}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>Device Session:</strong>
                      <span className={`badge ${selected.isLoggedIn ? 'badge-success' : 'badge-secondary'}`} style={{ fontSize: '0.75rem' }}>
                        {selected.isLoggedIn ? '🟢 Active on Device' : '⚪ Logged Out'}
                      </span>
                      {selected.isLoggedIn && (
                        <button className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem', color: '#ef4444', borderColor: '#ef4444' }} onClick={() => {
                          call(() => updateUser(selected._id || selected.id, { isLoggedIn: false }), () => {
                            setSelected({ ...selected, isLoggedIn: false });
                            setCustomers(prev => prev.map(c => (c._id === (selected._id || selected.id)) ? { ...c, isLoggedIn: false } : c));
                          });
                        }}>
                          Force Logout
                        </button>
                      )}
                    </div>
                    {selected.notes && <div style={{ marginTop: '8px', background: '#eff6ff', padding: '8px', borderRadius: '6px', border: '1px solid #bfdbfe', color: '#1e3a8a', fontSize: '0.85rem' }}><strong>📝 Note / Remark:</strong> {selected.notes}</div>}
                  </div>
                </div>
                <div>
                  <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '8px' }}>Booking History</h4>
                  {selected.bookings?.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No booking records found.</p>
                  ) : (
                    <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selected.bookings.map(b => (
                        <div key={b._id} style={{ border: '1px solid var(--border)', padding: '8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span>{b.booking_id}</span>
                            <span className={`badge ${getStatusBadge(b.booking_status)}`} style={{ fontSize: '0.7rem' }}>{b.booking_status}</span>
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>
                            {new Date(b.start_date).toLocaleDateString('en-IN')} to {new Date(b.end_date).toLocaleDateString('en-IN')}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontWeight: 500 }}>
                            <span>Total Spent:</span>
                            <span>₹{b.grand_total.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {editingNoteCustomer && createPortal(
        <div className="modal-overlay" onClick={() => setEditingNoteCustomer(null)}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '1.5rem', borderRadius: '12px', background: 'white', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>📝 Driver Notes & Remarks</h3>
              <button className="btn-icon" onClick={() => setEditingNoteCustomer(null)}><X size={20} /></button>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', lineHeight: '1.4' }}>
                Add or update operational remarks for <b>{editingNoteCustomer.name}</b> ({editingNoteCustomer.mobile}). Both you and Super Admin can view these notes.
              </p>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Quick Select Remark (Presets):</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'Good Driver',
                    'Late Payment',
                    'KYC Pending',
                    'Vehicle Damage Reported',
                    'Documents Verified',
                    'Blacklisted Warning',
                    'Follow-up Required',
                    'Clear Note / None'
                  ].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (tag === 'Clear Note / None') {
                          setSelectedNoteTag('');
                          setCustomNoteText('');
                        } else {
                          setSelectedNoteTag(tag);
                          setCustomNoteText(tag);
                        }
                      }}
                      style={{
                        padding: '5px 11px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: customNoteText === tag ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: customNoteText === tag ? '#eff6ff' : '#f8fafc',
                        color: customNoteText === tag ? '#1d4ed8' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {tag === 'Clear Note / None' ? '❌ Clear Note' : `🏷️ ${tag}`}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Custom Comment / Detailed Note:</label>
                <textarea
                  rows="3"
                  placeholder="Type any custom comment or remark about driver performance, documents, payment history..."
                  value={customNoteText}
                  onChange={(e) => { setCustomNoteText(e.target.value); setSelectedNoteTag(e.target.value); }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setEditingNoteCustomer(null)} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveNotes} disabled={loading} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.5rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                {loading ? <Loader size={16} className="spinner" /> : 'Save Remark'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FCustomers;
