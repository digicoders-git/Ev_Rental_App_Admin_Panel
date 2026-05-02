import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, Upload, Eye, Trash2, Plus, Search, X,
  CheckCircle, Clock, AlertTriangle, XCircle,
  Car, Building2, User, Shield, Calendar,
  Download, RefreshCw, FileBadge, FileWarning, Loader2
} from 'lucide-react';
import { 
  getAllDocuments, 
  createDocument, 
  deleteDocument, 
  renewDocument,
  updateDocument
} from '../services/apiServices';
import './Documents.css';

const STATUS_CFG = {
  Valid:    { cls: 'badge-success', icon: <CheckCircle size={11} /> },
  Expiring: { cls: 'badge-warning', icon: <AlertTriangle size={11} /> },
  Expired:  { cls: 'badge-danger',  icon: <XCircle size={11} /> },
  Pending:  { cls: 'badge-info',    icon: <Clock size={11} /> },
};

const CAT_ICON = {
  Vehicle:   <Car size={14} />,
  Franchise: <Building2 size={14} />,
  User:      <User size={14} />,
};

const CATEGORIES = ['All', 'Vehicle', 'Franchise', 'User'];
const DOC_TYPES  = {
  Vehicle:   ['Insurance', 'PUC', 'RC Book', 'Fitness Certificate'],
  Franchise: ['Business License', 'GST Certificate', 'NOC', 'Trade License'],
  User:      ['Driving License', 'Aadhar Card', 'PAN Card', 'Passport'],
};

const emptyForm = {
  category: 'Vehicle', entity: '', entityId: '', type: 'Insurance',
  docNo: '', issueDate: '', expiryDate: '', file: null,
};

const Documents = () => {
  const [docs, setDocs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('All');
  const [search, setSearch]         = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const [viewDoc, setViewDoc]       = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const { data } = await getAllDocuments();
      setDocs(data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ── counts ── */
  const counts = {
    All:      docs.length,
    Vehicle:  docs.filter(d => d.category === 'Vehicle').length,
    Franchise:docs.filter(d => d.category === 'Franchise').length,
    User:     docs.filter(d => d.category === 'User').length,
  };
  const expiring = docs.filter(d => d.status === 'Expiring').length;
  const expired  = docs.filter(d => d.status === 'Expired').length;

  /* ── filter ── */
  const filtered = docs.filter(d => {
    const matchTab = activeTab === 'All' || d.category === activeTab;
    const q = search.toLowerCase();
    return matchTab && (
      (d.entity || '').toLowerCase().includes(q) ||
      (d.type || '').toLowerCase().includes(q)   ||
      (d.docNo || '').toLowerCase().includes(q)  ||
      (d.entityId || '').toLowerCase().includes(q)
    );
  });

  const handleFileChange = (e) => {
    setForm(prev => ({ ...prev, file: e.target.files[0] }));
  };

  const handleAdd = async () => {
    if (!form.entity || !form.entityId || !form.docNo || !form.expiryDate || (!form.file && !form.id)) {
      alert("Please fill all required fields marked with *");
      return;
    }
    
    try {
      setSubmitting(true);
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'file' && form[key]) {
          formData.append('file', form[key]);
        } else if (form[key] !== null && form[key] !== '') {
          formData.append(key, form[key]);
        }
      });

      await createDocument(formData);
      setShowAdd(false);
      setForm(emptyForm);
      fetchDocs();
    } catch (error) {
      console.error("Error uploading document:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to upload document");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setSubmitting(true);
      await deleteDocument(id);
      setDeleteId(null);
      fetchDocs();
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenew = async (id) => {
    try {
      setSubmitting(true);
      await renewDocument(id, {});
      setViewDoc(null);
      fetchDocs();
    } catch (error) {
      console.error("Error renewing document:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const daysUntilExpiry = dateStr => {
    if (!dateStr) return 0;
    const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
  };

  const getFileUrl = (path) => {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000/${path}`;
  };

  if (loading) {
    return (
      <div className="docs-page-loading">
        <Loader2 className="spinner" size={40} />
        <p>Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="docs-page">
      <div className="page-header">
        <div>
          <h1>Document Management</h1>
          <p>Manage all vehicle, franchise and user documents in one place.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
          <Plus size={17} /> Upload Document
        </button>
      </div>

      {/* Stats */}
      <div className="docs-stats">
        <div className="card docs-stat-card">
          <div className="docs-stat-icon total"><FileText size={19} /></div>
          <div><span className="docs-stat-label">Total Documents</span><h3>{docs.length}</h3></div>
        </div>
        <div className="card docs-stat-card">
          <div className="docs-stat-icon valid"><CheckCircle size={19} /></div>
          <div><span className="docs-stat-label">Valid</span><h3>{docs.filter(d => d.status === 'Valid').length}</h3></div>
        </div>
        <div className="card docs-stat-card" style={{ cursor: expiring ? 'pointer' : 'default' }}
          onClick={() => expiring && setActiveTab('All')}>
          <div className="docs-stat-icon expiring"><FileWarning size={19} /></div>
          <div><span className="docs-stat-label">Expiring Soon</span><h3>{expiring}</h3></div>
        </div>
        <div className="card docs-stat-card">
          <div className="docs-stat-icon expired"><XCircle size={19} /></div>
          <div><span className="docs-stat-label">Expired</span><h3>{expired}</h3></div>
        </div>
      </div>

      {/* Expiry Alerts */}
      {(expiring > 0 || expired > 0) && (
        <div className="docs-alerts">
          {docs.filter(d => d.status === 'Expired').map(d => (
            <div key={d._id} className="docs-alert expired-alert">
              <XCircle size={15} />
              <span><strong>{d.entity}</strong> — {d.type} (<span className="mono">{d.docNo}</span>) has <strong>expired</strong>.</span>
              <button className="alert-renew-btn" onClick={() => handleRenew(d._id)}><RefreshCw size={13} /> Renew</button>
            </div>
          ))}
          {docs.filter(d => d.status === 'Expiring').map(d => (
            <div key={d._id} className="docs-alert expiring-alert">
              <AlertTriangle size={15} />
              <span><strong>{d.entity}</strong> — {d.type} expires in <strong>{daysUntilExpiry(d.expiryDate)} days</strong>.</span>
              <button className="alert-renew-btn" onClick={() => handleRenew(d._id)}><RefreshCw size={13} /> Renew</button>
            </div>
          ))}
        </div>
      )}

      {/* Table Card */}
      <div className="card">
        <div className="docs-toolbar">
          <div className="filter-tabs">
            {CATEGORIES.map(c => (
              <button key={c} className={`filter-tab ${activeTab === c ? 'active' : ''}`}
                onClick={() => setActiveTab(c)}>
                {c} <span className="tab-count">{counts[c]}</span>
              </button>
            ))}
          </div>
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Search entity, doc type, doc no..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="docs-table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Category</th>
                <th>Entity</th>
                <th>Document Type</th>
                <th>Document No.</th>
                <th>Issue Date</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="docs-empty-row"><FileText size={28} /><p>No documents found.</p></td></tr>
              ) : (
                filtered.map((d, i) => {
                  const days = daysUntilExpiry(d.expiryDate);
                  return (
                    <tr key={d._id} className={d.status === 'Expired' ? 'row-expired' : d.status === 'Expiring' ? 'row-expiring' : ''}>
                      <td className="td-muted">{i + 1}</td>
                      <td>
                        <span className={`cat-badge cat-${d.category.toLowerCase()}`}>
                          {CAT_ICON[d.category]} {d.category}
                        </span>
                      </td>
                      <td>
                        <span className="cell-main">{d.entity}</span>
                        <span className="cell-sub">{d.entityId}</span>
                      </td>
                      <td>
                        <div className="doc-type-cell">
                          <FileBadge size={14} />
                          <span>{d.type}</span>
                        </div>
                      </td>
                      <td><span className="doc-no-badge">{d.docNo}</span></td>
                      <td className="td-muted">{formatDate(d.issueDate)}</td>
                      <td className="td-muted">{formatDate(d.expiryDate)}</td>
                      <td>
                        <span className={`days-badge ${days < 0 ? 'days-expired' : days < 30 ? 'days-warn' : 'days-ok'}`}>
                          {days < 0 ? 'Expired' : `${days}d`}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-icon ${STATUS_CFG[d.status]?.cls || 'badge-info'}`}>
                          {STATUS_CFG[d.status]?.icon || <Clock size={11} />} {d.status}
                        </span>
                      </td>
                      <td>
                        <div className="docs-actions">
                          <button className="btn-icon" title="View" onClick={() => setViewDoc(d)}><Eye size={15} /></button>
                          <a href={getFileUrl(d.file)} target="_blank" rel="noreferrer" className="btn-icon download" title="Download"><Download size={15} /></a>
                          {(d.status === 'Expired' || d.status === 'Expiring') && (
                            <button className="btn-icon renew" title="Renew" onClick={() => handleRenew(d._id)}><RefreshCw size={15} /></button>
                          )}
                          <button className="btn-icon delete" title="Delete" onClick={() => setDeleteId(d._id)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewDoc && createPortal(
        <div className="modal-overlay" onClick={() => setViewDoc(null)}>
          <div className="modal-content docs-view-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="docs-modal-title">
                <div className={`docs-modal-icon cat-icon-${viewDoc.category.toLowerCase()}`}><FileText size={20} /></div>
                <div>
                  <h3>{viewDoc.type}</h3>
                  <span className="td-muted">{viewDoc.entity} • {viewDoc.entityId}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <span className={`badge badge-icon ${STATUS_CFG[viewDoc.status]?.cls || 'badge-info'}`}>
                  {STATUS_CFG[viewDoc.status]?.icon || <Clock size={11} />} {viewDoc.status}
                </span>
                <button className="btn-icon" onClick={() => setViewDoc(null)}><X size={20} /></button>
              </div>
            </div>
            <div className="modal-body">
              <div className="docs-detail-grid">
                <div className="docs-detail-section">
                  <div className="docs-detail-title"><FileBadge size={13} /> Document Info</div>
                  <div className="docs-detail-rows">
                    <div className="docs-detail-row"><span>Document No.</span><span className="mono">{viewDoc.docNo}</span></div>
                    <div className="docs-detail-row"><span>Type</span><span>{viewDoc.type}</span></div>
                    <div className="docs-detail-row"><span>Category</span><span>{viewDoc.category}</span></div>
                    <div className="docs-detail-row"><span>File</span><span className="file-name">{viewDoc.file?.split('/').pop()}</span></div>
                  </div>
                </div>
                <div className="docs-detail-section">
                  <div className="docs-detail-title"><Calendar size={13} /> Validity</div>
                  <div className="docs-detail-rows">
                    <div className="docs-detail-row"><span>Entity</span><span>{viewDoc.entity}</span></div>
                    <div className="docs-detail-row"><span>Entity ID</span><span>{viewDoc.entityId}</span></div>
                    <div className="docs-detail-row"><span>Issue Date</span><span>{formatDate(viewDoc.issueDate)}</span></div>
                    <div className="docs-detail-row"><span>Expiry Date</span><span>{formatDate(viewDoc.expiryDate)}</span></div>
                    <div className="docs-detail-row">
                      <span>Days Left</span>
                      <span className={`days-badge ${daysUntilExpiry(viewDoc.expiryDate) < 0 ? 'days-expired' : daysUntilExpiry(viewDoc.expiryDate) < 30 ? 'days-warn' : 'days-ok'}`}>
                        {daysUntilExpiry(viewDoc.expiryDate) < 0 ? 'Expired' : `${daysUntilExpiry(viewDoc.expiryDate)} days`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview placeholder */}
              <div className="doc-preview-box">
                <FileText size={36} />
                <span>{viewDoc.file?.split('/').pop()}</span>
                <a href={getFileUrl(viewDoc.file)} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                  <Download size={14} /> Download File
                </a>
              </div>
            </div>
            {(viewDoc.status === 'Expired' || viewDoc.status === 'Expiring') && (
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setViewDoc(null)} disabled={submitting}>Close</button>
                <button className="btn btn-primary" onClick={() => handleRenew(viewDoc._id)} disabled={submitting}>
                  {submitting ? <Loader2 size={15} className="spinner" /> : <RefreshCw size={15} />}
                  Mark as Renewed
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ── UPLOAD MODAL ── */}
      {showAdd && createPortal(
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content docs-add-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload New Document</h3>
              <button className="btn-icon" onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form className="user-form">

                <div className="form-section-title"><FileText size={13} /> Document Details</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value, type: DOC_TYPES[e.target.value][0] }))}>
                      <option>Vehicle</option>
                      <option>Franchise</option>
                      <option>User</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Document Type *</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                      {DOC_TYPES[form.category].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Entity Name *</label>
                    <input type="text" placeholder="e.g. Ather 450X / City EV Rentals" value={form.entity} onChange={e => setForm(p => ({ ...p, entity: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Entity ID / Reg No. *</label>
                    <input type="text" placeholder="e.g. KA 01 EK 1234" value={form.entityId} onChange={e => setForm(p => ({ ...p, entityId: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Document Number *</label>
                  <input type="text" placeholder="e.g. INS-2025-001" value={form.docNo} onChange={e => setForm(p => ({ ...p, docNo: e.target.value }))} />
                </div>

                <div className="form-section-title" style={{ marginTop: '0.5rem' }}><Calendar size={13} /> Validity Period</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Issue Date</label>
                    <input type="date" value={form.issueDate} onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Expiry Date *</label>
                    <input type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
                  </div>
                </div>

                <div className="form-section-title" style={{ marginTop: '0.5rem' }}><Upload size={13} /> File Upload</div>
                <div className="doc-upload-box" onClick={() => document.getElementById('doc-file-input').click()}>
                  <Upload size={24} />
                  <span>{form.file ? form.file.name : 'Click to upload document'}</span>
                  <small>PDF, JPG, PNG up to 10MB</small>
                  <input id="doc-file-input" type="file" hidden onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                </div>

              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={submitting}>
                {submitting ? <Loader2 className="spinner" size={15} /> : <Upload size={15} />} 
                {submitting ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteId && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-content delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Document</h3>
              <button className="btn-icon" onClick={() => setDeleteId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-confirm-body">
                <div className="delete-icon-wrap"><Trash2 size={26} /></div>
                <p>Are you sure you want to delete this document?</p>
                <p className="delete-sub">This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteId(null)} disabled={submitting}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)} disabled={submitting}>
                {submitting ? <Loader2 size={15} className="spinner" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Documents;
