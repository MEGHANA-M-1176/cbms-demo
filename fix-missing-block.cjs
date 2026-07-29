const fs = require('fs');
let c = fs.readFileSync('src/pages/Loans.tsx', 'utf8');

// I will extract tabsContentHtml from rebuild-loans.cjs
let rebuild = fs.readFileSync('rebuild-loans.cjs', 'utf8');
let tabsContentHtml = rebuild.split('const tabsContentHtml = `')[1].split('`;')[0];

c = c.replace('{/* New Loan Application Modal */}', tabsContentHtml + '\n      {/* New Loan Application Modal */}');
fs.writeFileSync('src/pages/Loans.tsx', c);
