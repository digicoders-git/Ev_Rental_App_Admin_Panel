import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, ShieldX, Clock, Eye, Loader, X, Upload, Plus, FileText, CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { updateKycStatus, getAllUsers, getAllKyc, submitKyc } from '../../services/apiServices';
import useApi from '../../services/useApi';

const FKYC = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  
  // Upload KYC states
  const [showUploadKyc, setShowUploadKyc] = useState(false);
  const [selectedCustomerForUpload, setSelectedCustomerForUpload] = useState(null);
  
  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    name: '',
    mobileNumber: '',
    aadharFront: null,
    aadharBack: null,
    panCard: null,
    selfie: null
  });

  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (selectedCustomerForUpload) {
      setUploadForm({
        name: selectedCustomerForUpload.name || '',
        mobileNumber: selectedCustomerForUpload.mobile || '',
        aadharFront: null,
        aadharBack: null,
        panCard: null,
        selfie: null
      });
    }
  }, [selectedCustomerForUpload]);

  const { loading, call } = useApi();
  const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
  const FALLBACK_URL = 'https://ev-rental-app-backend.onrender.com';

  const fetchData = () => {
    call(
      async () => {
        const [usersRes, kycRes] = await Promise.all([
          getAllUsers(),
          getAllKyc()
        ]);
        return { 
          data: {
            users: usersRes.data?.data || usersRes.data || [], 
            kycList: kycRes.data?.data || kycRes.data || [] 
          }
        };
      },
      ({ users, kycList }) => {
        const allRiders = Array.isArray(users) ? users : [];
        const allKycDocs = Array.isArray(kycList) ? kycList : [];

        // Map KYC documents by user ID
        const kycUserMap = {};
        allKycDocs.forEach(k => {
          if (k.user) {
            const uid = typeof k.user === 'object' ? k.user._id : k.user;
            kycUserMap[uid] = k;
          }
        });

        // Combine all riders with their KYC document data
        const customerList = allRiders.map(u => ({
          ...u,
          kyc: kycUserMap[u._id] || null
        }));

        setCustomers(customerList);
      }
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateKyc = (kycId, status, rejectionReason = '') => {
    call(() => updateKycStatus(kycId, { status, rejectionReason }), () => {
      alert(`KYC status updated successfully to ${status}! 🎉`);
      setSelected(null);
      fetchData();
    }, (err) => alert(`Error updating KYC status: ${err}`));
  };

  const handleUploadKycSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    const { name, mobileNumber, aadharFront, aadharBack, panCard, selfie } = uploadForm;

    if (!name || !mobileNumber || !aadharFront || !aadharBack || !panCard || !selfie) {
      setFormError('Name, mobile number, and all 4 documents are required.');
      return;
    }

    const formData = new FormData();
    formData.append('userId', selectedCustomerForUpload._id);
    formData.append('name', name);
    formData.append('mobileNumber', mobileNumber);
    formData.append('aadharFront', aadharFront);
    formData.append('aadharBack', aadharBack);
    formData.append('panCard', panCard);
    formData.append('selfie', selfie);

    call(() => submitKyc(formData), () => {
      setSuccessMsg('KYC documents submitted successfully! 🎉');
      fetchData();
      setUploadForm({
        name: '',
        mobileNumber: '',
        aadharFront: null,
        aadharBack: null,
        panCard: null,
        selfie: null
      });
      setTimeout(() => {
        setShowUploadKyc(false);
        setSelectedCustomerForUpload(null);
        setSuccessMsg('');
      }, 1500);
    }, (err) => {
      setFormError(err || 'Failed to submit KYC documents.');
    });
  };

  const filtered = customers.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.mobile || '').includes(search)
  );

  const getKycBadge = (c) => {
    if (c.isKycVerified && !c.kyc) {
      return { cls: 'badge-success', label: 'Approved', icon: <ShieldCheck size={12} /> };
    }
    
    if (!c.kyc) return { cls: 'badge-warning', label: 'Not Submitted', icon: <Clock size={12} /> };
    
    const map = {
      approved: { cls: 'badge-success', label: 'Approved', icon: <ShieldCheck size={12} /> },
      rejected: { cls: 'badge-danger', label: 'Rejected', icon: <ShieldX size={12} /> },
      pending: { cls: 'badge-warning', label: 'Pending', icon: <Clock size={12} /> },
    };
    return map[c.kyc.status] || { cls: 'badge-warning', label: 'Unknown', icon: <Clock size={12} /> };
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>KYC Status</h1>
          <p>View, verify, and upload KYC status of all customers.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Customers', value: customers.length, color: 'var(--primary)' },
          { label: 'KYC Approved', value: customers.filter(c => c.isKycVerified || c.kyc?.status === 'approved').length, color: '#10b981' },
          { label: 'Pending/Not Submitted', value: customers.filter(c => !c.isKycVerified && (!c.kyc || c.kyc.status === 'pending')).length, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ color: s.color, margin: 0 }}>{s.value}</h2>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3>Customer KYC List</h3>
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
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>KYC Status</th>
                  <th>KYC Document</th>
                  <th>Submitted On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No customers found.
                  </td></tr>
                ) : filtered.map(c => {
                  const badge = getKycBadge(c);
                  return (
                    <tr key={c._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.name || 'N/A'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.email || 'No email'}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{c.mobile || 'N/A'}</td>
                      <td>
                        <span className={`badge ${badge.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {badge.icon} {badge.label}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {(c.kyc?.document || c.kyc?.aadharFront) ? <span className="badge badge-success">Uploaded</span> : <span className="badge badge-warning">Missing</span>}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {c.kyc?.createdAt ? new Date(c.kyc.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {c.kyc ? (
                            <button className="btn-icon" title="View & Verify KYC" onClick={() => setSelected(c)}>
                              <Eye size={16} />
                            </button>
                          ) : (
                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => { setSelectedCustomerForUpload(c); setShowUploadKyc(true); }}>
                              <Upload size={12} /> Upload KYC
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload KYC Modal (For Offline Customer) */}
      {showUploadKyc && selectedCustomerForUpload && createPortal(
        <div className="modal-overlay" onClick={() => { setShowUploadKyc(false); setSelectedCustomerForUpload(null); }}>
          <div className="modal-content" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Upload Customer KYC</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>For: {selectedCustomerForUpload.name} ({selectedCustomerForUpload.mobile})</p>
              </div>
              <button className="btn-icon" onClick={() => { setShowUploadKyc(false); setSelectedCustomerForUpload(null); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUploadKycSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
                {formError && <div style={{ color: '#ef4444', background: '#fee2e2', padding: '0.625rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500 }}>{formError}</div>}
                {successMsg && <div style={{ color: '#047857', background: '#d1fae5', padding: '0.625rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16} />{successMsg}</div>}

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem' }}>
                  <FileText size={14} /> Document Information
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Customer Name *</label>
                    <input type="text" required placeholder="Full Name" value={uploadForm.name} onChange={e => setUploadForm(p => ({ ...p, name: e.target.value }))}
                      style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Mobile Number *</label>
                    <input type="text" required placeholder="10-digit Mobile Number" value={uploadForm.mobileNumber} onChange={e => setUploadForm(p => ({ ...p, mobileNumber: e.target.value }))}
                      style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', background: 'var(--surface)' }} />
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '0.35rem', marginTop: '0.5rem' }}>
                  <Upload size={14} /> Upload KYC Documents (All 4 Required)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Aadhar Front *</label>
                    <input type="file" required accept="image/*" onChange={e => setUploadForm(p => ({ ...p, aadharFront: e.target.files[0] }))}
                      style={{ width: '100%', fontSize: '0.8rem' }} />
                    {uploadForm.aadharFront && (
                      <img src={URL.createObjectURL(uploadForm.aadharFront)} alt="Aadhar Front Preview"
                        style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', marginTop: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Aadhar Back *</label>
                    <input type="file" required accept="image/*" onChange={e => setUploadForm(p => ({ ...p, aadharBack: e.target.files[0] }))}
                      style={{ width: '100%', fontSize: '0.8rem' }} />
                    {uploadForm.aadharBack && (
                      <img src={URL.createObjectURL(uploadForm.aadharBack)} alt="Aadhar Back Preview"
                        style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', marginTop: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>PAN Card *</label>
                    <input type="file" required accept="image/*" onChange={e => setUploadForm(p => ({ ...p, panCard: e.target.files[0] }))}
                      style={{ width: '100%', fontSize: '0.8rem' }} />
                    {uploadForm.panCard && (
                      <img src={URL.createObjectURL(uploadForm.panCard)} alt="PAN Card Preview"
                        style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', marginTop: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Selfie *</label>
                    <input type="file" required accept="image/*" onChange={e => setUploadForm(p => ({ ...p, selfie: e.target.files[0] }))}
                      style={{ width: '100%', fontSize: '0.8rem' }} />
                    {uploadForm.selfie && (
                      <img src={URL.createObjectURL(uploadForm.selfie)} alt="Selfie Preview"
                        style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', marginTop: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => { setShowUploadKyc(false); setSelectedCustomerForUpload(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <Loader size={16} className="spinner" /> : 'Submit KYC'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* KYC Documents Modal */}
      {selected && createPortal(
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>KYC Documents — {selected.name}</h3>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              
              {/* Render document details */}
              <div style={{ background: 'var(--background)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 0.8 + 'rem', color: 'var(--text-secondary)', fontWeight: 500 }}>KYC Name</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>{selected.kyc?.name || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 0.8 + 'rem', color: 'var(--text-secondary)', fontWeight: 500 }}>KYC Mobile</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>{selected.kyc?.mobileNumber || 'N/A'}</div>
                </div>
              </div>

              {selected.kyc?.document ? (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>KYC Document</div>
                  <img 
                    src={`${BASE_URL}/${selected.kyc.document}`} 
                    alt="KYC Document"
                    style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)' }} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `${FALLBACK_URL}/${selected.kyc.document}`;
                    }}
                  />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  {selected.kyc?.aadharFront && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Aadhar Front</div>
                      <img 
                        src={`${BASE_URL}/${selected.kyc.aadharFront}`} 
                        alt="Aadhar Front"
                        style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)' }} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${FALLBACK_URL}/${selected.kyc.aadharFront}`;
                        }}
                      />
                    </div>
                  )}
                  {selected.kyc?.aadharBack && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Aadhar Back</div>
                      <img 
                        src={`${BASE_URL}/${selected.kyc.aadharBack}`} 
                        alt="Aadhar Back"
                        style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)' }} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${FALLBACK_URL}/${selected.kyc.aadharBack}`;
                        }}
                      />
                    </div>
                  )}
                  {selected.kyc?.panCard && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>PAN Card</div>
                      <img 
                        src={`${BASE_URL}/${selected.kyc.panCard}`} 
                        alt="PAN Card"
                        style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)' }} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${FALLBACK_URL}/${selected.kyc.panCard}`;
                        }}
                      />
                    </div>
                  )}
                  {selected.kyc?.selfie && (
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Selfie</div>
                      <img 
                        src={`${BASE_URL}/${selected.kyc.selfie}`} 
                        alt="Selfie"
                        style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)' }} 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${FALLBACK_URL}/${selected.kyc.selfie}`;
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              {selected.kyc?.remarks && (
                <div style={{ background: '#fef3c7', padding: '0.75rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                  <strong>Remarks:</strong> {selected.kyc.remarks}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selected.kyc?.status !== 'approved' && (
                  <button className="btn" style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => handleUpdateKyc(selected.kyc._id, 'approved')}>
                    Approve KYC
                  </button>
                )}
                {selected.kyc?.status !== 'rejected' && (
                  <button className="btn" style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => {
                      const reason = prompt("Enter rejection reason:");
                      if (reason !== null) handleUpdateKyc(selected.kyc._id, 'rejected', reason);
                    }}>
                    Reject KYC
                  </button>
                )}
              </div>
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FKYC;
