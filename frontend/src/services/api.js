import { create } from 'axios';
import { obtenerDato, eliminarDato } from './storage';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://backend-verduleria.vercel.app/api';

const api = create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use(async config => {
  if (!config.headers.Authorization) {
    const token = await obtenerDato('token') || await obtenerDato('token_cliente');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(response => response, async error => {
  const url = error.config?.url || '';
  if(error.response?.status===401 && !url.includes('/auth/') && !url.includes('/clientes/login')) {
    await Promise.all(['token','usuario','token_cliente','cliente'].map(eliminarDato));
    router.replace('/');
  }
  return Promise.reject(error);
});

export default api;
