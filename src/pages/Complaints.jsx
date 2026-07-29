import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare, Search, Eye, X, CheckCircle, Clock,
  AlertTriangle, XCircle, User, Car, Building2,
  Calendar, Send, Loader2
} from 'lucide-react';
import { getAllTickets, updateTicket } from '../services/apiServices';
import './Complaints.css';

const STATUS_CFG = {
  'Open':        { cls: 'badge-danger',  icon: <AlertTriangle size={11} />, api: 'open' },
  'In Progress': { cls: 'badge-warning', icon: <Clock size={11} />, api: 'in-progress' },
  'Resolved':    { cls: 'badge-success', icon: <CheckCircle size={11} />, api: 'resolved' },
  'Closed':      { cls: 'badge-info',    icon: <XCircle size={11} />, api: 'closed' },
};

const PRIORITY_CFG = {
  'high':   { cls: 'priority-high',     dot: '#ea580c', label: 'High' },
  'medium': { cls: 'priority-medium',   dot: '#f59e0b', label: 'Medium' },
  'low':    { cls: 'priority-low',      dot: '#10b981', label: 'Low' },
  'critical': { cls: 'priority-critical', dot: '#ef4444', label: 'Critical' }, // In case backend adds it
};

const TABS = ['All', 'Active', 'Open', 'In Progress', 'Resolved', 'Closed'];

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('All');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);
  const [replyText, setReplyText]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const { data } = await getAllTickets();
      const list = (data.data || []).map(t => ({
        id: t._id,
        ticketId: t.ticket_id || 'TKT-000',
        user: t.user?.name || 'Unknown',
        email: t.user?.email || '',
        phone: t.user?.mobile || '',
        category: t.category || 'General',
        subject: t.subject || '',
        description: t.description || '',
        bookingId: t.booking?.booking_id || t.booking?._id || t.booking || 'N/A',
        vehicle: t.vehicle_number || t.vehicle?.registration_number || 'N/A',
        franchise: t.franchise_name || t.franchise?.store_name || 'Direct / Super Admin',
        priority: t.priority || 'medium',
        status: t.status === 'open' ? 'Open' : t.status === 'in-progress' ? 'In Progress' : t.status === 'resolved' ? 'Resolved' : 'Closed',
        date: new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        replies: t.admin_reply ? [{ by: 'Admin', msg: t.admin_reply, time: t.resolved_at ? new Date(t.resolved_at).toLocaleString('en-IN') : '' }] : [],
        rawStatus: t.status
      }));
      setComplaints(list);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const counts = TABS.reduce((acc, t) => {
    if (t === 'All') {
      acc[t] = complaints.length;
    } else if (t === 'Active') {
      acc[t] = complaints.filter(c => c.status === 'Open' || c.status === 'In Progress').length;
    } else {
      acc[t] = complaints.filter(c => c.status === t).length;
    }
    return acc;
  }, {});

  const filtered = complaints.filter(c => {
    let matchTab = false;
    if (activeTab === 'All') {
      matchTab = true;
    } else if (activeTab === 'Active') {
      matchTab = c.status === 'Open' || c.status === 'In Progress';
    } else {
      matchTab = c.status === activeTab;
    }
    
    const q = search.toLowerCase();
    return matchTab && (
      c.ticketId.toLowerCase().includes(q) ||
      c.user.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.vehicle.toLowerCase().includes(q) ||
      c.franchise.toLowerCase().includes(q)
    );
  });

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    try {
      setSubmitting(true);
      await updateTicket(selected.id, { 
        admin_reply: replyText.trim(), 
        status: selected.status === 'Open' ? 'in-progress' : STATUS_CFG[selected.status].api 
      });
      setReplyText('');
      fetchTickets();
      setSelected(null);
    } catch (error) {
      console.error("Error replying to ticket:", error);
      alert("Failed to send reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id, statusLabel) => {
    try {
      const apiStatus = STATUS_CFG[statusLabel].api;
      await updateTicket(id, { status: apiStatus });
      fetchTickets(false);
      if (selected && selected.id === id) {
        setSelected(prev => ({ ...prev, status: statusLabel }));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="cp-page-loading">
        <Loader2 className="spinner" size={40} />
        <p>Loading complaints...</p>
      </div>
    );
  }

  return (
    <div className="complaints-page">
      <div className="page-header">
        <div>
          <h1>Complaint Management</h1>
          <p>Track, manage and resolve user complaints efficiently.</p>
        </div>
      </div>

      <div className="cmp-stats">
        <div className="card cmp-stat-card">
          <div className="cmp-stat-icon total"><MessageSquare size={19} /></div>
          <div><span className="cmp-stat-label">Total Tickets</span><h3>{complaints.length}</h3></div>
        </div>
        <div className="card cmp-stat-card">
          <div className="cmp-stat-icon open"><AlertTriangle size={19} /></div>
          <div><span className="cmp-stat-label">Open</span><h3>{counts['Open']}</h3></div>
        </div>
        <div className="card cmp-stat-card">
          <div className="cmp-stat-icon progress"><Clock size={19} /></div>
          <div><span className="cmp-stat-label">In Progress</span><h3>{counts['In Progress']}</h3></div>
        </div>
        <div className="card cmp-stat-card">
          <div className="cmp-stat-icon resolved"><CheckCircle size={19} /></div>
          <div><span className="cmp-stat-label">Resolved</span><h3>{counts['Resolved']}</h3></div>
        </div>
      </div>

      <div className="card">
        <div className="cmp-toolbar">
          <div className="filter-tabs">
            {TABS.map(t => (
              <button key={t} className={`filter-tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}>
                {t} <span className="tab-count">{counts[t]}</span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select 
              value={activeTab} 
              onChange={e => setActiveTab(e.target.value)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', background: 'var(--surface)' }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active (Open + In Progress)</option>
              <option value="Open">Open Only</option>
              <option value="In Progress">In Progress Only</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <div className="search-wrapper">
              <Search size={15} className="search-icon" />
              <input type="text" placeholder="Search ID, user, subject..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="cmp-table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Ticket ID</th>
                <th>Franchise</th>
                <th>Driver / User</th>
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
                <tr><td colSpan={11} className="cmp-empty-row"><MessageSquare size={28} /><p>No complaints found.</p></td></tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={c.id}>
                    <td className="td-muted">{i + 1}</td>
                    <td><span className="cmp-id-badge">{c.ticketId}</span></td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', display: 'inline-block' }}>
                        {c.franchise}
                      </span>
                    </td>
                    <td>
                      <div className="cmp-user-cell">
                        <div className="cmp-avatar">{c.user.split(' ').map(n => n[0]).join('')}</div>
                        <div>
                          <span className="cell-main">{c.user}</span>
                          <span className="cell-sub">{c.email || c.phone}</span>
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
                      <span className={`badge badge-icon ${STATUS_CFG[c.status].cls}`}>
                        {STATUS_CFG[c.status].icon} {c.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" title="View & Reply" onClick={() => { setSelected(c); setReplyText(''); }}>
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                <span className={`badge badge-icon ${STATUS_CFG[selected.status].cls}`}>
                  {STATUS_CFG[selected.status].icon} {selected.status}
                </span>
                <button className="btn-icon" onClick={() => setSelected(null)}><X size={20} /></button>
              </div>
            </div>

            <div className="modal-body">
              <div className="cmp-subject-block">
                <h3>{selected.subject}</h3>
                <p className="cmp-description">{selected.description}</p>
              </div>

              <div className="cmp-info-grid">
                <div className="cmp-info-item"><Building2 size={13} /><span>Franchise</span><strong>{selected.franchise}</strong></div>
                <div className="cmp-info-item"><Car size={13} /><span>Vehicle No.</span><strong>{selected.vehicle}</strong></div>
                <div className="cmp-info-item"><User size={13} /><span>User</span><strong>{selected.user}</strong></div>
                <div className="cmp-info-item"><Calendar size={13} /><span>Date</span><strong>{selected.date}</strong></div>
                <div className="cmp-info-item"><MessageSquare size={13} /><span>Category</span><strong>{selected.category}</strong></div>
                <div className="cmp-info-item"><span>Booking ID</span><strong>{selected.bookingId}</strong></div>
                <div className="cmp-info-item"><span>Phone</span><strong>{selected.phone}</strong></div>
                <div className="cmp-info-item"><span>Email</span><strong>{selected.email}</strong></div>
              </div>

              <div className="cmp-status-row">
                <span className="cmp-status-label">Update Status:</span>
                <div className="cmp-status-btns">
                  {TABS.filter(t => t !== 'All' && t !== 'Active').map(s => (
                    <button key={s}
                      className={`cmp-status-btn ${selected.status === s ? 'active-status' : ''}`}
                      onClick={() => handleStatusChange(selected.id, s)}>
                      {STATUS_CFG[s].icon} {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cmp-thread">
                <div className="cmp-thread-title">Conversation History</div>
                <div className="cmp-replies">
                  <div className="cmp-reply user-reply">
                    <div className="cmp-reply-header">
                      <span className="cmp-reply-by">{selected.user} (Customer)</span>
                      <span className="cmp-reply-time">{selected.date}</span>
                    </div>
                    <p className="cmp-reply-msg">{selected.description}</p>
                  </div>
                  {selected.replies.map((r, i) => (
                    <div key={i} className="cmp-reply admin-reply">
                      <div className="cmp-reply-header">
                        <span className="cmp-reply-by">{r.by} (Support)</span>
                        <span className="cmp-reply-time">{r.time}</span>
                      </div>
                      <p className="cmp-reply-msg">{r.msg}</p>
                    </div>
                  ))}
                </div>

                {selected.status !== 'Closed' && selected.status !== 'Resolved' && (
                  <div className="cmp-reply-input">
                    <textarea
                      rows={3}
                      placeholder="Type your response or resolution notes here..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                    />
                    <button className="btn btn-primary cmp-send-btn" onClick={handleReply} disabled={submitting}>
                      {submitting ? <Loader2 className="spinner" size={15} /> : <><Send size={15} /> Save & Reply</>}
                    </button>
                  </div>
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

export default Complaints;
