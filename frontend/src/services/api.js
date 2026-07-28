import axios from 'axios';

const API_URL = 'https://backend-verduleria.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

export default api;