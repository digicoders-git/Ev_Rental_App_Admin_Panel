import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Receipt, Download, Loader2, IndianRupee, X, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getSettlements, generateSettlement, getAllStores, getAllWithdrawalsAdmin } from '../services/apiServices';
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
      const [setRes, franRes, wdRes] = await Promise.all([
        getSettlements(),
        getAllStores(),
        getAllWithdrawalsAdmin()
      ]);
      // Merge both settlements and withdrawal records for a unified view
      const settlementsData = setRes.data.data || [];
      const withdrawalsData = wdRes.data.data || [];
      // Attach withdrawal data to matching settlements or show withdrawals separately
      setSettlements([
        ...settlementsData,
        ...withdrawalsData.map(w => ({ ...w, _type: 'withdrawal' }))
      ]);
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

  const printBill = (s) => {
    const win = window.open('', '_blank', 'width=800,height=600');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Settlement Bill - ${s.settlement_id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #0f172a; font-size: 14px; }
          .header { text-align: center; margin-bottom: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
          .header h1 { font-size: 22px; color: #0f172a; margin-bottom: 4px; }
          .header p { color: #64748b; font-size: 13px; }
          .parties { display: flex; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
          .party h4 { font-size: 13px; color: #334155; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          .party p { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
          .party span { font-size: 12px; color: #64748b; }
          .party-right { text-align: right; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { padding: 10px 8px; border-bottom: 2px solid #e2e8f0; text-align: left; color: #475569; font-size: 13px; }
          th:last-child { text-align: right; }
          td { padding: 12px 8px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          td:last-child { text-align: right; font-weight: 600; white-space: nowrap; }
          .deduction { color: #ef4444; }
          .total td { font-size: 16px; font-weight: 700; border-top: 2px solid #e2e8f0; border-bottom: none; }
          .total td:last-child { color: #10b981; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; color: #64748b; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #dcfce7; color: #15803d; }
          .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
          @media print {
            body { padding: 24px; }
            @page { margin: 10mm; size: A4; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Tris Electric</h1>
          <p>B2B Settlement Invoice</p>
        </div>
        <div class="meta">
          <span><strong>Bill No:</strong> ${s.settlement_id}</span>
          <span><strong>Date:</strong> ${new Date(s.createdAt || s.date_to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <span><strong>Status:</strong> <span class="status">${(s.status || 'pending').toUpperCase()}</span></span>
        </div>
        <div class="parties">
          <div class="party">
            <h4>Platform (Sender)</h4>
            <p>Tris Electric</p>
            <span>Commission: ${s.platform_fee_percentage}%</span>
          </div>
          <div class="party party-right">
            <h4>Franchisee (Receiver)</h4>
            <p>${s.franchise?.store_name || '—'}</p>
            <span>${s.franchise?.owner_name || ''}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Rider Collections (Platform Gateway)</td>
              <td>&#8377;${s.total_collected.toLocaleString('en-IN')}</td>
            </tr>
            <tr class="deduction">
              <td>Platform Commission (${s.platform_fee_percentage}%)</td>
              <td>- &#8377;${s.commission_deducted.toLocaleString('en-IN')}</td>
            </tr>
            <tr class="total">
              <td>Final Payout to Franchise</td>
              <td>&#8377;${s.final_payout.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>
        ${s.admin_note ? `<p style="font-size:13px;color:#64748b;margin-bottom:16px"><strong>Note:</strong> ${s.admin_note}</p>` : ''}
        <div class="footer">Computer generated B2B Settlement Invoice &bull; Tris Electric</div>
        <script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }<\/script>
      </body>
      </html>
    `);
    win.document.close();
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
          <p style={{ margin: 0, color: '#64748b' }}>Manage payouts and commission deductions between Tris Electric and Franchisees.</p>
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
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Franchisee</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Date &amp; Time</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Gross Amount</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Service Fee (8%)</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Net Payout</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Note</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Payment Proof</th>
                <th style={{ padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => {
                const isWithdrawal = s._type === 'withdrawal';
                const franchiseName = isWithdrawal
                  ? (s.franchise?.store_name || s.store?.store_name || '—')
                  : (s.franchise?.store_name || '—');
                const amount = isWithdrawal ? s.amount : s.final_payout;
                const status = s.status || 'pending';
                const note = s.admin_note || s.note || s.remarks || '—';
                const date = new Date(s.createdAt || s.date_to);
                const statusColor = status === 'approved' || status === 'paid' || status === 'completed'
                  ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b';
                const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
                const proof = s.payment_proof;

                return (
                  <tr key={s._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {franchiseName}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                      <div>{date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div style={{ color: '#94a3b8' }}>{date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#3b82f6', fontSize: '0.95rem' }}>
                      ₹{(amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#ef4444', fontSize: '0.95rem' }}>
                      ₹{Number((amount * 0.08).toFixed(2)).toLocaleString('en-IN')}
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>8% deduction</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#10b981', fontSize: '1rem' }}>
                      ₹{Number((amount * 0.92).toFixed(2)).toLocaleString('en-IN')}
                      <div style={{ fontSize: '11px', color: '#166534', fontWeight: 400 }}>actual payout</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: `${statusColor}15`, color: statusColor, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                        {status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', maxWidth: '180px', fontSize: '13px' }}>{note}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {proof ? (
                        <a href={`${BASE_URL}/${proof.replace(/\\/g, '/').replace(/^\/+/, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ color: '#3b82f6', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600, fontSize: '0.82rem', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px' }}>
                          <FileText size={14} /> View Proof
                        </a>
                      ) : <span style={{ color: '#cbd5e1', fontSize: '13px' }}>Not uploaded</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {!isWithdrawal && (
                        <button className="btn-icon" onClick={() => setSelectedSettlement(s)} title="View Settlement Bill"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1' }}>
                          <Receipt size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {settlements.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                    No settlements found.
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
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }} onClick={() => setSelectedSettlement(null)}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '680px', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} style={{ color: '#3b82f6' }} />
                <span style={{ fontWeight: 600 }}>Settlement Bill: {selectedSettlement.settlement_id}</span>
              </div>
              <button onClick={() => setSelectedSettlement(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px 32px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>Tris Electric</h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>B2B Settlement Invoice</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>Platform (Sender):</h4>
                  <p style={{ margin: 0, fontWeight: 500 }}>Tris Electric</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Commission Deducted: {selectedSettlement.platform_fee_percentage}%</p>
                </div>
                <div style={{ textAlign: 'right', minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#334155' }}>Franchisee (Receiver):</h4>
                  <p style={{ margin: 0, fontWeight: 500 }}>{selectedSettlement.franchise?.store_name}</p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{selectedSettlement.franchise?.owner_name}</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 0', color: '#475569', width: '70%' }}>Description</th>
                    <th style={{ padding: '8px 0', textAlign: 'right', color: '#475569', width: '30%' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 0', wordBreak: 'break-word' }}>Total Rider Collections (Platform Gateway)</td>
                    <td style={{ padding: '12px 0', textAlign: 'right', whiteSpace: 'nowrap' }}>₹{selectedSettlement.total_collected.toLocaleString()}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#ef4444' }}>
                    <td style={{ padding: '12px 0', wordBreak: 'break-word' }}>Platform Commission ({selectedSettlement.platform_fee_percentage}%)</td>
                    <td style={{ padding: '12px 0', textAlign: 'right', whiteSpace: 'nowrap' }}>- ₹{selectedSettlement.commission_deducted.toLocaleString()}</td>
                  </tr>
                  <tr style={{ fontWeight: 600, fontSize: '16px' }}>
                    <td style={{ padding: '12px 0' }}>Final Payout to Franchise</td>
                    <td style={{ padding: '12px 0', textAlign: 'right', color: '#10b981', whiteSpace: 'nowrap' }}>₹{selectedSettlement.final_payout.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ textAlign: 'center', marginTop: '32px', color: '#94a3b8', fontSize: '12px' }}>
                Computer generated B2B Settlement Invoice.
              </div>
            </div>
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => printBill(selectedSettlement)} style={{ padding: '8px 16px', borderRadius: '6px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
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
