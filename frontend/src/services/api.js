import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001'),
