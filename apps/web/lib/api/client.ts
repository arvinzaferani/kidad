import axios from 'axios';
import { getAuthToken } from '../auth/token';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

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
