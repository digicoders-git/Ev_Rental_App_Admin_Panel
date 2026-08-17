import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { createPortal } from 'react-dom';
import './SettlementBillModal.css';

const SettlementBillModal = ({ show, onClose, billData, franchiseName }) => {
  if (!show || !billData) return null;

  const {
    withdrawal_id,
    amount,
    status,
    createdAt
  } = billData;

  // The "amount" field in the database actually stores the NET amount withdrawn from the wallet.
  // We need to reverse-calculate the Gross and Service Fee.
  const net_payable = amount || 0;
  const service_fee_percentage_val = billData.service_fee_percentage || 8;
  
  // Gross = Net / (1 - (Fee / 100))
  const gross_amount = net_payable / (1 - (service_fee_percentage_val / 100));
  const service_fee_val = gross_amount - net_payable;

  const dateStr = new Date(createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const getStatusStyle = (s) => {
    switch (s) {
      case 'approved':
      case 'released': return { color: '#059669', bg: '#d1fae5', label: 'PAID / RELEASED' };
      case 'pending':
      case 'processing': return { color: '#d97706', bg: '#fef3c7', label: 'PROCESSING' };
      case 'failed':
      case 'rejected': return { color: '#dc2626', bg: '#fee2e2', label: 'FAILED / REJECTED' };
      default: return { color: '#4b5563', bg: '#f3f4f6', label: (s || '').toUpperCase() };
    }
  };

  const statusStyle = getStatusStyle(status);

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="modal-overlay print-bg" onClick={onClose}>
      <div className="modal-content bill-modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Action Buttons (Hidden when printing) */}
        <div className="bill-actions no-print">
          <button className="btn btn-outline" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={16} /> Print / Save PDF
          </button>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>

        {/* Printable Bill Area */}
        <div className="bill-printable-area">
          <div className="bill-header">
            <div className="bill-logo-section">
              <img src="/logo.png" alt="EV Rental Logo" className="bill-logo" />
              <div className="bill-company-info">
                <h2>EV Rental Management</h2>
                <p>Corporate Office, Bangalore, India</p>
                <p>Email: billing@evrental.com | Support: +91 1800-123-456</p>
              </div>
            </div>
            <div className="bill-title-section">
              <h1>SETTLEMENT INVOICE</h1>
              <span className="bill-status" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                {statusStyle.label}
              </span>
            </div>
          </div>

          <div className="bill-meta-info">
            <div className="bill-to">
              <h4>Billed To:</h4>
              <p className="franchise-name">{franchiseName || 'Franchise Partner'}</p>
              <p>Franchisee Partner Account</p>
            </div>
            <div className="bill-details-table-mini">
              <div>
                <span>Invoice No:</span>
                <strong>{withdrawal_id || 'N/A'}</strong>
              </div>
              <div>
                <span>Date:</span>
                <strong>{dateStr}</strong>
              </div>
            </div>
          </div>

          <div className="bill-table-container">
            <table className="bill-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Gross Settlement Amount</strong>
                    <p className="item-desc">Total wallet funds requested for payout.</p>
                  </td>
                  <td className="text-right font-semibold">₹{gross_amount?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Platform Service Fee ({service_fee_percentage_val}%)</strong>
                    <p className="item-desc">Deduction for platform usage and processing.</p>
                  </td>
                  <td className="text-right text-danger font-semibold">- ₹{service_fee_val?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="text-right"><strong>Net Payable Amount:</strong></td>
                  <td className="text-right total-amount">₹{net_payable?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 0}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bill-footer">
            <p><strong>Note:</strong> This is a computer-generated invoice and does not require a physical signature.</p>
            <p>If you have any questions concerning this invoice, please contact support.</p>
            <div className="bill-footer-brand">Thank you for partnering with EV Rental!</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettlementBillModal;
