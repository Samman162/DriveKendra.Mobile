import axios from 'axios';
import { getApiBaseUrl } from './config';
import { secureStorage } from '../utils/secureStorage';
import type {
  AdminCustomer,
  AdminDriver,
  AdminDriverVehicle,
  AdminLoginResponse,
  AdminStats,
  AdminTrip,
  AdminVehicle,
  AdminVerifyPinResponse,
  CreateDriverDto,
  CreateRoadAdvisoryDto,
  CreateVehicleDto,
  CustomerTripHistory,
  RoadAdvisory,
  UpdateDriverDto,
  UpdateVehicleDto,
} from '../types/admin';

export const adminApiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor to inject isolated hardware-stored Admin Token
adminApiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureStorage.getAdminAccessToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('[AdminApi] Failed to load admin access token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Step 1: Submit admin primary credentials (Phone + Password)
 */
export async function loginAdmin(phone: string, password: string): Promise<AdminLoginResponse> {
  const cleanPhone = phone.trim();

  try {
    const res = await adminApiClient.post<AdminLoginResponse>('/admin/login', {
      phone: cleanPhone,
      password,
    });
    return res.data;
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
    if (axiosErr.response?.status === 401) {
      throw new Error(axiosErr.response.data?.message || 'Invalid admin phone number or password.');
    }
    throw new Error(axiosErr.response?.data?.message || 'Admin authentication service unavailable.');
  }
}

/**
 * Step 2: Validate 4-digit Security PIN (6767)
 */
export async function verifyAdminPin(
  challengeToken: string,
  pin: string,
): Promise<AdminVerifyPinResponse> {
  try {
    const res = await adminApiClient.post<AdminVerifyPinResponse>('/admin/verify-pin', {
      challengeToken,
      pin,
    });
    return res.data;
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
    if (axiosErr.response?.status === 401) {
      throw new Error(axiosErr.response.data?.message || 'Incorrect security PIN. Access denied.');
    }
    throw new Error(axiosErr.response?.data?.message || 'Security PIN verification failed.');
  }
}

/**
 * Fetch overview dashboard metrics
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const res = await adminApiClient.get<AdminStats>('/admin/stats');
    return res.data;
  } catch (err) {
    return {
      pendingRequests: 0,
      activeFleet: 0,
      totalUsers: 0,
      totalTrips: 0,
      totalRevenue: 'NPR 0',
    };
  }
}

/**
 * Fetch registered customers directory
 */
export async function getAdminUsers(search?: string): Promise<AdminCustomer[]> {
  try {
    const res = await adminApiClient.get<{ users: AdminCustomer[] }>('/admin/users', {
      params: search ? { q: search } : undefined,
    });
    return res.data.users || [];
  } catch (err) {
    return [];
  }
}

/**
 * Fetch trip history for a specific customer
 */
export async function getCustomerTrips(userId: number): Promise<CustomerTripHistory[]> {
  try {
    const res = await adminApiClient.get<{ trips: CustomerTripHistory[] }>(
      `/admin/users/${userId}/trips`,
    );
    return res.data.trips || [];
  } catch (err) {
    return [];
  }
}

/**
 * Fetch trip requests (pending, confirmed, etc.)
 */
export async function getAdminTrips(status?: string): Promise<AdminTrip[]> {
  try {
    const res = await adminApiClient.get<{ trips: AdminTrip[] }>('/admin/trips', {
      params: status ? { status } : undefined,
    });
    return res.data.trips || [];
  } catch (err) {
    return [];
  }
}

/**
 * Approve trip request and assign specific vehicle, driver, and final pricing
 */
export async function approveAdminTrip(
  bookingId: number,
  payload: number | import('../types/admin').ApproveTripPayload,
): Promise<{ success: boolean; trip?: AdminTrip; booking?: any; message?: string }> {
  const body = typeof payload === 'number' ? { vehicleId: payload } : payload;
  const res = await adminApiClient.patch(`/admin/trips/${bookingId}/approve`, body);
  return res.data;
}

/**
 * Reject trip request with stated reason
 */
export async function rejectAdminTrip(
  bookingId: number,
  reason: string,
): Promise<{ success: boolean; trip?: AdminTrip; message?: string }> {
  const res = await adminApiClient.patch(`/admin/trips/${bookingId}/reject`, { reason });
  return res.data;
}

/**
 * Fetch full vehicle fleet
 */
export async function getAdminVehicles(
  status?: string,
  category?: string,
): Promise<AdminVehicle[]> {
  try {
    const res = await adminApiClient.get<{ vehicles: AdminVehicle[] }>('/admin/vehicles', {
      params: { status, category },
    });
    return res.data.vehicles || [];
  } catch (err) {
    return [];
  }
}

/**
 * Manually register a new vehicle into the fleet
 */
export async function createAdminVehicle(dto: CreateVehicleDto): Promise<AdminVehicle> {
  const res = await adminApiClient.post<{ vehicle: AdminVehicle }>('/admin/vehicles', dto);
  return res.data.vehicle;
}

/**
 * Update vehicle availability or details (e.g. toggle maintenance)
 */
export async function updateAdminVehicle(
  vehicleId: number,
  dto: UpdateVehicleDto,
): Promise<AdminVehicle> {
  const res = await adminApiClient.patch<{ vehicle: AdminVehicle }>(
    `/admin/vehicles/${vehicleId}`,
    dto,
  );
  return res.data.vehicle;
}

/**
 * Complete a confirmed trip and release vehicle back to available status
 */
export async function completeAdminTrip(
  bookingId: number,
): Promise<{ success: boolean; message?: string }> {
  const res = await adminApiClient.patch<{ success: boolean; message: string }>(
    `/admin/trips/${bookingId}/complete`,
  );
  return res.data;
}

/**
 * Fetch list of Himalayan mountain road advisories
 */
export async function getAdminRoadAdvisories(): Promise<RoadAdvisory[]> {
  try {
    const res = await adminApiClient.get<{ advisories: RoadAdvisory[] }>('/admin/advisories');
    return res.data.advisories || [];
  } catch (err: unknown) {
    return [];
  }
}

/**
 * Publish a new road condition advisory bulletin
 */
export async function createAdminRoadAdvisory(
  dto: CreateRoadAdvisoryDto,
): Promise<RoadAdvisory> {
  const res = await adminApiClient.post<{ success: boolean; advisory: RoadAdvisory }>(
    '/admin/advisories',
    dto,
  );
  return res.data.advisory;
}

/**
 * Delete / dismiss a road advisory
 */
export async function deleteAdminRoadAdvisory(id: number): Promise<{ success: boolean }> {
  const res = await adminApiClient.delete<{ success: boolean }>(`/admin/advisories/${id}`);
  return res.data;
}

/**
 * Fetch registered drivers directory
 */
export async function getAdminDrivers(
  status?: string,
  search?: string,
): Promise<AdminDriver[]> {
  try {
    const res = await adminApiClient.get<{ drivers: AdminDriver[] }>('/admin/drivers', {
      params: { status, q: search },
    });
    return res.data.drivers || [];
  } catch (err) {
    return [];
  }
}

/**
 * Register a new driver profile into dka_owners (and syncs to cr_owners)
 */
export async function createAdminDriver(dto: CreateDriverDto): Promise<AdminDriver> {
  const res = await adminApiClient.post<{ success: boolean; driver: AdminDriver }>(
    '/admin/drivers',
    dto,
  );
  return res.data.driver;
}

/**
 * Update driver profile or status
 */
export async function updateAdminDriver(
  id: number,
  updates: UpdateDriverDto,
): Promise<AdminDriver> {
  const res = await adminApiClient.patch<{ success: boolean; driver: AdminDriver }>(
    `/admin/drivers/${id}`,
    updates,
  );
  return res.data.driver;
}


