import axios from 'axios';

const api = axios.create({
  baseURL:true,
  withCredentials: true, // Important: Allows cookies to be sent/received
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;