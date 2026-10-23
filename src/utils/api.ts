import Constants from 'expo-constants';
import { getToken } from './secureStore';
import { DeviceEventEmitter, Platform } from 'react-native';

const getBaseApiUrl = (): string => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        return `http://${window.location.hostname}:3000`;
    }

    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    const hostIp = Constants.expoConfig?.hostUri?.split(":")[0];
    return hostIp ? `http://${hostIp}:3000` : "http://localhost:3000";
};

export const API_URL = getBaseApiUrl();

interface ApiOptions extends RequestInit {
    useToken?: boolean;
}

export const apiClient = async (endpoint: string, options: ApiOptions = {}) => {
    const { useToken = true, headers, ...restOptions } = options;

    let defaultHeaders: HeadersInit = {
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
        delete (defaultHeaders as Record<string, string>)['Content-Type'];
    }

    const config: RequestInit = {
        ...restOptions,
        headers: {
            ...defaultHeaders,
            ...headers,
        },
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (response.status === 401 || response.status === 403) {
        DeviceEventEmitter.emit('onUnauthorized');
    }

    return response;
};
