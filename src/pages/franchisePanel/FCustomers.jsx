import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Search, Eye, Phone, Mail, X, Loader, UserCircle, Plus, Calendar, CheckCircle, Lock, EyeOff } from 'lucide-react';
import { getFranchiseBookings, addRider, getMyFranchiseVehicles, getAllPlans, createBooking, getAllUsers } from '../../services/apiServices';
import useApi from '../../services/useApi';

const FCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  
  // Registration and Booking Modals
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showBookVehicle, setShowBookVehicle] = useState(false);
  const [selectedCustomerForBooking, setSelectedCustomerForBooking] = useState(null);

  // Form States
  const [customerForm, setCustomerForm] = useState({ name: '', mobile: '', email: '', city: '', password: '', confirmPassword: '' });
  const [bookingForm, setBookingForm] = useState({
    vehicle: '',
    plan: '',
    start_date: '',
    end_date: '',
    pickup_location: '',
    drop_location: '',
    payment_method: 'Cash',
    perDayRent: '500',
    securityDeposit: '2000'
  });

  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);

  // Masters Data
  const [vehicles, setVehicles] = useState([]);
  const [plans, setPlans] = useState([]);

  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { loading, call } = useApi();

  const fetchCustomers = () => {
    call(
      async () => {
        const [usersRes, bookingsRes] = await Promise.all([
          getAllUsers(),
          getFranchiseBookings()
        ]);
        return { 
          data: {
            users: usersRes.data?.data || usersRes.data || [], 
            bookings: bookingsRes.data?.data || bookingsRes.data || [] 
          }
        };
      },
      ({ users, bookings }) => {
        const allRiders = Array.isArray(users) ? users : [];
        const fBookings = Array.isArray(bookings) ? bookings : [];

        const userBookingsMap = {};
        fBookings.forEach(b => {
          if (!b.user) return;
          const uid = typeof b.user === 'object' ? b.user._id : b.user;
          if (!userBookingsMap[uid]) userBookingsMap[uid] = [];
          userBookingsMap[uid].push(b);
        });

        const customerList = allRiders.map(u => {
          const myBookings = userBookingsMap[u._id] || [];
          const totalSpent = myBookings.reduce((sum, b) => sum + (b.grand_total || 0), 0);
          
          let lastRide = null;
          if (myBookings.length > 0) {
            const sorted = [...myBookings].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
            lastRide = sorted[0].start_date;
          }

          return {
            _id: u._id,
            name: u.name || 'N/A',
            mobile: u.mobile || '',
            email: u.email || '',
            city: u.city || '',
            isKycVerified: u.isKycVerified || false,
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
    
    // Prefill Master data for direct booking
    call(() => getMyFranchiseVehicles(), (res) => {
      setVehicles((res.data || []).filter(v => v.status === 'active'));
    });
    call(() => getAllPlans(), (res) => {
      const activePlans = (res.data || []).filter(p => p.status === 'active');
      setPlans(activePlans);
      if (activePlans.length > 0) {
        setBookingForm(prev => ({ ...prev, plan: activePlans[0]._id }));
      }
    });
    
    const store = JSON.parse(localStorage.getItem('userData') || '{}');
    setBookingForm(prev => ({
      ...prev,
      pickup_location: store.store_name || store.city || '',
      drop_location: store.store_name || store.city || ''
    }));
  }, []);

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.mobile || '').includes(search) ||
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

  const getDurationDays = () => {
    if (!bookingForm.start_date || !bookingForm.end_date) return 0;
    const s = new Date(bookingForm.start_date);
    const e = new Date(bookingForm.end_date);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const diffTime = e - s;
    if (diffTime <= 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const durationDays = getDurationDays();
  const perDayRent = parseFloat(bookingForm.perDayRent) || 0;
  const securityDeposit = parseFloat(bookingForm.securityDeposit) || 0;
  const totalAmount = durationDays * perDayRent;
  const grandTotal = totalAmount + securityDeposit;

  const handleBookVehicleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const { vehicle, plan, start_date, end_date, payment_method } = bookingForm;

    if (!vehicle || !plan || !start_date || !end_date) {
      setFormError('Please select a vehicle, start date, and end date.');
      return;
    }

    if (new Date(start_date) >= new Date(end_date)) {
      setFormError('End date must be after the start date.');
      return;
    }

    const apiPaymentMethod = payment_method === 'Cash' ? 'cash' : 'online';

    call(() => createBooking({
      user: selectedCustomerForBooking._id,
      vehicle,
      plan,
      start_date,
      end_date,
      pickup_location: 'Franchise Store',
      drop_location: 'Franchise Store',
      payment_method: apiPaymentMethod,
      total_amount: totalAmount,
      security_deposit: securityDeposit
    }), () => {
      setSuccessMsg('Vehicle booked successfully! Ride is now pending approval in Ride Management. 🚀');
      fetchCustomers();
      setBookingForm(prev => ({
        ...prev,
        vehicle: '',
        start_date: '',
        end_date: '',
        perDayRent: '500',
        securityDeposit: '2000'
      }));
      setTimeout(() => {
        setShowBookVehicle(false);
        setSelectedCustomerForBooking(null);
        setSuccessMsg('');
      }, 2000);
    }, (err) => {
      setFormError(err || 'Booking creation failed. Please verify dates and vehicle availability.');
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
            <input type="text" placeholder="Search name or mobile..." value={search} onChange={e => setSearch(e.target.value)} />
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No customers found.
                  </td></tr>
                ) : filtered.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.email}</div>
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
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className="btn btn-outline" 
                          disabled={!c.isKycVerified}
                          title={c.isKycVerified ? "Book EV for this customer" : "KYC verification is required to book an EV"}
                          style={{ 
                            padding: '0.35rem 0.6rem', 
                            fontSize: '0.75rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            opacity: c.isKycVerified ? 1 : 0.5,
                            cursor: c.isKycVerified ? 'pointer' : 'not-allowed',
                            backgroundColor: c.isKycVerified ? 'transparent' : 'var(--border)'
                          }}
                          onClick={() => { 
                            setSelectedCustomerForBooking(c); 
                            setShowBookVehicle(true); 
                          }}
                        >
                          <Calendar size={13} /> Book EV
                        </button>
                        <button className="btn-icon" title="View Ride History" onClick={() => setSelected(c)}><Eye size={16} /></button>
                      </div>
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

      {/* Book EV Modal */}
      {showBookVehicle && selectedCustomerForBooking && createPortal(
        <div className="modal-overlay" onClick={() => { setShowBookVehicle(false); setSelectedCustomerForBooking(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Book EV — Offline Customer</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Customer: {selectedCustomerForBooking.name} ({selectedCustomerForBooking.mobile})</p>
              </div>
              <button className="btn-icon" onClick={() => { setShowBookVehicle(false); setSelectedCustomerForBooking(null); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleBookVehicleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formError && <div style={{ color: '#ef4444', background: '#fee2e2', padding: '0.625rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500 }}>{formError}</div>}
                {successMsg && <div style={{ color: '#047857', background: '#d1fae5', padding: '0.625rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500 }}>{successMsg}</div>}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Select EV Vehicle *</label>
                  <select required value={bookingForm.vehicle} onChange={e => setBookingForm(p => ({ ...p, vehicle: e.target.value }))}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }}>
                    <option value="">-- Choose Available EV --</option>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>{v.brand} {v.vehicle_name} ({v.registration_number})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Rent Per Day (₹) *</label>
                    <input type="number" required min="0" value={bookingForm.perDayRent} onChange={e => setBookingForm(p => ({ ...p, perDayRent: e.target.value }))}
                      style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Security Deposit (₹) *</label>
                    <input type="number" required min="0" value={bookingForm.securityDeposit} onChange={e => setBookingForm(p => ({ ...p, securityDeposit: e.target.value }))}
                      style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Start Date & Time *</label>
                    <input type="datetime-local" required value={bookingForm.start_date} onChange={e => setBookingForm(p => ({ ...p, start_date: e.target.value }))}
                      style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>End Date & Time *</label>
                    <input type="datetime-local" required value={bookingForm.end_date} onChange={e => setBookingForm(p => ({ ...p, end_date: e.target.value }))}
                      style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Payment Mode</label>
                  <select value={bookingForm.payment_method} onChange={e => setBookingForm(p => ({ ...p, payment_method: e.target.value }))}
                    style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="Online">Online Link</option>
                  </select>
                </div>

                <div style={{ background: 'var(--background)', padding: '0.875rem', borderRadius: '8px', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '4px', color: 'var(--text-primary)' }}>Price Summary</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>Rent Rate:</span>
                    <span style={{ fontWeight: 600 }}>₹{perDayRent} / day</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>Total Duration:</span>
                    <span style={{ fontWeight: 600 }}>{durationDays} {durationDays === 1 ? 'day' : 'days'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>Total Rent Amount:</span>
                    <span style={{ fontWeight: 600 }}>₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>Security Deposit (Refundable):</span>
                    <span style={{ fontWeight: 600 }}>₹{securityDeposit.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', borderTop: '1px dotted var(--border)', paddingTop: '6px', marginTop: '4px' }}>
                    <span>Grand Total:</span>
                    <span>₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => { setShowBookVehicle(false); setSelectedCustomerForBooking(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <Loader size={16} className="spinner" /> : 'Confirm Booking'}
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
    </div>
  );
};

export default FCustomers;
