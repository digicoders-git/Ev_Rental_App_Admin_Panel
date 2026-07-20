const fs = require('fs');
const path = 'd:/Desktop/evRental/evRental/EV_Rental/frontend/src/pages/Franchise.jsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes("import { FileSignature, IndianRupee, FileText }")) {
    code = code.replace(
        "import { \n  Building2", 
        "import { FileSignature, IndianRupee, FileText, UploadCloud, Clock, \n  Building2"
    );
}

// 1. Add "Agreement Upload" action button in Franchise list
code = code.replace(
    /<button className="btn-icon delete" title="Delete Franchise" onClick=\{\(\) => setDeleteId\(f\._id\)\} style=\{\{ color: '#ef4444' \}\}>/g,
    `<button className="btn-icon" title="Upload Agreement" onClick={() => { setSelectedPartner(f); setShowAgreementModal(true); }} style={{ color: '#10b981' }}><FileSignature size={16} /></button>
                      <button className="btn-icon delete" title="Delete Franchise" onClick={() => setDeleteId(f._id)} style={{ color: '#ef4444' }}>`
);

// 2. Add Tabs container
code = code.replace(
    /<div className="franchise-stats">/,
    `<div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <button onClick={() => setActiveTab('partners')} style={{ background: activeTab === 'partners' ? 'var(--primary)' : 'transparent', color: activeTab === 'partners' ? '#fff' : 'var(--text)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Partners & Applications</button>
        <button onClick={() => setActiveTab('withdrawals')} style={{ background: activeTab === 'withdrawals' ? 'var(--primary)' : 'transparent', color: activeTab === 'withdrawals' ? '#fff' : 'var(--text)', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          Withdrawals {withdrawals.filter(w => w.status === 'pending').length > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '10px' }}>{withdrawals.filter(w => w.status === 'pending').length}</span>}
        </button>
      </div>
      
      {activeTab === 'partners' && (
        <>
      <div className="franchise-stats">`
);

// 3. Close the activeTab === 'partners' wrapping and add withdrawals block
code = code.replace(
    /{(showAddModal \|\| showEditModal) && createPortal\(/,
    `</>
      )}

      {activeTab === 'withdrawals' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem' }}>Withdrawal Requests</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Franchise</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No withdrawal requests found</td></tr>
                ) : withdrawals.map(w => (
                  <tr key={w._id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{w.withdrawal_id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{w.franchise?.store_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{w.franchise?.owner_name} | {w.franchise?.mobile}</div>
                    </td>
                    <td>{new Date(w.createdAt).toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: '#10b981' }}>₹{w.amount.toLocaleString()}</td>
                    <td>
                      <span style={{ 
                        color: w.status === 'approved' ? '#10b981' : w.status === 'rejected' ? '#ef4444' : '#f59e0b', 
                        display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.05)', 
                        padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.85rem' 
                      }}>
                        {w.status === 'approved' ? <CheckCircle size={14}/> : w.status === 'rejected' ? <XCircle size={14}/> : <Clock size={14}/>}
                        {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {w.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-sm btn-primary" onClick={() => { setSelectedWithdrawal(w); setShowWithdrawalModal(true); }}>Process</button>
                        </div>
                      ) : w.payment_proof ? (
                        <a href={\`\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}\${w.payment_proof}\`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem' }}><FileText size={14} /> View Proof</a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(showAddModal || showEditModal) && createPortal(`
);

fs.writeFileSync(path, code);
console.log('Success');
