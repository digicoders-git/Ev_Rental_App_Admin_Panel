import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getFranchiseWallet, requestWithdrawal, getFranchiseWithdrawals, getFranchiseProfile } from '../../services/apiServices';
import { Wallet, ArrowUpRight, ArrowDownRight, IndianRupee, FileText, CheckCircle, Clock, XCircle, Download, FileSignature, X } from 'lucide-react';

const FWallet = () => {
  const [wallet, setWallet] = useState({ balance: 0, totalRevenue: 0, totalWithdrawn: 0, pendingWithdrawn: 0, transactions: [] });
  const [withdrawals, setWithdrawals] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wRes, wdRes, pRes] = await Promise.all([
        getFranchiseWallet(),
        getFranchiseWithdrawals(),
        getFranchiseProfile()
      ]);
      setWallet(wRes.data.data);
      setWithdrawals(wdRes.data.data);
      setProfile(pRes.data.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) return alert('Enter valid amount');
    if (Number(withdrawAmount) > wallet.balance) return alert('Insufficient balance');
    
    try {
      setSubmitting(true);
      await requestWithdrawal({ amount: Number(withdrawAmount) });
      alert('Withdrawal request submitted successfully');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to request withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved': return { color: '#10b981', icon: <CheckCircle size={14} />, label: 'Approved' };
      case 'rejected': return { color: '#ef4444', icon: <XCircle size={14} />, label: 'Rejected' };
      default: return { color: '#f59e0b', icon: <Clock size={14} />, label: 'Pending' };
    }
  };

  if (loading) return <div className="page-container"><p>Loading Wallet...</p></div>;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Wallet & Earnings</h1>
          <p className="page-subtitle">Track your earnings and manage withdrawals</p>
        </div>
        
        {/* Agreement Card */}
        {profile.agreement_document && (
          <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${profile.agreement_document}`} target="_blank" rel="noopener noreferrer" 
             style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e0e7ff', color: '#4338ca', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
            <FileSignature size={18} /> View Agreement
          </a>
        )}
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Available Balance (Main) */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '16px', padding: '1.5rem', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Available Balance</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '4px', color: '#fff' }}>
              ₹{wallet.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </h2>
          </div>
          <button onClick={() => setShowWithdrawModal(true)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem', transition: 'all 0.2s', marginTop: '1rem', width: '100%' }}>
            <ArrowUpRight size={18} /> Request Withdrawal
          </button>
        </div>

        {/* Total Revenue (Gross) */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Total Revenue</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#3b82f6' }}>
            ₹{(wallet.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h2>
        </div>

        {/* Service Fee */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Service Fee (8%)</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#ef4444' }}>
            ₹{(wallet.serviceFee || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h2>
        </div>

        {/* Net Revenue */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Net Revenue</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#8b5cf6' }}>
            ₹{(wallet.netRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h2>
        </div>

        {/* Total Withdrawn */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Total Withdrawn</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#10b981' }}>
            ₹{(wallet.totalWithdrawn || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h2>
        </div>

        {/* Pending Withdrawals */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.5rem 0' }}>Pending Withdrawals</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#f59e0b' }}>
            ₹{(wallet.pendingWithdrawn || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </h2>
        </div>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <button onClick={() => setActiveTab('transactions')} style={{ background: activeTab === 'transactions' ? 'var(--primary)' : 'transparent', color: activeTab === 'transactions' ? '#fff' : 'var(--text)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Earnings History</button>
        <button onClick={() => setActiveTab('withdrawals')} style={{ background: activeTab === 'withdrawals' ? 'var(--primary)' : 'transparent', color: activeTab === 'withdrawals' ? '#fff' : 'var(--text)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Withdrawal Requests</button>
      </div>

      {activeTab === 'transactions' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {wallet.transactions.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No transactions found</td></tr>
              ) : wallet.transactions.map(t => (
                <tr key={t._id}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{t.transaction_id}</td>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                  <td>{t.description}</td>
                  <td style={{ color: t.type === 'credit' ? '#10b981' : '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {t.type === 'credit' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                    ₹{t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Req ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Admin Note</th>
                <th>Payment Proof</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No withdrawal requests found</td></tr>
              ) : withdrawals.map(w => {
                const cfg = getStatusConfig(w.status);
                return (
                  <tr key={w._id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{w.withdrawal_id}</td>
                    <td>{new Date(w.createdAt).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>₹{w.amount.toLocaleString()}</td>
                    <td>
                      <span style={{ color: cfg.color, display: 'inline-flex', alignItems: 'center', gap: '4px', background: `${cfg.color}15`, padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td>{w.admin_note || '-'}</td>
                    <td>
                      {w.payment_proof ? (
                        <a href={`${BASE_URL}/${w.payment_proof.replace(/\\/g, '/').replace(/^\/+/, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '0.9rem' }}>
                          <FileText size={16} /> View Proof
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showWithdrawModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Withdrawal</h2>
              <button className="btn-icon" onClick={() => setShowWithdrawModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleWithdraw} className="modal-body">
              <div className="form-group">
                <label>Available Balance</label>
                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#10b981', marginBottom: '1rem' }}>
                  ₹{wallet.balance.toLocaleString()}
                </div>
              </div>
              <div className="form-group">
                <label>Amount to Withdraw (₹)</label>
                <input 
                  type="number" 
                  value={withdrawAmount} 
                  onChange={e => setWithdrawAmount(e.target.value)} 
                  max={wallet.balance}
                  required 
                  className="form-input" 
                  placeholder="Enter amount"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowWithdrawModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Request'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FWallet;
