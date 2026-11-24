import { create } from 'axios';
import { obtenerDato, eliminarDato } from './storage';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://backend-verduleria.vercel.app/api';

const api = create({
  baseURL: API_URL,
  timeout: 10000,
});

const RUTAS_PUBLICAS = [
  '/auth/login',
  '/auth/2fa/verificar-login',
  '/auth/sandbox-login',
  '/clientes/login',
  '/clientes/registrar',
];

const esRutaPublica = (url = '') =>
  RUTAS_PUBLICAS.some(ruta => url.includes(ruta));

api.interceptors.request.use(async config => {
  if (!config.headers.Authorization && !esRutaPublica(config.url)) {
    const token = await obtenerDato('token') || await obtenerDato('token_cliente');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Permite comprobar que una respuesta atrasada pertenece todavía a la
      // sesión actual antes de borrar sus datos.
      config.sessionToken = token;
    }
  }
  return config;
});
api.interceptors.response.use(response => response, async error => {
  const url = error.config?.url || '';
  if (error.response?.status === 401 && !esRutaPublica(url)) {
    const tokenUsado = error.config?.sessionToken;
    const tokenActual = await obtenerDato('token') || await obtenerDato('token_cliente');

    // Si el usuario acaba de iniciar sesión y esta respuesta corresponde al
    // token anterior, no debe eliminarse la sesión recién creada.
    if (tokenUsado && tokenActual === tokenUsado) {
      await Promise.all(['token','usuario','token_cliente','cliente'].map(eliminarDato));
      router.replace('/');
    }
  }
  return Promise.reject(error);
});

export default api;
