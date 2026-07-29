import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple concurrent token refresh calls
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // VERCEL DEMO MOCK: Only runs if hosted on Vercel to preserve local functionality
    const isVercel = window.location.hostname.includes('vercel.app');
    const url = config.url || '';
    
    if (isVercel) {
      if (url.includes('/dashboard/summary')) {
        config.adapter = async () => ({
          data: {
            totalDeposits: { amount: 15420000, accountCount: 124 },
            totalLoansOutstanding: 8500000,
            loans: {
              totalSecuredLoansBalance: 6000000,
              totalUnsecuredLoansBalance: 2500000,
              running: 42, closed: 15, interestEarned: 450000,
              totalCollections: 1200000, upcomingEmis: 8, overdue: 2,
              npaCount: 1, npaPercentage: 2.3
            },
            financials: { profitability: 1200000, workingCapital: 5500000, turnover: 45000000 },
            members: { active: 350, inactive: 45, dormant: 12 },
            staffActiveToday: 5
          },
          status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/dashboard/trend') || url.includes('/dashboard/interest-payable/trend')) {
        config.adapter = async () => ({
          data: [
            { period: 'Jan', deposits: 1000000, withdrawals: 800000, loanCollection: 500000, totalAccrued: 20000 },
            { period: 'Feb', deposits: 1200000, withdrawals: 900000, loanCollection: 600000, totalAccrued: 25000 },
            { period: 'Mar', deposits: 1500000, withdrawals: 1100000, loanCollection: 700000, totalAccrued: 30000 }
          ],
          status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/dashboard/period-comparison')) {
        config.adapter = async () => ({
          data: { sameLastYear: { growthVsCurrent: { deposits: 12.5, loanCollection: 8.4 } } },
          status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/dashboard/staff-activity/by-branch')) {
        config.adapter = async () => ({
          data: [
            { branchId: 'b1', branchName: 'Main Branch', activeToday: 3, totalStaff: 5, activePercentage: 60 },
            { branchId: 'b2', branchName: 'Downtown', activeToday: 2, totalStaff: 4, activePercentage: 50 }
          ],
          status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/dashboard/staff-activity')) {
        config.adapter = async () => ({
          data: [
            { userId: '1', fullName: 'Demo Staff', employeeCode: 'EMP001', role: 'CASHIER', activeToday: true, lastLoginAt: new Date().toISOString() }
          ],
          status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/auth/logout')) {
        config.adapter = async () => ({ data: { success: true }, status: 200, statusText: 'OK', headers: {}, config });
      } else if (url.includes('/config/loan-types')) {
        config.adapter = async () => ({
          data: [
            { id: 'lt1', name: 'Personal Loan', maxAmount: 500000 },
            { id: 'lt2', name: 'Gold Loan', maxAmount: 1000000 },
            { id: 'lt3', name: 'Housing Loan', maxAmount: 2500000 }
          ],
          status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/customers/search') || url.includes('/customers')) {
        config.adapter = async () => ({
          data: [
            { id: 'c1', fullName: 'Dinesh Kumar', memberId: 'MEM-001', phone: '9876543210' },
            { id: 'c2', fullName: 'Dinesh Sharma', memberId: 'MEM-002', phone: '9876543211' },
            { id: 'c3', fullName: 'Priya Patel', memberId: 'MEM-003', phone: '9876543212' },
            { id: 'c4', fullName: 'Priya Singh', memberId: 'MEM-004', phone: '9876543213' },
            { id: 'c5', fullName: 'Rahul Verma', memberId: 'MEM-005', phone: '9876543214' },
            { id: 'c6', fullName: 'Anita Desai', memberId: 'MEM-006', phone: '9876543215' },
            { id: 'c7', fullName: 'Vikram Mehta', memberId: 'MEM-007', phone: '9876543216' },
            { id: 'c8', fullName: 'Sneha Reddy', memberId: 'MEM-008', phone: '9876543217' }
          ],
          status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/loans/calculate') || url.includes('/loans/eligibility')) {
        config.adapter = async () => ({
          data: { eligible: true, monthlyEmi: 4500, maxEligibleAmount: 100000 },
          status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/loans/assigned') || url.includes('/loans/pending') || url.includes('/loans/approved')) {
        config.adapter = async () => ({
          data: [],
          status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/field-visits/dashboard/metrics')) {
        config.adapter = async () => ({
          data: { total: 10, pending: 5, inProgress: 2, completed: 3 },
          status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/field-visits/tasks')) {
        config.adapter = async () => ({
          data: [
            { id: '1', title: 'KYC Verification', status: 'PENDING', priority: 'HIGH', customerName: 'Dinesh Kumar', createdAt: new Date().toISOString() }
          ],
          status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/field-visits/configs/')) {
        config.adapter = async () => ({
          data: [],
          status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/accounts?accountNumber=')) {
        config.adapter = async () => ({
          data: [
            { 
              id: 'acc1', 
              accountNumber: 'SAV000001', 
              accountType: { name: 'Savings Account' }, 
              balance: 55000, 
              status: 'ACTIVE',
              customer: { fullName: 'Dinesh Kumar', phone: '9876543210' } 
            }
          ],
          status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/config/payment-modes')) {
        config.adapter = async () => ({
          data: [
            { id: 'pm1', name: 'Cash' }, { id: 'pm2', name: 'Account Transfer' },
            { id: 'pm3', name: 'Cheque' }, { id: 'pm4', name: 'NEFT' },
            { id: 'pm5', name: 'RTGS' }, { id: 'pm6', name: 'IMPS' },
            { id: 'pm7', name: 'UPI' }, { id: 'pm8', name: 'Demand Draft' }
          ], status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/config/deposit-types')) {
        config.adapter = async () => ({
          data: [
            { id: 'dt1', name: 'Fixed Deposit (FD)' }, { id: 'dt2', name: 'Recurring Deposit (RD)' },
            { id: 'dt3', name: 'Savings Account' }, { id: 'dt4', name: 'Current Account' },
            { id: 'dt5', name: 'Pigmy Deposit' }
          ], status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/hrms/leaves/policies')) {
        config.adapter = async () => ({
          data: [
            { id: 'lp1', name: 'ANNUAL', totalDays: 12 }, { id: 'lp2', name: 'SICK', totalDays: 6 },
            { id: 'lp3', name: 'CASUAL', totalDays: 4 }, { id: 'lp4', name: 'MATERNITY', totalDays: 180 },
            { id: 'lp5', name: 'PATERNITY', totalDays: 15 }, { id: 'lp6', name: 'UNPAID', totalDays: 365 }
          ], status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/users') || url.includes('/field-visits/employees')) {
        config.adapter = async () => ({
          data: [
            { id: 'u1', fullName: 'Ramesh Kumar', email: 'ramesh@demo.com' },
            { id: 'u2', fullName: 'Sneha Sharma', email: 'sneha@demo.com' },
            { id: 'u3', fullName: 'Arjun Reddy', email: 'arjun@demo.com' },
            { id: 'u4', fullName: 'Priya Patel', email: 'priya.p@demo.com' },
            { id: 'u5', fullName: 'Vikram Singh', email: 'vikram@demo.com' }
          ], status: 200, statusText: 'OK', headers: {}, config
        });
      } else if (url.includes('/hrms/payslips')) {
        config.adapter = async () => ({
          data: [
            { id: 'ps1', employee: { fullName: 'Ramesh Kumar', employeeCode: 'EMP-001' }, pfDeduction: 1800, esiDeduction: 250, taxDeduction: 3200, netSalary: 45000 },
            { id: 'ps2', employee: { fullName: 'Sneha Sharma', employeeCode: 'EMP-002' }, pfDeduction: 2200, esiDeduction: 300, taxDeduction: 4500, netSalary: 55000 },
            { id: 'ps3', employee: { fullName: 'Arjun Reddy', employeeCode: 'EMP-003' }, pfDeduction: 1500, esiDeduction: 200, taxDeduction: 1800, netSalary: 38500 }
          ], status: 200, statusText: 'OK', headers: {}, config
        });
      } else {
        // Fallback for any other unmocked endpoint (My Leaves, Operations, HRMS, etc)
        config.adapter = async () => ({
          data: [],
          status: 200, statusText: 'OK', headers: {}, config
        });
      }
    }

    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for handling token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if auth requests fail
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            if (err.response?.status === 401) handleLogout();
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        handleLogout();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {
          refreshToken,
        });

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return apiClient(originalRequest).catch((err) => {
          if (err.response?.status === 401) handleLogout();
          return Promise.reject(err);
        });
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        handleLogout();
        return Promise.reject(refreshError);
      }
    } else if (error.response?.status === 401 && originalRequest._retry) {
      handleLogout();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

function handleLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('employeeProfile');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export default apiClient;

