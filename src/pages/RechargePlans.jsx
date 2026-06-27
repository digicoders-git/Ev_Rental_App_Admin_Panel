import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Trash2, Edit3, Loader2 } from 'lucide-react';
import api from '../services/api';

const RechargePlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ id: null, days: '', price: '', status: 'active' });
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get('/recharge-plans/all');
            setPlans(res.data.data);
        } catch (error) {
            console.error('Error fetching recharge plans', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setFormData({ id: plan._id, days: plan.days, price: plan.price, status: plan.status });
        } else {
            setFormData({ id: null, days: '', price: '', status: 'active' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({ id: null, days: '', price: '', status: 'active' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (formData.id) {
                await api.put(`/recharge-plans/${formData.id}`, {
                    days: formData.days,
                    price: formData.price,
                    status: formData.status
                });
            } else {
                await api.post('/recharge-plans', {
                    days: formData.days,
                    price: formData.price,
                    status: formData.status
                });
            }
            fetchPlans();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving plan', error);
            alert('Failed to save plan');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setSubmitting(true);
        try {
            await api.delete(`/recharge-plans/${deleteId}`);
            setDeleteId(null);
            fetchPlans();
        } catch (error) {
            console.error('Error deleting plan', error);
            alert('Failed to delete plan');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading-screen"><div className="loader"></div></div>;
    }

    return (
        <div className="plans-page">
            <div className="page-header">
                <div>
                    <h2>Wallet Recharge Plans</h2>
                    <p>Manage predefined top-up packages for user wallets.</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={18} /> Add Plan
                </button>
            </div>

            <div className="card">
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Days (Duration)</th>
                                <th>Price (₹)</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-4 text-muted">No recharge plans found.</td>
                                </tr>
                            ) : (
                                plans.map(plan => (
                                    <tr key={plan._id}>
                                        <td><strong>{plan.days}</strong></td>
                                        <td>₹{plan.price}</td>
                                        <td>
                                            <span className={`status-badge ${plan.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                                                {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <button className="btn btn-outline btn-sm" onClick={() => handleOpenModal(plan)}>
                                                    <Edit3 size={14} /> Edit
                                                </button>
                                                <button className="btn-icon delete" onClick={() => setDeleteId(plan._id)}>
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── ADD / EDIT MODAL ── */}
            {showModal && createPortal(
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>{formData.id ? 'Edit Plan' : 'Add New Plan'}</h3>
                            <button className="btn-icon" onClick={handleCloseModal}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <form className="user-form">
                                <div className="form-group">
                                    <label>Duration / Days (e.g., "3 Days") *</label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter duration"
                                        value={formData.days} 
                                        onChange={(e) => setFormData({...formData, days: e.target.value})} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Price (₹) *</label>
                                    <input 
                                        type="number" 
                                        placeholder="0"
                                        value={formData.price} 
                                        onChange={(e) => setFormData({...formData, price: e.target.value})} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select 
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={handleCloseModal} disabled={submitting}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !formData.days || !formData.price}>
                                {submitting ? <Loader2 size={16} className="spinner" /> : (formData.id ? 'Save Changes' : 'Save Plan')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── DELETE CONFIRM ── */}
            {deleteId && createPortal(
                <div className="modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Delete Plan</h3>
                            <button className="btn-icon" onClick={() => setDeleteId(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="delete-confirm-body">
                                <div className="delete-icon"><Trash2 size={28} /></div>
                                <p>Are you sure you want to delete <strong>{plans.find((p) => p._id === deleteId)?.days}</strong>?</p>
                                <p className="delete-sub">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setDeleteId(null)} disabled={submitting}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
                                {submitting ? <Loader2 size={16} className="spinner" /> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default RechargePlans;
