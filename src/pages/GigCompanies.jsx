import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Edit, Trash2, X, Briefcase } from 'lucide-react';
import api from '../services/api';

const GigCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true
  });
  
  // Delete confirm state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/gig-companies/admin');
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching gig companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ name: '', isActive: true });
    setShowModal(true);
  };

  const openEditModal = (company) => {
    setIsEditing(true);
    setCurrentId(company._id);
    setFormData({
      name: company.name,
      isActive: company.isActive
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ name: '', isActive: true });
    setCurrentId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/gig-companies/${currentId}`, formData);
      } else {
        await api.post('/gig-companies', formData);
      }
      closeModal();
      fetchCompanies();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving company');
      console.error('Error saving company:', error);
    }
  };

  const confirmDelete = (company) => {
    setCompanyToDelete(company);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/gig-companies/${companyToDelete._id}`);
      setShowDeleteConfirm(false);
      setCompanyToDelete(null);
      fetchCompanies();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting company');
      console.error('Error deleting company:', error);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading-screen"><div className="loader"></div></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Gig Companies</h1>
          <p className="page-subtitle">Manage gig delivery companies for rider registration</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={20} />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">All Companies ({filteredCompanies.length})</h2>
          <div className="search-wrapper" style={{ maxWidth: '300px' }}>
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search companies..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Status</th>
                <th>Added On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map(company => (
                  <tr key={company._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '8px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
                          <Briefcase size={20} />
                        </div>
                        <span style={{ fontWeight: 500 }}>{company.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${company.isActive ? 'status-active' : 'status-inactive'}`}>
                        {company.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(company.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', justifyContent: 'center' }}>
                        <button className="btn-icon btn-edit" onClick={() => openEditModal(company)} title="Edit">
                          <Edit size={18} />
                        </button>
                        <button className="btn-icon btn-delete" onClick={() => confirmDelete(company)} title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-8">
                    <div className="empty-state">
                      <Briefcase size={48} />
                      <p>No gig companies found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && createPortal(
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Company' : 'Add New Company'}</h3>
              <button className="btn-icon" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Company Name <span className="required">*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange}
                    placeholder="e.g. Swiggy, Zomato"
                    required 
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                  <input 
                    type="checkbox" 
                    id="isActive"
                    name="isActive" 
                    checked={formData.isActive} 
                    onChange={handleInputChange}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="isActive" style={{ margin: 0, cursor: 'pointer' }}>Active (Show in app)</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Save Changes' : 'Add Company'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && createPortal(
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content delete-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Confirm Deletion</h3>
              <button className="btn-icon" onClick={() => setShowDeleteConfirm(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="delete-body">
                <div className="delete-icon-wrap">
                  <Trash2 size={28} />
                </div>
                <p>Are you sure you want to delete <strong>{companyToDelete?.name}</strong>?</p>
                <p className="delete-sub">This action cannot be undone and may affect riders registered with this company.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={16} /> Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GigCompanies;
