import Config from 'react-native-config';
import { Platform, DeviceEventEmitter, NativeModules } from 'react-native';
import { getToken } from './secureStore';

const normalizeUrl = (url: string): string => url.trim().replace(/\/+$/, '');

const getBaseApiUrl = (): string => {
  if (Platform.OS === 'web') {
    if (typeof process !== 'undefined' && process.env?.API_URL) {
      return normalizeUrl(process.env.API_URL);
    }
    if (typeof window !== 'undefined' && window.location) {
      if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      ) {
        return 'http://localhost:3000';
      }
      return `http://${window.location.hostname}:3000`;
    }
    return 'http://localhost:3000';
  }

  if (typeof Config.API_URL === 'string' && Config.API_URL.trim().length > 0) {
    return normalizeUrl(Config.API_URL);
  }

  // Fallback solo para desarrollo local si no hubiera .env
  const scriptURL: string | undefined = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
    const hostIp = match?.[1];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000`;
    }
  }

  return 'http://localhost:3000';
};

export const API_URL = getBaseApiUrl();

interface ApiOptions extends RequestInit {
  useToken?: boolean;
}

export const apiClient = async (endpoint: string, options: ApiOptions = {}) => {
  const { useToken = true, headers, ...restOptions } = options;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (useToken) {
    const token = await getToken('auth_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const isFormData = options.body instanceof FormData;
  if (isFormData) {
    delete defaultHeaders['Content-Type'];
  }

  const config: RequestInit = {
    ...restOptions,
    headers: {
      ...defaultHeaders,
      ...(headers as Record<string, string>),
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (response.status === 401 || response.status === 403) {
    DeviceEventEmitter.emit('onUnauthorized');
  }

  return response;
};
