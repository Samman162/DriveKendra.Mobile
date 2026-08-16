import axios from 'axios';

import { getExtra } from './config';

export const apiClient = axios.create({
  baseURL: getExtra().apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
