import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.PROD ? 
    'https://controle-de-estoque-agape.onrender.com' 
    : 'http://localhost:3001')
});
export default api;
