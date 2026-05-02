import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText, Image, Bell, HelpCircle, Plus, Search,
  Edit3, Trash2, Eye, X, CheckCircle, Clock,
  EyeOff, Globe, Smartphone, Monitor, Save, Loader2,
  Upload
} from 'lucide-react';
import { getAllContent, createContent, updateContent, deleteContent, toggleContent } from '../services/apiServices';
import './Content.css';

const SECTIONS = [
  { label: 'Banners',       type: 'banner' },
  { label: 'Announcements', type: 'announcement' },
  { label: 'FAQs',          type: 'faq' },
  { label: 'App Pages',     type: 'page' }
];

const emptyForm = {
  title: '', slug: '', description: '', type: 'page', category: 'general', order: 0, isActive: true, image: null
};

const API_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const Content = () => {
  const [section, setSection]     = useState(SECTIONS[0]);
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [viewItem, setViewItem]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchContent();
  }, [section]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data } = await getAllContent({ type: section.type });
      setItems(data.data || []);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(p => ({ ...p, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm, type: section.type, slug: '' });
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = item => {
    setEditId(item._id);
    setForm({
      title: item.title,
      slug: item.slug,
      description: item.description,
      type: item.type,
      category: item.category,
      order: item.order,
      isActive: item.isActive,
      image: null
    });
    setImagePreview(item.image ? (item.image.startsWith('http') ? item.image : `${API_URL}${item.image}`) : null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || (!editId && !form.slug)) {
      alert("Title and Slug are required");
      return;
    }
    
    try {
      setSubmitting(true);
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'image') {
          if (form[key]) formData.append('image', form[key]);
        } else {
          formData.append(key, form[key]);
        }
      });

      if (editId) {
        await updateContent(editId, formData);
      } else {
        await createContent(formData);
      }
      
      setShowModal(false);
      fetchContent();
    } catch (error) {
      console.error("Error saving content:", error);
      alert(error.response?.data?.message || "Failed to save content");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await deleteContent(deleteItem._id);
      setDeleteItem(null);
      fetchContent();
    } catch (error) {
      console.error("Error deleting content:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleContent(id);
      fetchContent();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const filtered = items.filter(x => 
    x.title.toLowerCase().includes(search.toLowerCase()) || 
    x.slug.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusCls = s => s ? 'badge-success' : 'badge-warning';

  const sectionIcon = s => {
    switch(s) {
      case 'banner': return <Image size={15} />;
      case 'announcement': return <Bell size={15} />;
      case 'faq': return <HelpCircle size={15} />;
      default: return <FileText size={15} />;
    }
  };

  const autoGenerateSlug = (title) => {
    if (editId) return; // Don't auto-generate on edit
    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setForm(p => ({ ...p, slug }));
  };

  if (loading) {
    return (
      <div className="cp-page-loading">
        <Loader2 className="spinner" size={40} />
        <p>Loading {section.label}...</p>
      </div>
    );
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <div><h1>Content Management</h1><p>Manage your app's dynamic content, banners, and static pages.</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={17} /> Add {section.label.slice(0,-1)}</button>
      </div>

      <div className="content-section-tabs">
        {SECTIONS.map(s => (
          <button key={s.type} className={`content-section-btn ${section.type === s.type ? 'active' : ''}`}
            onClick={() => { setSection(s); setSearch(''); }}>
            {sectionIcon(s.type)} {s.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="content-toolbar">
          <h3 className="content-section-title-text">{section.label}</h3>
          <div className="search-wrapper">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder={`Search ${section.label.toLowerCase()}...`}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="content-table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Title / Slug</th>
                <th>{section.type === 'faq' ? 'Question/Answer' : section.type === 'banner' ? 'Description' : 'Content'}</th>
                {section.type === 'banner' && <th>Image</th>}
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="content-empty"><FileText size={24} /><p>No {section.label.toLowerCase()} found.</p></td></tr>
              ) : (
                filtered.map((item, i) => (
                  <tr key={item._id}>
                    <td className="td-muted">{i + 1}</td>
                    <td>
                      <span className="cell-main">{item.title}</span>
                      <span className="cell-sub">{item.slug}</span>
                    </td>
                    <td>
                      <div className="content-truncate" style={{ maxWidth: 300 }}>{item.description}</div>
                      <span className="cell-sub">{item.category}</span>
                    </td>
                    {section.type === 'banner' && (
                      <td>
                        {item.image ? (
                          <div className="content-img-preview">
                            <img src={item.image.startsWith('http') ? item.image : `${API_URL}${item.image}`} alt="Banner" onError={(e) => e.target.src = 'https://via.placeholder.com/100x50?text=No+Image'} />
                          </div>
                        ) : <span className="td-muted">No Image</span>}
                      </td>
                    )}
                    <td className="td-muted">#{item.order}</td>
                    <td>
                      <span className={`badge badge-icon ${getStatusCls(item.isActive)}`}>
                        {item.isActive ? <CheckCircle size={11} /> : <EyeOff size={11} />}
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="content-actions">
                        <button className="btn-icon" title="View" onClick={() => setViewItem(item)}><Eye size={15} /></button>
                        <button className="btn-icon edit" title="Edit" onClick={() => openEdit(item)}><Edit3 size={15} /></button>
                        <button className="btn-icon toggle-btn" title="Toggle Status" onClick={() => handleToggle(item._id)}>
                          {item.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button className="btn-icon delete" title="Delete" onClick={() => setDeleteItem(item)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewItem && createPortal(
        <div className="modal-overlay" onClick={() => setViewItem(null)}>
          <div className="modal-content content-view-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Content Details</h3>
              <button className="btn-icon" onClick={() => setViewItem(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="view-details">
                {viewItem.image && (
                   <div className="view-img-full">
                     <img src={viewItem.image.startsWith('http') ? viewItem.image : `${API_URL}${viewItem.image}`} alt="Content" />
                   </div>
                )}
                <div className="view-row"><span className="view-key">Title</span><span className="view-val">{viewItem.title}</span></div>
                <div className="view-row"><span className="view-key">Slug</span><span className="view-val">{viewItem.slug}</span></div>
                <div className="view-row"><span className="view-key">Type</span><span className="view-val">{viewItem.type}</span></div>
                <div className="view-row"><span className="view-key">Category</span><span className="view-val">{viewItem.category}</span></div>
                <div className="view-row"><span className="view-key">Order</span><span className="view-val">#{viewItem.order}</span></div>
                <div className="view-row"><span className="view-key">Status</span><span className="view-val">{viewItem.isActive ? 'Active' : 'Inactive'}</span></div>
                <div className="view-row content-block">
                  <span className="view-key">Description / Content</span>
                  <div className="view-val-long">{viewItem.description}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content content-form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit' : 'Add'} {section.label.slice(0, -1)}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form className="user-form" onSubmit={e => e.preventDefault()}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Title *</label>
                    <input type="text" value={form.title} 
                      onChange={e => { setForm(p => ({ ...p, title: e.target.value })); autoGenerateSlug(e.target.value); }} 
                      placeholder="e.g. Terms & Conditions" />
                  </div>
                  <div className="form-group">
                    <label>Slug (URL) *</label>
                    <input type="text" value={form.slug} 
                      onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} 
                      placeholder="e.g. terms-and-conditions" disabled={!!editId} />
                  </div>
                </div>

                <div className="form-group">
                  <label>{section.type === 'faq' ? 'Answer' : 'Content / Description'} *</label>
                  <textarea rows={6} value={form.description} 
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} 
                    placeholder="Enter the full content or description here..." />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <input type="text" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Display Order</label>
                    <input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: e.target.value }))} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Image / Media</label>
                  <div className="image-upload-wrapper" onClick={() => fileInputRef.current.click()}>
                    {imagePreview ? (
                      <div className="upload-preview">
                        <img src={imagePreview} alt="Preview" />
                        <div className="upload-overlay"><Upload size={20} /> Change Image</div>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <Upload size={24} />
                        <p>Click to upload image</p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={form.isActive} 
                      onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                    <span>Mark as Active / Published</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                {submitting ? <Loader2 className="spinner" size={15} /> : <><Save size={15} /> {editId ? 'Save Changes' : 'Publish Content'}</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteItem && createPortal(
        <div className="modal-overlay" onClick={() => setDeleteItem(null)}>
          <div className="modal-content content-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Delete Content</h3><button className="btn-icon" onClick={() => setDeleteItem(null)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="delete-confirm-body">
                <div className="delete-icon-wrap"><Trash2 size={26} /></div>
                <p>Are you sure you want to delete <strong>{deleteItem.title}</strong>?</p>
                <p className="delete-sub">This will permanently remove this content and its image.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setDeleteItem(null)} disabled={submitting}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
                {submitting ? <Loader2 className="spinner" size={15} /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Content;
