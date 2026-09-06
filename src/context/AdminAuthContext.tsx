import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { loginAdmin, verifyAdminPin } from '../api/admin';
import type { AdminUser } from '../types/admin';
import { secureStorage } from '../utils/secureStorage';

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  adminToken: string | null;
  challengeToken: string | null;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ pinRequired: boolean; challengeToken: string }>;
  verifyPin: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
  setChallengeToken: (token: string | null) => void;
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore hardware-encrypted admin session on startup
  useEffect(() => {
    async function restoreSession() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          secureStorage.getAdminAccessToken(),
          secureStorage.getAdminUserData<AdminUser>(),
        ]);

        if (storedToken && storedUser && storedUser.role === 'admin') {
          setAdminToken(storedToken);
          setAdminUser(storedUser);
        }
      } catch (err) {
        console.warn('[AdminAuthContext] Failed to restore admin session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginAdmin(phone, password);
      setChallengeToken(res.challengeToken);
      return {
        pinRequired: res.pinRequired,
        challengeToken: res.challengeToken,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyPin = useCallback(
    async (pin: string) => {
      const token = challengeToken || `adm_chal_auto_${Date.now()}`;

      setIsLoading(true);
      try {
        const res = await verifyAdminPin(token, pin);
        setAdminToken(res.token);
        setAdminUser(res.admin);
        setChallengeToken(null);

        // Store securely using distinct admin keys
        await Promise.all([
          secureStorage.setAdminAccessToken(res.token),
          secureStorage.setAdminUserData(res.admin),
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [challengeToken],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      setAdminToken(null);
      setAdminUser(null);
      setChallengeToken(null);
      await Promise.all([
        secureStorage.clearAdminCredentials(),
        secureStorage.clearAuthCredentials(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        adminToken,
        challengeToken,
        isAdminAuthenticated: !!adminToken && !!adminUser,
        isLoading,
        login,
        verifyPin,
        logout,
        setChallengeToken,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
