import { create } from 'axios';

const API_URL = 'https://backend-verduleria.vercel.app/api';

const api = create({
  baseURL: API_URL,
  timeout: 10000,
});

export default api;
