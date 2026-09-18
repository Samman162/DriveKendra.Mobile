import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword as apiResetPassword,
} from '../api/auth';
import { setOnSessionExpired } from '../api/client';
import { deleteUserAccount } from '../api/users';
import type { LoginDto, RegisterDto, ResetPasswordDto, User } from '../types/auth';
import { secureStorage } from '../utils/secureStorage';
import { clearOfflineVouchers } from '../utils/offlineVoucherStorage';

type AuthContextType = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  biometricEnabled: boolean;
  isBiometricSupported: boolean;
  isBiometricEnrolled: boolean;
  isBiometricLocked: boolean;
  biometricType: string;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  authenticateWithBiometrics: (promptMessage?: string) => Promise<boolean>;
  unlockSessionWithBiometrics: () => Promise<boolean>;
  resetBiometricLock: () => void;
  signIn: (dto: LoginDto) => Promise<User>;
  signUp: (dto: RegisterDto) => Promise<void>;
  sendPasswordResetCode: (identifier: string) => Promise<{ message: string; code?: string }>;
  resetPassword: (dto: ResetPasswordDto) => Promise<{ message: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
};


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [biometricEnabled, setBiometricEnabledState] = useState<boolean>(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);
  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState<boolean>(false);
  const [isBiometricLocked, setIsBiometricLocked] = useState<boolean>(false);
  const [biometricType, setBiometricType] = useState<string>('Biometrics');

  /**
   * Check hardware biometric capabilities (Face ID, Touch ID, Biometrics)
   */
  const checkBiometricHardware = useCallback(async () => {
    if (Platform.OS === 'web') return;

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let label = 'Biometrics';
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        label = 'Face ID';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        label = 'Fingerprint';
      }

      setIsBiometricSupported(hasHardware);
      setIsBiometricEnrolled(isEnrolled);
      setBiometricType(label);
    } catch (e) {
      console.warn('[Biometrics] Hardware probe error:', e);
    }
  }, []);

  /**
   * Prompt biometric authentication dialog
   */
  const authenticateWithBiometrics = useCallback(
    async (promptMessage?: string): Promise<boolean> => {
      if (Platform.OS === 'web') return true;

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: promptMessage || `Verify your identity with ${biometricType}`,
          cancelLabel: 'Cancel',
          fallbackLabel: 'Use Password',
          disableDeviceFallback: false,
        });

        return result.success;
      } catch (e) {
        console.warn('[Biometrics] Authentication error:', e);
        return false;
      }
    },
    [biometricType],
  );

  /**
   * Unlock an existing active session that was protected by biometric lock
   */
  const unlockSessionWithBiometrics = useCallback(async (): Promise<boolean> => {
    const success = await authenticateWithBiometrics(`Unlock Drive Kendra with ${biometricType}`);
    if (success) {
      setIsBiometricLocked(false);
    }
    return success;
  }, [authenticateWithBiometrics, biometricType]);

  // Restore hardware-encrypted credentials securely on startup
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        await checkBiometricHardware();

        const [storedUser, storedToken, storedRefreshToken, bioPref] = await Promise.all([
          secureStorage.getUserData(),
          secureStorage.getAccessToken(),
          secureStorage.getRefreshToken(),
          secureStorage.getBiometricEnabled(),
        ]);

        if (storedUser && storedToken) {
          setUser(storedUser);
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);

          if (bioPref) {
            setBiometricEnabledState(true);

            // On mobile native: prompt for biometric unlock if enabled
            if (Platform.OS !== 'web') {
              setIsBiometricLocked(true);
              const authSuccess = await authenticateWithBiometrics(
                'Unlock Drive Kendra to access your trips & bookings',
              );
              if (authSuccess) {
                setIsBiometricLocked(false);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[Auth] Failed to restore hardware-secured auth session:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredAuth();
  }, [authenticateWithBiometrics, checkBiometricHardware]);

  const setBiometricEnabled = async (enabled: boolean) => {
    setBiometricEnabledState(enabled);
    await secureStorage.setBiometricEnabled(enabled);
  };

  const signIn = async (dto: LoginDto): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await loginUser(dto);
      const rawDigits = dto.identifier.replace(/\D/g, '');
      const isAdminLogin =
        res.user.role === 'admin' ||
        rawDigits === '9800000000' ||
        rawDigits === '9801000000' ||
        dto.identifier.toLowerCase().trim() === 'admin@drivekendra.com';

      const finalUser: User = isAdminLogin ? { ...res.user, role: 'admin' } : res.user;

      setUser(finalUser);
      setToken(res.token);
      setRefreshToken(res.refreshToken || null);
      setIsBiometricLocked(false);

      await Promise.all([
        secureStorage.setUserData(finalUser),
        secureStorage.setAccessToken(res.token),
        res.refreshToken ? secureStorage.setRefreshToken(res.refreshToken) : Promise.resolve(),
      ]);

      return finalUser;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (dto: RegisterDto) => {
    setIsLoading(true);
    try {
      const res = await registerUser(dto);
      setUser(res.user);
      setToken(res.token);
      setRefreshToken(res.refreshToken || null);
      setIsBiometricLocked(false);

      await Promise.all([
        secureStorage.setUserData(res.user),
        secureStorage.setAccessToken(res.token),
        res.refreshToken ? secureStorage.setRefreshToken(res.refreshToken) : Promise.resolve(),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordResetCode = async (identifier: string) => {
    return await requestPasswordReset({ identifier });
  };

  const resetPassword = async (dto: ResetPasswordDto) => {
    return await apiResetPassword(dto);
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setIsBiometricLocked(false);
      await Promise.all([
        secureStorage.clearAuthCredentials(),
        secureStorage.clearAdminCredentials(),
        clearOfflineVouchers(),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetBiometricLock = useCallback(() => {
    setIsBiometricLocked(false);
  }, []);

  const deleteAccount = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      await deleteUserAccount(user.id);
    } catch (e) {
      console.warn('[Auth] Delete user account error:', e);
    } finally {
      await signOut();
    }
  };

  // Listen for silent refresh session expiration from apiClient
  useEffect(() => {
    setOnSessionExpired(() => {
      console.warn('[AuthContext] Session expired via API client. Signing out user.');
      void signOut();
    });
    return () => {
      setOnSessionExpired(null);
    };
  }, []);

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    await secureStorage.setUserData(updated);
  };

  const userPhoneDigits = user?.phone ? user.phone.replace(/\D/g, '') : '';
  const isAdmin =
    user?.role === 'admin' ||
    userPhoneDigits === '9800000000' ||
    userPhoneDigits === '9801000000' ||
    user?.email?.toLowerCase().trim() === 'admin@drivekendra.com';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isLoading,
        isAuthenticated: !!user && !!token && !isBiometricLocked,
        isAdmin,
        biometricEnabled,
        isBiometricSupported,
        isBiometricEnrolled,
        isBiometricLocked,
        biometricType,
        setBiometricEnabled,
        authenticateWithBiometrics,
        unlockSessionWithBiometrics,
        resetBiometricLock,
        signIn,
        signUp,
        sendPasswordResetCode,
        resetPassword,
        signOut,
        deleteAccount,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
