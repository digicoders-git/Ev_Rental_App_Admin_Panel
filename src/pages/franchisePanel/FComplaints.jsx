import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Headphones, Search, Loader, AlertTriangle, X, CheckCircle, Clock,
  MessageSquare, Eye, Car, User, Calendar, XCircle
} from 'lucide-react';
import { getFranchiseTickets } from '../../services/apiServices';
import api from '../../services/api';
import '../Complaints.css';

const STATUS_CFG = {
  'Open':        { cls: 'badge-danger',  icon: <AlertTriangle size={11} /> },
  'In Progress': { cls: 'badge-warning', icon: <Clock size={11} /> },
  'Resolved':    { cls: 'badge-success', icon: <CheckCircle size={11} /> },
  'Closed':      { cls: 'badge-info',    icon: <XCircle size={11} /> },
};

const PRIORITY_CFG = {
  'high':   { cls: 'priority-high',     dot: '#ea580c', label: 'High' },
  'medium': { cls: 'priority-medium',   dot: '#f59e0b', label: 'Medium' },
  'low':    { cls: 'priority-low',      dot: '#10b981', label: 'Low' },
  'critical': { cls: 'priority-critical', dot: '#ef4444', label: 'Critical' },
};

const TABS = ['All', 'Active', 'Open', 'In Progress', 'Resolved', 'Closed'];

const FComplaints = () => {
  const [viewMode, setViewMode]     = useState('drivers'); // 'drivers' | 'raise'
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('All');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);

  // Ticket submission state (for raising complaints to Super Admin)
  const [form, setForm] = useState({ subject: '', message: '', category: 'booking' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (viewMode === 'drivers') {
      fetchDriverComplaints();
    }
  }, [viewMode]);

  const fetchDriverComplaints = async () => {
    try {
      setLoading(true);
      const { data } = await getFranchiseTickets();
      const list = (data.data || []).map(t => ({
        id: t._id,
        ticketId: t.ticket_id || 'TKT-000',
        user: t.user?.name || 'Unknown',
        email: t.user?.email || '',
        phone: t.user?.mobile || '',
        category: t.category || 'General',
        subject: t.subject || '',
        description: t.description || '',
        bookingId: t.booking || 'N/A',
        vehicle: t.vehicle_number || t.vehicle?.registration_number || 'N/A',
        priority: t.priority || 'medium',
        status: t.status === 'open' ? 'Open' : t.status === 'in-progress' ? 'In Progress' : t.status === 'resolved' ? 'Resolved' : 'Closed',
        date: new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        replies: t.admin_reply ? [{ by: 'Admin/Support', msg: t.admin_reply, time: t.resolved_at ? new Date(t.resolved_at).toLocaleString('en-IN') : '' }] : [],
        rawStatus: t.status
      }));
      setComplaints(list);
    } catch (err) {
      console.error("Error fetching franchise tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const counts = TABS.reduce((acc, t) => {
    if (t === 'All') acc[t] = complaints.length;
    else if (t === 'Active') acc[t] = complaints.filter(c => c.status === 'Open' || c.status === 'In Progress').length;
    else acc[t] = complaints.filter(c => c.status === t).length;
    return acc;
  }, {});

  const filtered = complaints.filter(c => {
    let matchTab = false;
    if (activeTab === 'All') matchTab = true;
    else if (activeTab === 'Active') matchTab = c.status === 'Open' || c.status === 'In Progress';
    else matchTab = c.status === activeTab;

    const q = search.toLowerCase();
    return matchTab && (
      c.ticketId.toLowerCase().includes(q) ||
      c.user.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.vehicle.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/support/ticket', {
        subject: form.subject,
        message: form.message,
        category: form.category,
      });
      setSuccess(true);
      setForm({ subject: '', message: '', category: 'booking' });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit complaint. Please try again.');
    }
    setSubmitting(false);
  };

  const categories = [
    { value: 'booking', label: 'Booking Issue' },
    { value: 'payment', label: 'Payment Problem' },
    { value: 'vehicle', label: 'Vehicle Problem' },
    { value: 'customer', label: 'Customer Dispute' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Complaints & Support</h1>
          <p>View complaints raised by your drivers or submit support requests to Admin.</p>
        </div>

        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setViewMode('drivers')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: viewMode === 'drivers' ? '#ffffff' : 'transparent',
              color: viewMode === 'drivers' ? '#2563eb' : '#64748b',
              boxShadow: viewMode === 'drivers' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            📋 Driver Complaints
          </button>
          <button
            onClick={() => setViewMode('raise')}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: viewMode === 'raise' ? '#ffffff' : 'transparent',
              color: viewMode === 'raise' ? '#2563eb' : '#64748b',
              boxShadow: viewMode === 'raise' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            🎧 Raise Ticket to Admin
          </button>
        </div>
      </div>

      {viewMode === 'drivers' ? (
        <>
          {/* Stats Grid */}
          <div className="cmp-stats">
            <div className="card cmp-stat-card">
              <div className="cmp-stat-icon total"><MessageSquare size={19} /></div>
              <div><span className="cmp-stat-label">Total Tickets</span><h3>{complaints.length}</h3></div>
            </div>
            <div className="card cmp-stat-card">
              <div className="cmp-stat-icon open"><AlertTriangle size={19} /></div>
              <div><span className="cmp-stat-label">Open</span><h3>{counts['Open'] || 0}</h3></div>
            </div>
            <div className="card cmp-stat-card">
              <div className="cmp-stat-icon progress"><Clock size={19} /></div>
              <div><span className="cmp-stat-label">In Progress</span><h3>{counts['In Progress'] || 0}</h3></div>
            </div>
            <div className="card cmp-stat-card">
              <div className="cmp-stat-icon resolved"><CheckCircle size={19} /></div>
              <div><span className="cmp-stat-label">Resolved</span><h3>{counts['Resolved'] || 0}</h3></div>
            </div>
          </div>

          {/* Toolbar and Table */}
          <div className="card">
            <div className="cmp-toolbar">
              <div className="filter-tabs">
                {TABS.map(t => (
                  <button key={t} className={`filter-tab ${activeTab === t ? 'active' : ''}`}
                    onClick={() => setActiveTab(t)}>
                    {t} <span className="tab-count">{counts[t] || 0}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className="search-wrapper">
                  <Search size={15} className="search-icon" />
                  <input type="text" placeholder="Search ID, driver, vehicle..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="cmp-table-container">
              {loading ? (
                <div style={{ padding: '4rem 0', textAlign: 'center', color: '#64748b' }}>
                  <Loader size={30} className="spinner" style={{ margin: '0 auto 1rem', display: 'block' }} />
                  Loading driver complaints...
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Complaint ID</th>
                      <th>Driver</th>
                      <th>Vehicle No.</th>
                      <th>Category</th>
                      <th>Subject</th>
                      <th>Priority</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="cmp-empty-row">
                          <MessageSquare size={28} />
                          <p>No complaints found from your assigned drivers/vehicles.</p>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((c, i) => (
                        <tr key={c.id}>
                          <td className="td-muted">{i + 1}</td>
                          <td><span className="cmp-id-badge">{c.ticketId}</span></td>
                          <td>
                            <div className="cmp-user-cell">
                              <div className="cmp-avatar">{c.user.split(' ').map(n => n[0]).join('')}</div>
                              <div>
                                <span className="cell-main">{c.user}</span>
                                <span className="cell-sub">{c.phone || c.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#334155', background: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace', display: 'inline-block' }}>
                              {c.vehicle}
                            </span>
                          </td>
                          <td><span className="cmp-category">{c.category}</span></td>
                          <td>
                            <span className="cell-main" style={{ maxWidth: 200 }}>{c.subject}</span>
                            <span className="cell-sub">Booking: {c.bookingId}</span>
                          </td>
                          <td>
                            <span className={`priority-badge ${PRIORITY_CFG[c.priority]?.cls || 'priority-medium'}`}>
                              <span className="priority-dot" style={{ background: PRIORITY_CFG[c.priority]?.dot || '#f59e0b' }} />
                              {PRIORITY_CFG[c.priority]?.label || 'Medium'}
                            </span>
                          </td>
                          <td className="td-muted">{c.date}</td>
                          <td>
                            <span className={`badge badge-icon ${STATUS_CFG[c.status]?.cls || 'badge-info'}`}>
                              {STATUS_CFG[c.status]?.icon} {c.status}
                            </span>
                          </td>
                          <td>
                            <button className="btn-icon" title="View Details" onClick={() => setSelected(c)}>
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Submit Ticket */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ background: '#dbeafe', color: '#1e40af', padding: '10px', borderRadius: '10px' }}>
                <Headphones size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0 }}>Raise a Ticket to Super Admin</h3>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Our administration team will respond within 24 hours</p>
              </div>
            </div>

            {success ? (
              <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                <CheckCircle size={40} color="#10b981" style={{ marginBottom: '0.75rem', display: 'inline-block' }} />
                <h3 style={{ color: '#065f46' }}>Ticket Submitted!</h3>
                <p style={{ color: '#065f46', margin: '0.5rem 0 1rem' }}>Our team will review your complaint and get back to you shortly.</p>
                <button className="btn btn-primary" onClick={() => setSuccess(false)}>Submit Another</button>
              </div>
            ) : (
              <>
                {error && (
                  <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', color: '#991b1b', fontSize: '0.875rem' }}>
                    <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />{error}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Category *</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)', color: 'var(--text)' }}>
                      {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Subject *</label>
                    <input type="text" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                      placeholder="Brief description of the issue"
                      style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Details *</label>
                    <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      placeholder="Describe the problem in detail... Include booking ID or driver info if relevant."
                      rows={5}
                      style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }} />
                  </div>

                  <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <><Loader size={16} className="spinner" style={{ display: 'inline-block', marginRight: '6px' }} /> Submitting...</> : <><Headphones size={16} style={{ display: 'inline-block', marginRight: '6px' }} /> Submit Complaint</>}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Info & Help */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>
              <h3 style={{ color: 'white', margin: '0 0 0.5rem' }}>Need Immediate Help?</h3>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 1rem', fontSize: '0.9rem' }}>
                For urgent issues contact your franchise coordinator directly.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.25)', padding: '0.75rem', borderRadius: '8px', color: 'white', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold' }}>
                🕙 Vehicle Service Timing: 10:00 AM – 6:00 PM
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}>
                📞 Support: +91 94531 69279
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Common Issues</h3>
              {[
                { title: 'Vehicle not starting', desc: 'Report to admin immediately. We will arrange a replacement.' },
                { title: 'Customer refuses to return', desc: 'Document the situation and raise a ticket with booking ID.' },
                { title: 'Payment not credited', desc: 'Include transaction ID and booking ID in your complaint.' },
                { title: 'App not loading', desc: 'Clear browser cache and try again, then raise a technical ticket.' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '0.75rem 0', borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && createPortal(
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content cmp-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="cmp-modal-head">
                <span className="cmp-id-badge">{selected.ticketId}</span>
                <span className={`priority-badge ${PRIORITY_CFG[selected.priority]?.cls || 'priority-medium'}`}>
                  <span className="priority-dot" style={{ background: PRIORITY_CFG[selected.priority]?.dot || '#f59e0b' }} />
                  {PRIORITY_CFG[selected.priority]?.label || 'Medium'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <span className={`badge badge-icon ${STATUS_CFG[selected.status]?.cls || 'badge-info'}`}>
                  {STATUS_CFG[selected.status]?.icon} {selected.status}
                </span>
                <button className="btn-icon" onClick={() => setSelected(null)}><X size={20} /></button>
              </div>
            </div>

            <div className="modal-body">
              <div className="cmp-subject-block">
                <h3>{selected.subject}</h3>
                <p className="cmp-description">{selected.description || 'No description provided.'}</p>
              </div>

              <div className="cmp-info-grid">
                <div className="cmp-info-item"><User size={13} /><span>Driver</span><strong>{selected.user}</strong></div>
                <div className="cmp-info-item"><Car size={13} /><span>Vehicle No.</span><strong>{selected.vehicle}</strong></div>
                <div className="cmp-info-item"><Calendar size={13} /><span>Date</span><strong>{selected.date}</strong></div>
                <div className="cmp-info-item"><MessageSquare size={13} /><span>Category</span><strong>{selected.category}</strong></div>
                <div className="cmp-info-item"><span>Booking ID</span><strong>{selected.bookingId}</strong></div>
                <div className="cmp-info-item"><span>Phone</span><strong>{selected.phone || 'N/A'}</strong></div>
              </div>

              <div className="cmp-thread">
                <h4>Replies & Updates ({selected.replies.length})</h4>
                {selected.replies.length === 0 ? (
                  <div className="cmp-no-replies">No reply from Super Admin yet.</div>
                ) : (
                  selected.replies.map((r, idx) => (
                    <div key={idx} className="cmp-reply-bubble admin">
                      <div className="cmp-reply-header">
                        <span className="cmp-reply-by">{r.by}</span>
                        <span className="cmp-reply-time">{r.time}</span>
                      </div>
                      <p className="cmp-reply-msg">{r.msg}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FComplaints;
