import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // адрес бэкенда
  withCredentials: true, // важно для передачи cookies
});

export default api;