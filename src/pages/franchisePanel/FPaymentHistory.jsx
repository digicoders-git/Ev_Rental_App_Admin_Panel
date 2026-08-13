import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Download, Search, FileText, Calendar, Filter, X } from 'lucide-react';
import '../PaymentHistory.css';

const FPaymentHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all'
  });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async (currentFilters = filters) => {
    try {
      setLoading(true);
      let query = new URLSearchParams();
      if (currentFilters.startDate) query.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) query.append('endDate', currentFilters.endDate);
      if (currentFilters.status !== 'all') query.append('status', currentFilters.status);

      const response = await api.get(`/invoices?${query.toString()}`);
      if (response.data.success) {
        setInvoices(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPage(1);
    fetchInvoices(filters);
  };

  const clearFilters = () => {
    setPage(1);
    const resetFilters = { startDate: '', endDate: '', status: 'all' };
    setFilters(resetFilters);
    fetchInvoices(resetFilters);
  };

  const downloadBulkReport = async () => {
    try {
      let query = new URLSearchParams();
      if (filters.startDate) query.append('startDate', filters.startDate);
      if (filters.endDate) query.append('endDate', filters.endDate);
      if (filters.status !== 'all') query.append('status', filters.status);

      const response = await api.get(`/invoices/report/download?${query.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'My_Payment_History_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed', error);
      alert('Failed to download report.');
    }
  };

  const downloadSingleInvoice = async (id, invNo) => {
    try {
      const response = await api.get(`/invoices/${id}/receipt`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed', error);
    }
  };

  // Metrics
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const totalPending = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0);

  // Pagination
  const totalPages = Math.ceil(invoices.length / PAGE_SIZE);
  const paginatedInvoices = invoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bookings-container">
      <div className="bk-header">
        <div>
          <h1 className="bk-title">My Payment History & Invoices</h1>
          <p className="bk-subtitle">Track and manage your store's transactions</p>
        </div>
        <button className="bk-btn bk-btn-primary" onClick={downloadBulkReport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} /> Download Filtered Report (PDF)
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
        <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Total Invoices</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{invoices.length}</div>
        </div>
        <div style={{ flex: 1, background: '#f0fdf4', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #bbf7d0' }}>
          <div style={{ color: '#166534', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Total Paid (Filtered)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#15803d' }}>₹{totalPaid.toFixed(2)}</div>
        </div>
        <div style={{ flex: 1, background: '#fff7ed', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #fed7aa' }}>
          <div style={{ color: '#9a3412', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Total Pending (Filtered)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#c2410c' }}>₹{totalPending.toFixed(2)}</div>
        </div>
      </div>

      <div className="bk-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', marginBottom: '24px', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Start Date</label>
          <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="bk-search-input" style={{ width: '100%', padding: '8px 12px' }} />
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>End Date</label>
          <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="bk-search-input" style={{ width: '100%', padding: '8px 12px' }} />
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Status</label>
          <select name="status" value={filters.status} onChange={handleFilterChange} className="bk-search-input" style={{ width: '100%', padding: '8px 12px' }}>
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
        <button className="bk-btn bk-btn-primary" onClick={applyFilters} style={{ padding: '8px 16px', height: '40px' }}>Apply</button>
        <button className="bk-btn bk-btn-outline" onClick={clearFilters} style={{ padding: '8px 16px', height: '40px' }}><X size={16}/></button>
      </div>

      <div className="bk-table-container">
        {loading ? (
          <div className="bk-loading">
            <div className="bk-spinner"></div>
            <p>Loading payment history...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="bk-empty-state">
            <FileText size={48} className="bk-empty-icon" />
            <h3>No Invoices Found</h3>
            <p>Adjust your filters or generate new bookings.</p>
          </div>
        ) : (
          <table className="bk-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.map((inv) => (
                <tr key={inv._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#334155' }}>{inv.invoice_number}</div>
                    {inv.installment_id && <span style={{ fontSize: '0.7rem', color: '#8b5cf6', background: '#ede9fe', padding: '2px 6px', borderRadius: '4px' }}>Installment {inv.installment_no}</span>}
                  </td>
                  <td style={{ color: '#64748b' }}>{new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <div style={{ fontWeight: 500, color: '#334155' }}>{inv.user?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{inv.user?.mobile}</div>
                  </td>
                  <td>
                    <div style={{ color: '#334155' }}>{inv.booking?.vehicle?.vehicle_name || 'N/A'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{inv.booking?.vehicle?.registration_number}</div>
                  </td>
                  <td>
                    <span className={`bk-status-badge ${inv.status === 'paid' ? 'status-completed' : 'status-active'}`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: inv.status === 'paid' ? '#15803d' : '#0f172a' }}>
                    ₹{Number(inv.total_amount).toFixed(2)}
                  </td>
                  <td>
                    <button 
                      className="bk-btn bk-btn-outline" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => downloadSingleInvoice(inv._id, inv.invoice_number)}
                    >
                      <Download size={14} /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {/* Pagination Controls */}
        {!loading && invoices.length > 0 && (
          <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, invoices.length)} of {invoices.length} entries
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="bk-btn bk-btn-outline" 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                style={{ padding: '6px 12px', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <button 
                className="bk-btn bk-btn-outline" 
                disabled={page === totalPages || totalPages === 0} 
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '6px 12px', opacity: (page === totalPages || totalPages === 0) ? 0.5 : 1, cursor: (page === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FPaymentHistory;
