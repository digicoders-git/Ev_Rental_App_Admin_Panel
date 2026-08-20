import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Printer } from 'lucide-react';

const convertNumberToWords = (amount) => {
    const single = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    amount = Math.floor(amount);
    if (amount === 0) return 'Zero Only';
    
    let str = "";
    let n = amount;
    let x = 0;
    
    while(n > 0) {
        let chunk = 0;
        if (x === 0) {
            chunk = n % 1000;
            n = Math.floor(n / 1000);
        } else {
            chunk = n % 100;
            n = Math.floor(n / 100);
        }
        
        let word = "";
        let c = Math.floor(chunk / 100);
        let b = Math.floor((chunk % 100) / 10);
        let a = chunk % 10;
        
        if (c > 0) word += single[c] + " Hundred ";
        if (b === 1) word += double[a] + " ";
        else {
            if (b > 1) word += tens[b] + " ";
            if (a > 0) word += single[a] + " ";
        }
        
        if (word !== "") {
            if (x === 1) str = word + "Thousand " + str;
            else if (x === 2) str = word + "Lakh " + str;
            else if (x === 3) str = word + "Crore " + str;
            else str = word + str;
        }
        x++;
    }
    return `Indian Rupee ${str.trim()} Only`;
};

const BookingInvoiceModal = ({ invoice, onClose, onPrint }) => {
  if (!invoice) return null;

  const totalAmount = Number(invoice.total_amount) || 0;
  const taxableAmount = totalAmount / 1.05;
  const gstAmount = (totalAmount - taxableAmount) / 2;
  const dateStr = new Date(invoice.createdAt).toLocaleDateString('en-GB');
  const planName = invoice.booking?.plan?.plan_name || 'Platinum Rental Plan ( Electric Vehicle without Operator )';
  const orderId = invoice.booking?.booking_id || 'N/A';
  const asset = invoice.booking?.vehicle?.registration_number || 'N/A';
  const amountInWords = convertNumberToWords(totalAmount);
  const isPaid = invoice.status === 'paid';
  const customerStateRaw = invoice.user?.state || invoice.franchise?.state || invoice.booking?.franchise?.state || 'uttar pradesh';
  const customerState = customerStateRaw.toLowerCase().trim();
  const isUP = ['uttar pradesh', 'up', 'u.p.', 'u p'].includes(customerState);
  const placeOfSupplyText = isUP ? 'Uttar Pradesh (09)' : (invoice.user?.state || 'Other State');

  const handleWhatsApp = () => {
    const mobile = invoice.user?.mobile || '';
    if (!mobile) return alert("Customer mobile number not found!");
    // Remove any +91 or 91 if it already exists, to prevent duplicate country codes, but assuming standard 10 digits
    let cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length === 10) cleanMobile = '91' + cleanMobile;
    
    const text = `Hello ${invoice.user?.name || 'Customer'},\n\nYour invoice for EV Rental Order #${orderId} is generated.\nTaxable Amount: ₹${taxableAmount.toFixed(2)}\nTotal Amount: ₹${totalAmount}\nBalance Due: ₹${isPaid ? '0' : totalAmount}\n\nThank you for choosing Tris Electric!`;
    window.open(`https://wa.me/${cleanMobile}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', 
      zIndex: 9999, overflowY: 'auto', padding: '20px 10px',
      display: 'block'
    }}>
      <style>{`
        .invoice-print-container table { width: 100% !important; border-collapse: collapse !important; margin: 0 !important; background: transparent !important; }
        .invoice-print-container th, .invoice-print-container td { 
          border: 1px solid #000 !important; 
          background: transparent !important; 
        }
        .invoice-print-container tr { background: transparent !important; }
        .invoice-print-container tr:hover td { background: transparent !important; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        {/* Modal Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '15px' }} onClick={(e) => e.stopPropagation()}>
          <button onClick={handleWhatsApp} style={{
            padding: '8px 16px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            Send on WhatsApp
          </button>
          <button onClick={() => { onClose(); onPrint(invoice._id, invoice.invoice_number); }} style={{
            padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600
          }}>
            <Download size={16} /> Download File
          </button>
          <button onClick={onClose} style={{
            padding: '8px 16px', background: '#fff', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <X size={16} /> Close
          </button>
        </div>

        {/* Invoice Document */}
        <div className="invoice-print-container" onClick={(e) => e.stopPropagation()} style={{
          background: '#fff',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          fontFamily: "Arial, sans-serif",
          color: '#000',
          padding: '20px 25px', // Reduced padding to make invoice take less vertical space
          boxSizing: 'border-box',
          position: 'relative'
        }}>
          
          {/* Header section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderBottom: '2px solid #2563eb', paddingBottom: '15px', marginBottom: '15px' }}>
          {/* Left: Logo & Company Info */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <img src="/logo.png" alt="Tris Electric" style={{ height: '70px', objectFit: 'contain', flexShrink: 0 }} />
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold', color: '#000' }}>TRIS ELECTRIC</h2>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 'bold', color: '#1e3a8a' }}>JUNGLEBAN ENTERPRISES</h3>
              <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', color: '#334155' }}>
                Jungleban Enterprises, Alambagh, Lucknow<br/>
                Uttar Pradesh - 226005<br/>
                GSTIN : 09DTTPS1540G1Z7
              </p>
            </div>
          </div>

          {/* Right: Tax Invoice & Details */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <h1 style={{ margin: '0 0 15px 0', fontSize: '24px', color: '#1e3a8a', fontWeight: 'normal' }}>TAX INVOICE</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#334155' }}>
              <div style={{ display: 'flex' }}><span style={{ width: '90px' }}>Invoice No.</span><span>: {invoice.invoice_number}</span></div>
              <div style={{ display: 'flex' }}><span style={{ width: '90px' }}>Invoice Date</span><span>: {dateStr}</span></div>
              <div style={{ display: 'flex' }}><span style={{ width: '90px' }}>Terms</span><span>: Due on Receipt</span></div>
              <div style={{ display: 'flex' }}><span style={{ width: '90px' }}>Due Date</span><span>: {dateStr}</span></div>
              <div style={{ display: 'flex' }}><span style={{ width: '90px' }}>P.O. #</span><span>: {invoice.invoice_number}</span></div>
              <div style={{ display: 'flex' }}><span style={{ width: '90px' }}>Place Of Supply</span><span>: {placeOfSupplyText}</span></div>
            </div>
          </div>
        </div>

        {/* Buyer Info */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e3a8a', fontWeight: 'bold' }}>Buyer (Bill To)</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#000' }}>
            {invoice.user?.name || 'Customer'} - {invoice.user?.mobile || 'N/A'}
          </p>
        </div>

        {/* Items Table */}
        <table className="items-table" style={{ fontSize: '12px', marginBottom: '20px' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 4px', width: '8%', textAlign: 'center', fontWeight: 'bold' }}>SL<br/>NO.</th>
              <th style={{ padding: '10px 4px', width: '42%', textAlign: 'center', fontWeight: 'bold' }}>SERVICES & DESCRIPTION</th>
              <th style={{ padding: '10px 4px', width: '10%', textAlign: 'center', fontWeight: 'bold' }}>HSN/SAC</th>
              <th style={{ padding: '10px 4px', width: '10%', textAlign: 'center', fontWeight: 'bold' }}>QTY</th>
              <th style={{ padding: '10px 4px', width: '15%', textAlign: 'center', fontWeight: 'bold' }}>RATE<br/>(₹)</th>
              <th style={{ padding: '10px 4px', width: '15%', textAlign: 'center', fontWeight: 'bold' }}>AMOUNT<br/>(₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '15px 8px', textAlign: 'center', verticalAlign: 'top' }}>1</td>
              <td style={{ padding: '15px 8px', verticalAlign: 'top', lineHeight: '1.5', wordBreak: 'break-word' }}>
                <strong>{planName}</strong><br/>
                Order #{orderId} - Asset: {asset}
              </td>
              <td style={{ padding: '15px 8px', textAlign: 'center', verticalAlign: 'top' }}>997311</td>
              <td style={{ padding: '15px 8px', textAlign: 'center', verticalAlign: 'top' }}>1 Nos</td>
              <td style={{ padding: '15px 8px', textAlign: 'right', verticalAlign: 'top' }}>{taxableAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              <td style={{ padding: '15px 8px', textAlign: 'right', verticalAlign: 'top' }}>{taxableAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>

        {/* Bottom Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          
          {/* Bottom Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ border: '1px solid #93c5fd', borderRadius: '4px', padding: '10px', display: 'flex', fontSize: '12px', alignItems: 'center' }}>
              <span style={{ width: '120px' }}>Quantity in Total</span><span>: &nbsp;<strong>1 Nos</strong></span>
            </div>
            
            <div style={{ border: '1px solid #93c5fd', borderRadius: '4px', padding: '10px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#1e3a8a', fontWeight: 'bold' }}>Total In Words</h4>
              <p style={{ margin: 0, fontSize: '11px', color: '#475569' }}>{amountInWords}</p>
            </div>
            
            <div style={{ border: '1px solid #93c5fd', borderRadius: '4px', padding: '10px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', background: '#1e3a8a', color: '#fff', display: 'inline-block', padding: '3px 6px' }}>Company's Bank Details</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', color: '#334155' }}>
                <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>Bank Name</span><span>: Canara Bank</span></div>
                <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>A/c No.</span><span>: 120024164312</span></div>
                <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>Branch & IFSC</span><span>: Alambagh Branch & CNRB0001258</span></div>
              </div>
            </div>
            
            <div style={{ border: '1px solid #93c5fd', borderRadius: '4px', padding: '10px' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', background: '#1e3a8a', color: '#fff', display: 'inline-block', padding: '3px 6px' }}>Declaration :</h4>
              <p style={{ margin: 0, fontSize: '11px', lineHeight: '1.4', color: '#475569' }}>
                We declare that this invoice shows the actual price of the Services described and that all particulars are true and correct.
              </p>
            </div>
          </div>
          
          {/* Bottom Right */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Total Taxable Amount</span>
                <span>{taxableAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #cbd5e1' }}>
                <span style={{ fontWeight: 'bold' }}>CGST {isUP ? '2.5%' : '0%'}</span>
                <span>{isUP ? gstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #cbd5e1' }}>
                <span style={{ fontWeight: 'bold' }}>SGST {isUP ? '2.5%' : '0%'}</span>
                <span>{isUP ? gstAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #cbd5e1' }}>
                <span style={{ fontWeight: 'bold' }}>IGST {!isUP ? '5%' : '0%'}</span>
                <span>{!isUP ? (gstAmount * 2).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #000', fontSize: '16px', fontWeight: 'bold' }}>
                <span>Total</span>
                <span>₹{totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                <span>Payment Made (-)</span>
                <span>{isPaid ? totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #000', fontSize: '15px', fontWeight: 'bold' }}>
                <span>Balance Due</span>
                <span>₹{isPaid ? '0.00' : totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>

            {/* Signature Area */}
            <div style={{ textAlign: 'center', marginTop: 'auto', alignSelf: 'center', position: 'relative' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>for <strong>TRIS ELECTRIC</strong></p>
              <p style={{ margin: 0, fontSize: '13px', color: '#1e3a8a', fontWeight: 'bold' }}>JUNGLEBAN ENTERPRISES</p>
              
              <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '10px 0' }}>
                {/* Stamp */}
                <div style={{
                  width: '90px', height: '90px', borderRadius: '50%', border: '2px solid #1e3a8a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute',
                  color: '#1e3a8a', fontSize: '9px', fontWeight: 'bold', textAlign: 'center', opacity: 0.8
                }}>
                  <div style={{
                     width: '75px', height: '75px', borderRadius: '50%', border: '1px solid #1e3a8a',
                     display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{ transform: 'rotate(-20deg)', letterSpacing: '1px' }}>
                      TRIS ELECTRIC<br/><br/>
                      JUNGLEBAN<br/>ENTERPRISES
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ borderTop: '1px dashed #000', paddingTop: '8px', fontSize: '13px', width: '180px', margin: '0 auto' }}>
                Authorized signatory
              </div>
            </div>

          </div>
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
};

export default BookingInvoiceModal;
