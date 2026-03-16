import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-api-url.com'  // Replace with your production API URL
    : 'http://localhost:3001',
});

export default api;
