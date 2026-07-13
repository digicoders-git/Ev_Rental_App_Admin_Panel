import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Receipt, Download, Loader2, IndianRupee, X } from 'lucide-react';
import { getSettlements, generateSettlement, getAllStores } from '../services/apiServices';
import useApi from '../services/useApi';

const Settlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({ franchiseId: '', dateFrom: '', dateTo: '' });
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [setRes, franRes] = await Promise.all([
        getSettlements(),
        getAllStores() // Need stores for dropdown
      ]);
      setSettlements(setRes.data.data || []);
      setFranchises(franRes.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setGenerating(true);
      await generateSettlement(formData);
      setShowGenerateModal(false);
      fetchData(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate settlement');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="cp-page-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: '#64748b' }}>
        <Loader2 className="spinner" size={40} />
        <p>Loading settlements...</p>
      </div>
    );
  }

  return (
    <div className="content-page" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', margin: '0 0 8px 0', color: '#0f172a' }}>Settlements (B2B Bills)</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Manage payouts and commission deductions between Super Admin and Franchisees.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowGenerateModal(true)}>
          Generate Settlement
        </button>
      </div>

      <div className="card table-card" style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Settlement ID</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Franchise</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Period</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Total Collected</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Commission (8%)</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Final Payout</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => (
                <tr key={s._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#3b82f6' }}>{s.settlement_id}</td>
                  <td style={{ padding: '12px 16px' }}>{s.franchise?.store_name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {new Date(s.date_from).toLocaleDateString()} - {new Date(s.date_to).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>₹{s.total_collected.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', color: '#ef4444' }}>-₹{s.commission_deducted.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#10b981' }}>₹{s.final_payout.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-success" style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: '#dcfce7', color: '#16a34a' }}>
                      {s.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button className="btn-icon" onClick={() => setSelectedSettlement(s)} title="View Settlement Bill" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1' }}>
                      <Receipt size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {settlements.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No settlements found. Generate one to see it here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && createPortal(
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-content" style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Generate Settlement</h3>
            <form onSubmit={handleGenerate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Select Franchise</label>
                <select required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  value={formData.franchiseId} onChange={e => setFormData({ ...formData, franchiseId: e.target.value })}>
                  <option value="">-- Choose Franchise --</option>
                  {franchises.map(f => (
                    <option key={f._id} value={f._id}>{f.store_name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Date From</label>
                <input type="date" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  value={formData.dateFrom} onChange={e => setFormData({ ...formData, dateFrom: e.target.value })} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Date To</label>
                <input type="date" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  value={formData.dateTo} onChange={e => setFormData({ ...formData, dateTo: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowGenerateModal(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={generating} style={{ padding: '8px 16px', borderRadius: '6px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {generating ? <Loader2 size={16} className="spinner" /> : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Settlement Bill Modal */}
      {selectedSettlement && createPortal(
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setSelectedSettlement(null)}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} style={{ color: '#3b82f6' }} />
                <span style={{ fontWeight: 600 }}>Settlement Bill: {selectedSettlement.settlement_id}</span>
              </div>
              <button onClick={() => setSelectedSettlement(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>EV Rental Platform</h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>B2B Settlement Invoice</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>Platform (Sender):</h4>
                  <p style={{ margin: 0, fontWeight: 500 }}>EV Super Admin HQ</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Commission Deducted: {selectedSettlement.platform_fee_percentage}%</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>Franchisee (Receiver):</h4>
                  <p style={{ margin: 0, fontWeight: 500 }}>{selectedSettlement.franchise?.store_name}</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{selectedSettlement.franchise?.owner_name}</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 0', color: '#475569' }}>Description</th>
                    <th style={{ padding: '8px 0', textAlign: 'right', color: '#475569' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 0' }}>Total Rider Collections (Platform Gateway)</td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>₹{selectedSettlement.total_collected.toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#ef4444' }}>
                    <td style={{ padding: '12px 0' }}>Platform Commission ({selectedSettlement.platform_fee_percentage}%)</td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>- ₹{selectedSettlement.commission_deducted.toLocaleString()}</td>
                  </tr>
                  <tr style={{ fontWeight: 600, fontSize: '16px' }}>
                    <td style={{ padding: '12px 0' }}>Final Payout to Franchise</td>
                    <td style={{ padding: '12px 0', textAlign: 'right', color: '#10b981' }}>₹{selectedSettlement.final_payout.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ textAlign: 'center', marginTop: '32px', color: '#94a3b8', fontSize: '12px' }}>
                Computer generated B2B Settlement Invoice.
              </div>
            </div>
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => window.print()} style={{ padding: '8px 16px', borderRadius: '6px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Download size={16} /> Print Bill
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Settlements;
