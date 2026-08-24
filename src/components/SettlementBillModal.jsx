import React from 'react';
import { X, Printer } from 'lucide-react';
import { createPortal } from 'react-dom';
import './SettlementBillModal.css';

// Utility to convert numbers to Indian Rupee Words
function numberToWords(num) {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return; let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
  return 'Indian Rupees ' + str;
}

const SettlementBillModal = ({ show, onClose, billData, franchiseName }) => {
  if (!show || !billData) return null;

  const isWithdrawal = billData._type === 'withdrawal' || !!billData.withdrawal_id;
  const billId = billData.withdrawal_id || billData.settlement_id || 'N/A';
  const createdAt = billData.createdAt || billData.date_to || new Date();
  const franchise = billData.franchise;

  const net_payable = isWithdrawal ? (billData.amount || 0) : (billData.final_payout || 0);
  const service_fee_percentage_val = isWithdrawal ? (billData.service_fee_percentage || 8) : (billData.platform_fee_percentage || 8);
  
  const gross_amount = isWithdrawal 
    ? (net_payable / (1 - (service_fee_percentage_val / 100))) 
    : (billData.total_collected || (net_payable / (1 - (service_fee_percentage_val / 100))));

  const service_fee_val = isWithdrawal 
    ? (gross_amount - net_payable)
    : (billData.commission_deducted || (gross_amount - net_payable));

  const d = new Date(createdAt);
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  // Previous week calculation for period
  const prevDate = new Date(d);
  prevDate.setDate(d.getDate() - 7);
  const periodStr = prevDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' to ' + dateStr;

  const amountInWords = numberToWords(Math.round(net_payable));

  // Franchise Details Fallbacks
  const fName = franchiseName || franchise?.store_name || 'Franchise Partner';
  const fCode = franchise?.franchise_id || franchise?.store_id || '—';
  const fAddress = franchise?.address || franchise?.city || '—';
  const fMobile = franchise?.mobile || franchise?.owner_mobile || '—';
  const fGst = franchise?.gstin || '—';

  // Bank Details Fallbacks
  const bankDetails = franchise?.bank_details || {};
  const bHolder = bankDetails.account_holder_name || fName;
  const bName = bankDetails.bank_name || '—';
  const bAcc = bankDetails.account_number ? 'XXXXX' + bankDetails.account_number.slice(-4) : '—';
  const bIfsc = bankDetails.ifsc_code || '—';
  const bBranch = bankDetails.branch_name || '—';

  const downloadPDF = async () => {
    const element = document.getElementById('bill-content-to-print');
    const modalContent = document.querySelector('.bill-modal-content');
    
    // Save original styles and disable overflow/max-height for full capture
    const originalOverflow = modalContent.style.overflow;
    const originalMaxHeight = modalContent.style.maxHeight;
    modalContent.style.overflow = 'visible';
    modalContent.style.maxHeight = 'none';
    modalContent.scrollTop = 0;
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:       5,
        filename:     `Settlement_Bill_${billId}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation failed. Fallback to print:", error);
      window.print();
    } finally {
      // Restore styles
      modalContent.style.overflow = originalOverflow;
      modalContent.style.maxHeight = originalMaxHeight;
    }
  };

  return createPortal(
    <div className="modal-overlay print-bg" onClick={onClose}>
      <div className="modal-content bill-modal-content" onClick={e => e.stopPropagation()}>
        <div className="bill-actions no-print">
          <button className="btn-close" onClick={onClose}>Close</button>
          <button className="btn-print" onClick={downloadPDF}>Download PDF</button>
        </div>

        <div id="bill-content-to-print" className="settlement-tris-bill">
          {/* Header */}
          <div className="t-header">
            <div className="t-header-left">
              <img src="/logo.png" alt="TRIS ELECTRIC" className="t-logo" />
              <div className="t-company">
                <h2>TRIS ELECTRIC</h2>
                <h3 className="t-sub-company">JUNGLEBAN ENTERPRISES</h3>
                <p>Prem Nagar, Alambagh, Lucknow</p>
                <p>Uttar Pradesh - 226005</p>
                <p>GSTIN : 09DTTPS1540G1Z7</p>
              </div>
            </div>
            <div className="t-header-right">
              <div className="t-header-right-inner">
                <h1 className="t-title">SETTLEMENT BILL</h1>
                <p className="t-subtitle">(Franchise Payout Statement)</p>
                
                <div className="t-meta-box">
                  <div className="t-meta-row">
                    <div className="t-meta-label">Settlement Bill No.</div>
                    <div className="t-meta-colon">:</div>
                    <div className="t-meta-value">{billId}</div>
                  </div>
                  <div className="t-meta-row">
                    <div className="t-meta-label">Settlement Date</div>
                    <div className="t-meta-colon">:</div>
                    <div className="t-meta-value">{dateStr}</div>
                  </div>
                  <div className="t-meta-row">
                    <div className="t-meta-label">Payout For Period</div>
                    <div className="t-meta-colon">:</div>
                    <div className="t-meta-value">{periodStr}</div>
                  </div>
                  <div className="t-meta-row">
                    <div className="t-meta-label">Payout Request Date</div>
                    <div className="t-meta-colon">:</div>
                    <div className="t-meta-value">{dateStr}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fieldsets */}
          <fieldset className="t-fieldset">
            <legend className="t-legend">Franchisee Details</legend>
            <div className="t-fieldset-content t-flex-row">
              <div className="t-details-col">
                <div className="t-details-row">
                  <div className="t-details-label">Franchisee Name</div>
                  <div className="t-details-colon">:</div>
                  <div className="t-details-value"><strong>{fName}</strong></div>
                </div>
                <div className="t-details-row">
                  <div className="t-details-label">Address</div>
                  <div className="t-details-colon">:</div>
                  <div className="t-details-value">{fAddress}</div>
                </div>
              </div>
              <div className="t-details-col">
                <div className="t-details-row">
                  <div className="t-details-label">Franchisee Code</div>
                  <div className="t-details-colon">:</div>
                  <div className="t-details-value">{fCode}</div>
                </div>
                <div className="t-details-row">
                  <div className="t-details-label">Mobile No.</div>
                  <div className="t-details-colon">:</div>
                  <div className="t-details-value">{fMobile}</div>
                </div>
                <div className="t-details-row">
                  <div className="t-details-label">GSTIN (If Any)</div>
                  <div className="t-details-colon">:</div>
                  <div className="t-details-value">{fGst}</div>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Settlement Details */}
          <fieldset className="t-fieldset">
            <legend className="t-legend">Settlement Details</legend>
            <div className="t-fieldset-content t-flex-row">
              <div className="t-details-col">
                <div className="t-details-row">
                  <div className="t-details-label">Payout Requested By</div>
                  <div className="t-details-colon">:</div>
                  <div className="t-details-value">{fName}</div>
                </div>
                <div className="t-details-row">
                  <div className="t-details-label">Requested On</div>
                  <div className="t-details-colon">:</div>
                  <div className="t-details-value">{dateStr}</div>
                </div>
              </div>
              <div className="t-details-col">
                <div className="t-details-row">
                  <div className="t-details-label">Payout Mode</div>
                  <div className="t-details-colon">:</div>
                  <div className="t-details-value">Bank Transfer</div>
                </div>
                <div className="t-details-row">
                  <div className="t-details-label">Account Holder Name</div>
                  <div className="t-details-colon">:</div>
                  <div className="t-details-value">{bHolder}</div>
                </div>
                <div className="t-details-row">
                  <div className="t-details-label">Bank Name</div>
                  <div className="t-details-colon">:</div>
                  <div className="t-details-value">{bName}</div>
                </div>
                <div className="t-details-row">
                  <div className="t-details-label">Account No.</div>
                  <div className="t-details-colon">:</div>
                  <div className="t-details-value">{bAcc}</div>
                </div>
                <div className="t-details-row">
                  <div className="t-details-label">IFSC Code</div>
                  <div className="t-details-colon">:</div>
                  <div className="t-details-value">{bIfsc}</div>
                </div>
                <div className="t-details-row">
                  <div className="t-details-label">Branch</div>
                  <div className="t-details-colon">:</div>
                  <div className="t-details-value">{bBranch}</div>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Summary */}
          <fieldset className="t-fieldset">
            <legend className="t-legend">Summary</legend>
            <div className="t-fieldset-content">
              <div className="t-summary-box-full">
                <div className="t-summary-row-full">
                  <div>Opening Wallet Balance (as on {prevDate.toLocaleDateString('en-IN', {day:'2-digit',month:'2-digit',year:'numeric'})})</div>
                  <div>₹ 0.00</div>
                </div>
                <div className="t-summary-row-full">
                  <div>Total Revenue Collected (Inclusive of GST)</div>
                  <div>₹ {gross_amount.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                </div>
                <div className="t-summary-row-full">
                  <div>Less: Tris Service Charge ({service_fee_percentage_val}% Inclusive of GST)</div>
                  <div>- ₹ {service_fee_val.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                </div>
                <div className="t-summary-row-full">
                  <div>Other Deductions / Adjustments (If Any)</div>
                  <div>₹ 0.00</div>
                </div>
                <div className="t-summary-row-full t-net-payout">
                  <div>Net Payout to Franchisee</div>
                  <div>₹ {net_payable.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Bottom Grid for Words and Final Summary */}
          <div className="t-bottom-grid">
            <fieldset className="t-fieldset t-words-box">
              <legend className="t-legend">Amount in Words</legend>
              <div className="t-fieldset-content t-words">
                {amountInWords}
              </div>
            </fieldset>

            <div className="t-final-box">
              <div className="t-final-row">
                <div>Total Revenue Collected (Incl. of GST)</div>
                <div>₹ {gross_amount.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
              </div>
              <div className="t-final-row">
                <div>Less: Tris Service Charge ({service_fee_percentage_val}% Incl. of GST)</div>
                <div>₹ {service_fee_val.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
              </div>
              <div className="t-final-row t-final-net">
                <div>Net Payout to Franchisee</div>
                <div>₹ {net_payable.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
              </div>
              <div className="t-final-mode">
                Payment Mode : Bank Transfer
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="t-footer">
            <div className="t-notes-section">
              <div className="t-notes">
                <strong>Notes:</strong>
                <ul>
                  <li>This is a system generated settlement bill.</li>
                  <li>All amounts are inclusive of applicable GST.</li>
                  <li>In case of any discrepancy, please contact Tris Electric within 3 days of receipt of this statement.</li>
                </ul>
              </div>
              <div className="t-thankyou">
                Thank you for partnering with Tris Electric.
              </div>
            </div>

            <div className="t-signatory">
              <p>for TRIS ELECTRIC</p>
              <p className="t-signatory-sub">JUNGLEBAN ENTERPRISES</p>
              <div className="t-stamp" style={{ position: 'relative', display: 'inline-block' }}>
                <svg width="100" height="100" viewBox="0 0 100 100" className="t-stamp-svg">
                  <circle cx="50" cy="50" r="45" stroke="#1d4ed8" strokeWidth="1.5" fill="none" />
                  <circle cx="50" cy="50" r="32" stroke="#1d4ed8" strokeWidth="0.5" fill="none" />
                  <path id="curve-top" d="M 15,50 A 35,35 0 0,1 85,50" fill="none" />
                  <path id="curve-bot" d="M 85,50 A 35,35 0 0,1 15,50" fill="none" />
                  <text fill="#1d4ed8" fontSize="11" fontWeight="bold">
                    <textPath href="#curve-top" startOffset="50%" textAnchor="middle">TRIS ELECTRIC</textPath>
                  </text>
                  <text fill="#1d4ed8" fontSize="9" fontWeight="bold">
                    <textPath href="#curve-bot" startOffset="50%" textAnchor="middle">JUNGLEBAN ENT.</textPath>
                  </text>
                </svg>
                {/* Signature overlay */}
                <img src="/signature.png" alt="Signature" style={{ position: 'absolute', bottom: '-15px', left: '50%', transform: 'translateX(-50%)', width: '90px', zIndex: 10, opacity: 0.9 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettlementBillModal;
