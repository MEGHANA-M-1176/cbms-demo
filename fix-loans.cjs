const fs = require('fs');
let c = fs.readFileSync('src/pages/Loans.tsx', 'utf8');
c = c.replace(
  "const [assignedRes, pendingRes] = await Promise.all([\\n        apiClient.get('/loans/assigned'),\\n        apiClient.get('/loans/pending').catch(() => ({ data: [] }))\\n      ]);",
  "const [assignedRes, pendingRes, approvedRes] = await Promise.all([\\n        apiClient.get('/loans/assigned'),\\n        apiClient.get('/loans/pending').catch(() => ({ data: [] })),\\n        apiClient.get('/loans/approved').catch(() => ({ data: [] }))\\n      ]);"
);
fs.writeFileSync('src/pages/Loans.tsx', c);
