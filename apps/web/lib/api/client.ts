import axios from 'axios';
import { getAuthToken } from '../auth/token';

const configuredBaseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3008/api'
    : '/api');

const baseURL = (() => {
  const trimmed = configuredBaseURL.replace(/\/+$/, '');
  return trimmed.endsWith('/api')
    ? trimmed
    : `${trimmed}${trimmed.length ? '/' : ''}api`;
})();

export const apiClient = axios.create({
  baseURL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
