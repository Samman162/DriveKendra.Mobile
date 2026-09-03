import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EmergencyContact {
  label: string;
  phone: string;
  role: string;
}

export interface OfflineVoucher {
  id: string;
  bookingRef: string;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  tripType: 'One Way' | 'Round Trip' | string;
  passengerCount?: number;
  vehicleName: string;
  vehiclePlate: string;
  fare: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  cachedAt: string;
  verificationCode: string;
  emergencyHotline: string;
  policeEmergency: string;
  touristPolice: string;
  altitudeNote?: string;
}

const STORAGE_KEYS = {
  OFFLINE_VOUCHERS: '@drivekendra_offline_vouchers_v1',
  ACTIVE_VOUCHER: '@drivekendra_active_offline_voucher_v1',
};

const DEFAULT_EMERGENCY_HOTLINE = '+9779851363783';
const DEFAULT_POLICE = '100';
const DEFAULT_TOURIST_POLICE = '1144';

/**
 * Format a trip record into a persistent offline voucher with emergency metadata
 */
export function formatToOfflineVoucher(trip: any): OfflineVoucher {
  const ref = String(trip.bookingRef || 'DK-REF');
  const refDigits = ref.replace(/\D/g, '') || '0000';
  return {
    id: String(trip.id || `trip_${Date.now()}`),
    bookingRef: ref,
    pickup: String(trip.pickup || ''),
    dropoff: String(trip.dropoff || ''),
    date: String(trip.date || ''),
    time: String(trip.time || ''),
    tripType: trip.tripType || 'One Way',
    passengerCount: trip.passengerCount ?? 1,
    vehicleName: String(trip.vehicleName || 'Vehicle'),
    vehiclePlate: String(trip.vehiclePlate || 'TBD'),
    fare: String(trip.fare || 'NPR 0'),
    status: trip.status || 'confirmed',
    cachedAt: new Date().toISOString(),
    verificationCode: `DK-VERIFY-${refDigits}-${Math.floor(1000 + Math.random() * 9000)}`,
    emergencyHotline: DEFAULT_EMERGENCY_HOTLINE,
    policeEmergency: DEFAULT_POLICE,
    touristPolice: DEFAULT_TOURIST_POLICE,
    altitudeNote: trip.dropoff?.toLowerCase().includes('muktinath')
      ? 'High Altitude Zone (3,710m) - 4x4 Ready'
      : trip.dropoff?.toLowerCase().includes('kalinchowk')
        ? 'High Altitude Snow Zone (3,842m)'
        : undefined,
  };
}

/**
 * Save all upcoming trips to persistent offline storage
 */
export async function saveOfflineVouchers(trips: any[]): Promise<void> {
  try {
    if (!trips || trips.length === 0) {
      await clearOfflineVouchers();
      return;
    }

    const vouchers: OfflineVoucher[] = trips.map(formatToOfflineVoucher);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_VOUCHERS, JSON.stringify(vouchers));

    // Also persist the first confirmed upcoming trip as the primary active voucher
    const active = vouchers.find((v) => v.status === 'confirmed') || vouchers[0];
    if (active) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_VOUCHER, JSON.stringify(active));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_VOUCHER);
    }
  } catch (error) {
    console.warn('[OfflineVoucher] Failed to save vouchers to AsyncStorage:', error);
  }
}

/**
 * Retrieve all cached vouchers from offline storage
 */
export async function getOfflineVouchers(): Promise<OfflineVoucher[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_VOUCHERS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.warn('[OfflineVoucher] Failed to read cached vouchers:', error);
    return [];
  }
}

/**
 * Retrieve primary active offline voucher for Mountain Emergency Mode
 */
export async function getActiveOfflineVoucher(): Promise<OfflineVoucher | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_VOUCHER);
    if (raw) {
      return JSON.parse(raw);
    }
    const all = await getOfflineVouchers();
    return all.find((v) => v.status === 'confirmed') || all[0] || null;
  } catch (error) {
    console.warn('[OfflineVoucher] Failed to read active voucher:', error);
    return null;
  }
}

/**
 * Clear cached offline vouchers
 */
export async function clearOfflineVouchers(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEYS.OFFLINE_VOUCHERS, STORAGE_KEYS.ACTIVE_VOUCHER]);
  } catch (error) {
    console.warn('[OfflineVoucher] Failed to clear vouchers:', error);
  }
}
