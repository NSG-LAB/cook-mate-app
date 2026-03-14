import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const normalizeUrl = (value) => (value ? value.replace(/\/$/, '') : value);

const getDefaultBaseUrl = () =>
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8080/api'
    : 'http://localhost:8080/api';

const envUrl = normalizeUrl(process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl);
const BASE_URL = envUrl || getDefaultBaseUrl();

if (!envUrl) {
  console.info('Using fallback API URL:', BASE_URL);
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const getApiBaseUrl = () => BASE_URL;
