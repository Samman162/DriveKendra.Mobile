import { useCallback, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricStatus = {
  isAvailable: boolean;
  hasEnrolled: boolean;
  biometricTypes: LocalAuthentication.AuthenticationType[];
  typeLabel: string;
};

export function useBiometrics() {
  const [status, setStatus] = useState<BiometricStatus>({
    isAvailable: false,
    hasEnrolled: false,
    biometricTypes: [],
    typeLabel: 'Biometrics',
  });

  useEffect(() => {
    async function checkSupport() {
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

        setStatus({
          isAvailable: hasHardware,
          hasEnrolled: isEnrolled,
          biometricTypes: supportedTypes,
          typeLabel: label,
        });
      } catch (e) {
        console.warn('Biometric check error:', e);
      }
    }

    checkSupport();
  }, []);

  const authenticate = useCallback(async (promptMessage = 'Unlock Drive Kendra with Biometrics'): Promise<boolean> => {
    if (Platform.OS === 'web') return true;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (e) {
      console.warn('Authentication error:', e);
      return false;
    }
  }, []);

  return {
    ...status,
    authenticate,
  };
}
