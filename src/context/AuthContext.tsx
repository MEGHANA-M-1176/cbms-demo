import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

interface AuthContextType {
  user: any | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { email: string; phone?: string }) => Promise<void>;
  hasPermission: (perm: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('employeeProfile');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // VERCEL DEMO MOCK
    if (email === 'admin@demo.com' && password === 'Demo123!') {
      const profile = {
        id: 'mock-admin-id',
        fullName: 'Demo Administrator',
        email: 'admin@demo.com',
        role: { name: 'SUPER_ADMIN', permissions: [{ permission: { code: 'CONFIG_EDIT' } }] },
        branchId: 'mock-branch-id'
      };
      const accessToken = 'mock-access-token';
      const refreshToken = 'mock-refresh-token';

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('employeeProfile', JSON.stringify(profile));

      setToken(accessToken);
      setUser(profile);
      return;
    }

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user: profile } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('employeeProfile', JSON.stringify(profile));

      setToken(accessToken);
      setUser(profile);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Clean up even if api logout fails
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('employeeProfile');
      setUser(null);
      setToken(null);
      window.location.href = '/login';
    }
  };

  const updateProfile = async (data: { email: string; phone?: string }) => {
    try {
      const response = await apiClient.patch('/users/profile', data);
      const updatedUser = { ...user, ...response.data };
      setUser(updatedUser);
      localStorage.setItem('employeeProfile', JSON.stringify(updatedUser));
    } catch (error) {
      throw error;
    }
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    
    const roleName = typeof user.role === 'object' ? user.role?.name : user.role;
    if (roleName === 'SUPER_ADMIN' || roleName === 'MANAGER' || roleName === 'BRANCH_MANAGER') return true;

    // Fallback role mappings to navigate UI modules
    if (permissionCode === 'TELLER_OPS' && roleName === 'CASHIER') return true;
    if (permissionCode === 'LOAN_VIEW' && roleName === 'LOAN_OFFICER') return true;
    if (permissionCode === 'RECOVERY_VIEW' && roleName === 'RECOVERY_OFFICER') return true;
    if (permissionCode === 'HR_MANAGE' && roleName === 'HR') return true;
    if (permissionCode === 'AUDIT_VIEW' && roleName === 'AUDITOR') return true;
    if (permissionCode === 'CONFIG_EDIT' && roleName === 'SUPER_ADMIN') return true;

    // Check role permissions from populated model
    const perms = user.role?.permissions || [];
    return perms.some((rp: any) => rp.permission?.code === permissionCode);
  };

  const hasRole = (roleName: string): boolean => {
    const name = typeof user?.role === 'object' ? user.role?.name : user?.role;
    return name === roleName;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateProfile, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

