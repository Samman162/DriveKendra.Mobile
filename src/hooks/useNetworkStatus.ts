import { useCallback, useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isOffline: boolean;
  connectionType: string;
  isCellular: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook to monitor device network state and detect offline conditions
 * in remote Himalayan / low-connectivity mountain zones.
 */
export function useNetworkStatus(): NetworkStatus {
  const [netState, setNetState] = useState<NetInfoState | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      setNetState(state);
    } catch {
      // Default to optimistic state if check fails
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    checkStatus();

    // Subscribe to connectivity updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetState(state);
    });

    return () => {
      unsubscribe();
    };
  }, [checkStatus]);

  const isConnected = netState?.isConnected ?? true;
  const isInternetReachable = netState?.isInternetReachable ?? true;
  // If either is explicitly false, device is in offline / low-signal dead zone
  const isOffline = !isConnected || isInternetReachable === false;
  const connectionType = netState?.type ?? 'unknown';
  const isCellular = connectionType === 'cellular';

  return {
    isConnected,
    isInternetReachable,
    isOffline,
    connectionType,
    isCellular,
    refresh: checkStatus,
  };
}
