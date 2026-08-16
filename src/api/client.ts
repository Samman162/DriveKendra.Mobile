import axios, { type InternalAxiosRequestConfig } from 'axios';

import { getExtra } from './config';

const ADMIN_PATH = /\/(notifications|bookings|admin|files)(\/|$)/i;

function shouldAttachApiKey(config: InternalAxiosRequestConfig): boolean {
  const key = getExtra().adminApiKey.trim();
  if (!key) {
    return false;
  }

  const method = (config.method || 'get').toLowerCase();
  const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
  if (!ADMIN_PATH.test(url)) {
    return false;
  }

  if (url.toLowerCase().includes('/files') && method !== 'get') {
    return false;
  }

  return true;
}

export const apiClient = axios.create({
  baseURL: getExtra().apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (shouldAttachApiKey(config)) {
    config.headers.set('X-Api-Key', getExtra().adminApiKey.trim());
  }
  return config;
});
