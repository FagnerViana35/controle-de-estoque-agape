import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? ''  // Use relative URLs for Vercel serverless functions
    : 'http://localhost:3001',
});

export default api;
