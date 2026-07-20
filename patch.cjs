const fs = require('fs');
const bookingsPath = 'd:/Desktop/evRental/evRental/EV_Rental/frontend/src/pages/Bookings.jsx';
const fridesPath = 'd:/Desktop/evRental/evRental/EV_Rental/frontend/src/pages/franchisePanel/FRides.jsx';
const bookingsCode = fs.readFileSync(bookingsPath, 'utf8');
let fridesCode = fs.readFileSync(fridesPath, 'utf8');

const invoiceLogicRegex = /(const handleViewBill = async [\s\S]*?win\.document\.close\(\);\n  };)/;
const invoiceLogicMatch = bookingsCode.match(invoiceLogicRegex);
if (!invoiceLogicMatch) { console.error('Logic not found'); process.exit(1); }
const invoiceLogic = invoiceLogicMatch[1];

const invoiceModalRegex = /({showInvoiceModal && invoiceData(?: && createPortal\(| \? createPortal\()[\s\S]*?document\.body\n\s*\)}?)/;
const invoiceModalMatch = bookingsCode.match(invoiceModalRegex);
if (!invoiceModalMatch) { console.error('Modal not found'); process.exit(1); }
const invoiceModal = invoiceModalMatch[1];

fridesCode = fridesCode.replace(
  /import {([^}]+)} from 'lucide-react';/,
  (match, p1) => {
    if (!p1.includes('Receipt')) p1 += ', Receipt';
    if (!p1.includes('Download')) p1 += ', Download';
    return `import {${p1}} from 'lucide-react';`;
  }
);
fridesCode = fridesCode.replace(
  /import {([^}]+)} from '\.\.\/\.\.\/services\/apiServices';/,
  (match, p1) => {
    if (!p1.includes('getInvoiceByBooking')) p1 += ', getInvoiceByBooking';
    return `import {${p1}} from '../../services/apiServices';`;
  }
);

if (!fridesCode.includes('showInvoiceModal')) {
  fridesCode = fridesCode.replace(
    /const { loading, call } = useApi\(\);/,
    `const [showInvoiceModal, setShowInvoiceModal] = useState(false);\n  const [invoiceData, setInvoiceData] = useState(null);\n  const [loadingInvoice, setLoadingInvoice] = useState(false);\n  const { loading, call } = useApi();`
  );

  fridesCode = fridesCode.replace(
    /const fmt = \(d\)/,
    `${invoiceLogic}\n\n  const fmt = (d)`
  );

  fridesCode = fridesCode.replace(
    /<button className="btn-icon" title="View" onClick=\{\(\) => setSelected\(b\)\}/,
    `<button className="btn-icon" title="View Bill" style={{ color: '#10b981' }} onClick={() => handleViewBill(b._id)}><Receipt size={15} /></button>\n                          <button className="btn-icon" title="View" onClick={() => setSelected(b)}`
  );

  fridesCode = fridesCode.replace(
    /(\s+)<\/div>\n  \);\n};\n\nexport default FRides;/,
    `$1\n      {/* ── INVOICE MODAL ── */}\n      ${invoiceModal}\n$1</div>\n  );\n};\n\nexport default FRides;`
  );

  fs.writeFileSync(fridesPath, fridesCode);
  console.log('Success');
} else {
  console.log('Already patched!');
}
