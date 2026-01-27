import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // 🔥 MUST for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
