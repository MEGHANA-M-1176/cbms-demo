import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { DashboardDetails } from './pages/DashboardDetails';
import { Analytics } from './pages/Analytics';
import { CashOperations } from './pages/CashOperations';
import { Loans } from './pages/Loans';
import { Recovery } from './pages/Recovery';
import { Hrms } from './pages/Hrms';
import { Fraud } from './pages/Fraud';
import { CashierPage } from './pages/CashierPage';
import { Configuration } from './pages/Configuration';
import { OperationsHub } from './pages/OperationsHub';
import { Customers } from './pages/Customers';
import { MyLeaves } from './pages/MyLeaves';
import { LeaveManagement } from './pages/LeaveManagement';
import AdminDashboard from './pages/FieldVisits/AdminDashboard';
import VisitorDashboard from './pages/FieldVisits/VisitorDashboard';
import TaskExecution from './pages/FieldVisits/TaskExecution';
import ConfigurationCenter from './pages/FieldVisits/ConfigurationCenter';
import AssignTask from './pages/FieldVisits/AssignTask';
import { Profile } from './pages/Profile';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#080b11' }}>
      <span>Loading Terminal...</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard/details/:metric" element={<DashboardDetails />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="cash-ops" element={<CashOperations />} />
            <Route path="loans" element={<Loans />} />
            <Route path="recovery" element={<Recovery />} />
            <Route path="hrms" element={<Hrms />} />
            <Route path="leave-management" element={<LeaveManagement />} />
            <Route path="my-leaves" element={<MyLeaves />} />
            <Route path="customers" element={<Customers />} />
            <Route path="fraud" element={<Fraud />} />
            <Route path="teller" element={<CashierPage />} />
            <Route path="operations" element={<OperationsHub />} />
            <Route path="config" element={<Configuration />} />
            <Route path="field-visits/admin" element={<AdminDashboard />} />
            <Route path="field-visits/config" element={<ConfigurationCenter />} />
            <Route path="field-visits/assign" element={<AssignTask />} />
            <Route path="field-visits/my-tasks" element={<VisitorDashboard />} />
            <Route path="field-visits/execute/:taskId" element={<TaskExecution />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
