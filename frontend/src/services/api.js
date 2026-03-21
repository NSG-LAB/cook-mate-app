import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const normalizeUrl = (value) => (value ? value.replace(/\/$/, '') : value);

const isExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo';

const getExpoDevHostname = () => {
  const manifest = Constants.expoConfig || Constants.manifest;
  const hostUri =
    manifest?.hostUri ||
    manifest?.debuggerHost ||
    manifest?.extra?.expoGo?.debuggerHost ||
    Constants.expoConfig?.extra?.expoGo?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(':')[0];
};

const getDefaultBaseUrl = () => {
  const expoDevHost = __DEV__ ? getExpoDevHostname() : null;
  if (expoDevHost) {
    return `http://${expoDevHost}:8080/api`;
  }

  return Platform.OS === 'android'
    ? isExpoGo
      ? 'http://10.0.2.2:8080/api'
      : 'http://localhost:8080/api'
    : 'http://localhost:8080/api';
};

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
