import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Headphones, Search, Loader, AlertTriangle, X, CheckCircle } from 'lucide-react';
import { getFranchiseBookings } from '../../services/apiServices';
import useApi from '../../services/useApi';
import api from '../../services/api';

const FComplaints = () => {
  const [form, setForm] = useState({ subject: '', message: '', category: 'booking' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // Franchise users submit complaints through support. Since support uses `protect` (user token)
      // we send it through the generic support endpoint using the franchise token.
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
      <div className="page-header">
        <div>
          <h1>Complaints & Support</h1>
          <p>Raise a support ticket or report an issue to the admin team.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Submit Ticket */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{ background: '#dbeafe', color: '#1e40af', padding: '10px', borderRadius: '10px' }}>
              <Headphones size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Raise a Ticket</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Our team will respond within 24 hours</p>
            </div>
          </div>

          {success ? (
            <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
              <CheckCircle size={40} color="#10b981" style={{ marginBottom: '0.75rem' }} />
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
                    placeholder="Describe the problem in detail... Include booking ID if relevant."
                    rows={5}
                    style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <><Loader size={16} className="spinner" /> Submitting...</> : <><Headphones size={16} /> Submit Complaint</>}
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
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}>
              📞 Support: 1800-XXX-XXXX (Toll Free)
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

          <div className="card" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
            <h3 style={{ color: '#92400e', margin: '0 0 0.5rem' }}>⏱️ Response Time</h3>
            <p style={{ color: '#78350f', margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>
              High priority: Within 4 hours<br />
              Normal: Within 24 hours<br />
              General enquiries: 2–3 business days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FComplaints;
