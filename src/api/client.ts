import axios, { type AxiosError } from 'axios';

import { getApiBaseUrl } from './config';

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
  if (!config || config._retried) {
    return Promise.reject(error);
  }

  const status = error.response?.status;
  const timeout = error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout');
  const retryable = timeout || status === undefined || status >= 500;
  if (!retryable) {
    return Promise.reject(error);
  }

  config._retried = true;
  return apiClient.request(config);
});
