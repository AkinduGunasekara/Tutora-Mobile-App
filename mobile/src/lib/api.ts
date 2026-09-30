import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

// WiFi IP for physical device testing — update if your network changes
const DEV_IP = '10.224.190.121';

// On web the browser is on the same machine, so use localhost
const BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:5000/api'
    : `http://${DEV_IP}:5000/api`;

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
