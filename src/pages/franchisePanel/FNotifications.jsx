import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader, Eye, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { getNotifications, markRead, markAllRead } from '../../services/apiServices';
import useApi from '../../services/useApi';

const FNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState(null);
  const { loading, call } = useApi();

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = () => {
    call(() => getNotifications(), (res) => {
      setNotifications(res.notifications || res.data || []);
    });
  };

  const handleMarkRead = (id) => {
    call(() => markRead(id), () => {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
    });
  };

  const handleMarkAllRead = () => {
    call(() => markAllRead(), () => {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    });
  };

  const unread = notifications.filter(n => !n.is_read).length;
  const typeIcon = (type) => {
    const map = { booking: '📋', payment: '💰', kyc: '🪪', system: '⚙️', general: '🔔' };
    return map[type] || '🔔';
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-outline" onClick={handleMarkAllRead} disabled={loading}>
            <CheckCheck size={16} /> Mark All Read
          </button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><Loader size={32} className="spinner" color="var(--primary)" /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <Bell size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <div key={n._id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem 1.5rem',
                  borderBottom: i < notifications.length - 1 ? '1px solid var(--border-light)' : 'none',
                  background: n.is_read ? 'transparent' : '#f0fdf4',
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                onClick={() => { setSelected(n); if (!n.is_read) handleMarkRead(n._id); }}>
                <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{typeIcon(n.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ fontWeight: n.is_read ? 400 : 700, fontSize: '0.9rem', color: 'var(--text)' }}>{n.title || 'Notification'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {new Date(n.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '6px' }}>
                    <span className={`badge ${n.is_read ? 'badge-secondary' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                      {n.is_read ? 'Read' : 'New'}
                    </span>
                    {n.type && <span className="badge badge-info" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{n.type}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Notification Detail Modal */}
      {selected && createPortal(
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>{typeIcon(selected.type)}</span>
                <h3 style={{ margin: 0 }}>{selected.title || 'Notification'}</h3>
              </div>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{selected.message}</p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{selected.type || 'General'}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(selected.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
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

export default FNotifications;
