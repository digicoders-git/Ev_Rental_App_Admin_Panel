import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getDamageReports, updateDamageReportStatus } from '../services/apiServices';
import { AlertTriangle, Eye, CheckCircle, X, ExternalLink } from 'lucide-react';

const DamageReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await getDamageReports();
      setReports(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const notesInput = document.getElementById('adminNotesInput');
      const admin_notes = notesInput ? notesInput.value : undefined;
      
      await updateDamageReportStatus(id, { status, admin_notes });
      fetchReports();
      if (selectedReport) setSelectedReport(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <div>
          <h1>Damage Reports</h1>
          <p>Review and manage vehicle damage reports from customers.</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r._id}>
                    <td><strong>{r.report_id}</strong></td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>{r.user?.name || 'N/A'}</td>
                    <td>{r.vehicle?.vehicle_name || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${r.status}`}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline" onClick={() => setSelectedReport(r)}>
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan="6" style={{textAlign:'center'}}>No damage reports found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {selectedReport && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Damage Report: {selectedReport.report_id}</h3>
              <button className="btn-icon" onClick={() => setSelectedReport(null)}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <p className="text-muted" style={{fontSize:'12px', marginBottom: '4px'}}>Customer</p>
                  <p style={{ margin: 0 }}><strong>{selectedReport.user?.name || 'Customer'}</strong><br/>{selectedReport.user?.mobile || 'No Number'}</p>
                </div>
                <div>
                  <p className="text-muted" style={{fontSize:'12px', marginBottom: '4px'}}>Vehicle</p>
                  <p style={{ margin: 0 }}><strong>{selectedReport.vehicle?.vehicle_name || 'N/A'}</strong><br/>{selectedReport.vehicle?.registration_number}</p>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <p className="text-muted" style={{fontSize:'12px', marginBottom: '4px'}}>Description</p>
                <p style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                  {selectedReport.description || 'No description provided by the customer.'}
                </p>
              </div>
              
              <p className="text-muted" style={{fontSize:'12px', marginBottom: '8px'}}>Photos</p>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                {selectedReport.photos && selectedReport.photos.length > 0 ? (
                  selectedReport.photos.map((photo, i) => (
                    <a key={i} href={`http://localhost:5000${photo}`} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}>
                      <img src={`http://localhost:5000${photo}`} alt="Damage" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'block' }} />
                    </a>
                  ))
                ) : (
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>No photos uploaded.</p>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              {/* Admin Reply Section */}
              <div style={{ marginBottom: '1rem' }}>
                <p className="text-muted" style={{fontSize:'12px', marginBottom: '4px'}}>Admin Reply / Notes</p>
                {selectedReport.status !== 'pending' && selectedReport.admin_notes ? (
                  <p style={{ background: '#e0f2fe', padding: '12px', borderRadius: '8px', margin: 0, fontSize: '14px', lineHeight: '1.5', borderLeft: '4px solid #3b82f6' }}>
                    {selectedReport.admin_notes}
                  </p>
                ) : (
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Write a reply to the customer..."
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    id="adminNotesInput"
                    defaultValue={selectedReport.admin_notes || ''}
                  ></textarea>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                {selectedReport.status === 'pending' && (
                  <button className="btn btn-primary" onClick={() => handleUpdateStatus(selectedReport._id, 'reviewed')}>
                    Mark as Reviewed
                  </button>
                )}
                {selectedReport.status === 'reviewed' && (
                  <button className="btn btn-primary" onClick={() => handleUpdateStatus(selectedReport._id, 'resolved')}>
                    <CheckCircle size={16}/> Mark as Resolved
                  </button>
                )}
                <button className="btn btn-outline" onClick={() => setSelectedReport(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DamageReports;
