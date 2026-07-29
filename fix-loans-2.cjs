const fs = require('fs');
let c = fs.readFileSync('src/pages/Loans.tsx', 'utf8');
c = c.replace(
  "const [assignedRes, pendingRes] = await Promise.all([",
  "const [assignedRes, pendingRes, approvedRes] = await Promise.all(["
);
c = c.replace(
  "apiClient.get('/loans/pending').catch(() => ({ data: [] }))",
  "apiClient.get('/loans/pending').catch(() => ({ data: [] })),\n        apiClient.get('/loans/approved').catch(() => ({ data: [] }))"
);
fs.writeFileSync('src/pages/Loans.tsx', c);
