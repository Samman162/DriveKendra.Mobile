import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { secureStorage } from '../utils/secureStorage';
import { getApiBaseUrl } from './config';

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Dedicated un-intercepted client for token refresh calls to prevent recursive loops
const refreshClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Mutex & pending request queue for concurrent requests during token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// 1. REQUEST INTERCEPTOR: Inject Hardware-Secured JWT Access Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const accessToken = await secureStorage.getAccessToken();
      if (accessToken && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (e) {
      console.warn('[ApiClient] Failed to retrieve secure access token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 2. RESPONSE INTERCEPTOR: Catch 401 Unauthorized and Silently Refresh Token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & {
      _retry?: boolean;
      _retried?: boolean;
    }) | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const requestUrl = originalRequest.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password');

    // Handle 401 Unauthorized -> Refresh Access Token Flow (protected endpoints only)
    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue parallel requests until token refresh completes
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Request new access token using stored refresh token
        const response = await refreshClient.post<{
          token: string;
          refreshToken?: string;
        }>('/auth/refresh', {
          refreshToken,
        });

        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;

        if (!newAccessToken) {
          throw new Error('Invalid token refresh response from server');
        }

        // Store new access token in hardware-backed storage
        await secureStorage.setAccessToken(newAccessToken);
        if (newRefreshToken) {
          await secureStorage.setRefreshToken(newRefreshToken);
        }

        // Set global default auth header
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        // Release queued requests with new token
        processQueue(null, newAccessToken);

        // Retry original request with newly issued token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.warn('[ApiClient] Silent token refresh failed. Clearing session:', refreshError);
        processQueue(refreshError, null);
        await secureStorage.clearAuthCredentials();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Network timeout / 5xx retry mechanism
    const timeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout');
    const retryable = timeout || status === undefined || status >= 500;
    if (retryable && !originalRequest._retried) {
      originalRequest._retried = true;
      return apiClient(originalRequest);
    }

    return Promise.reject(error);
  },
);
