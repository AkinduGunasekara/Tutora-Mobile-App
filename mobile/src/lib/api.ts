import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Your machine's WiFi IP — update this if your network changes
const DEV_IP = '10.224.190.121';
const BASE_URL = `http://${DEV_IP}:5000/api`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
