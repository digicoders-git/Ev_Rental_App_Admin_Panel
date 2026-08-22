import { useState, useEffect, useRef } from 'react';
import {
  Send, Bell, History, CheckCheck, Loader2,
  Globe, Image as ImageIcon, X, Users, AlertCircle
} from 'lucide-react';
import { getNotifications, markAllRead, broadcastNotif, markRead, getBroadcastHistory } from '../services/apiServices';
import './Notifications.css';

const Notifications = () => {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [title, setTitle]       = useState('');
  const [message, setMessage]   = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending]   = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [view, setView]         = useState('Sent');
  const [markingAll, setMarkingAll] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, [view]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = view === 'Sent' ? await getBroadcastHistory() : await getNotifications();
      setHistory(data.data || data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (!title || !message) {
      alert('Title and message are required');
      return;
    }

    try {
      setSending(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('message', message);
      if (imageFile) formData.append('image', imageFile);

      const res = await broadcastNotif(formData);
      const count = res.data?.push_sent || 0;
      setSentCount(count);
      setSentSuccess(true);
      setTitle('');
      setMessage('');
      clearImage();
      fetchNotifications();
      setTimeout(() => setSentSuccess(false), 5000);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(error.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleMarkAll = async () => {
    try {
      setMarkingAll(true);
      await markAllRead();
      setHistory(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all read:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await markRead(id);
      setHistory(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Notifications Center</h1>
          <p>Broadcast alerts, offers, and system updates to all your users.</p>
        </div>
        {view === 'Received' && (
          <button
            className="btn btn-outline"
            onClick={handleMarkAll}
            disabled={markingAll || history.every(n => n.isRead)}
          >
            {markingAll ? <Loader2 size={16} className="spinner" /> : <CheckCheck size={16} />}
            Mark All Read
          </button>
        )}
      </div>

      <div className="notifications-grid">
        {/* ── Send Section ── */}
        <div className="card send-section">
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-icon-wrap primary"><Send size={18} /></div>
              <h3>Send New Broadcast</h3>
            </div>
          </div>

          <div className="card-body">
            {sentSuccess && (
              <div className="notif-success-banner">
                <CheckCheck size={18} />
                <span>
                  Broadcast sent! <strong>{sentCount} devices</strong> received push notification.
                </span>
              </div>
            )}

            <form className="notification-form" onSubmit={e => e.preventDefault()}>
              {/* Title */}
              <div className="form-group">
                <label>Notification Title</label>
                <div className="input-with-icon">
                  <Bell size={16} className="input-icon" />
                  <input
                    type="text"
                    placeholder="e.g. Weekend Flash Sale - 20% Off"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="form-group">
                <label>Message Content</label>
                <textarea
                  placeholder="Type your message here. Keep it concise and engaging..."
                  rows="4"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>



              <div className="form-info">
                <Users size={14} />
                <span>This notification will be delivered to all registered app users in real-time.</span>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={handleSend}
                disabled={sending || !title || !message}
              >
                {sending
                  ? <><Loader2 size={18} className="spinner" /> Sending...</>
                  : <><Send size={18} /> Send Broadcast Now</>
                }
              </button>
            </form>
          </div>
        </div>

        {/* ── History Section ── */}
        <div className="card history-section">
          <div className="card-header">
            <div className="card-title-group" style={{ width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="card-icon-wrap secondary"><History size={18} /></div>
                <h3>Recent History</h3>
              </div>
              <div className="view-tabs">
                <button className={`view-tab-btn ${view === 'Sent' ? 'active' : ''}`} onClick={() => setView('Sent')}>Sent</button>
                <button className={`view-tab-btn ${view === 'Received' ? 'active' : ''}`} onClick={() => setView('Received')}>Received</button>
              </div>
            </div>
          </div>

          <div className="history-list">
            {loading ? (
              <div className="loading-state">
                <Loader2 className="spinner" size={24} />
                <p>Fetching notifications...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="empty-state">
                <Bell size={32} />
                <p>No {view.toLowerCase()} notifications found.</p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item._id}
                  className={`history-item ${!item.isRead ? 'unread' : ''}`}
                  onClick={() => (view === 'Received' && !item.isRead) && handleMarkOne(item._id)}
                >
                  {/* Icon / type indicator */}
                  <div className="history-item-icon">
                    {item.type === 'broadcast' ? <Globe size={16} /> : <Bell size={16} />}
                  </div>

                  <div className="history-item-body">
                    <div className="history-item-header">
                      <h4>{item.title}</h4>
                      <span className="history-time">{formatDate(item.createdAt)}</span>
                    </div>
                    <p className="history-msg">{item.message}</p>

                    {/* Image preview in history */}
                    {item.image_url && (
                      <div className="history-item-image-wrap">
                        <img
                          src={item.image_url}
                          alt="Notification graphic"
                          className="history-item-image"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}

                    <div className="history-item-footer">
                      <span className="notif-type">
                        {view === 'Sent'
                          ? `Target: All Users (${item.recipient_count || 0} users)`
                          : `Type: ${item.type || 'System'}`
                        }
                      </span>
                      {view === 'Received' && !item.isRead && <span className="unread-dot">New</span>}
                      {item.image_url && (
                        <span className="notif-has-image">
                          <ImageIcon size={11} /> Image
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
