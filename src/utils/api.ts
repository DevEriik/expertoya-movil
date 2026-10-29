import Constants from 'expo-constants';
import { Platform, DeviceEventEmitter } from 'react-native';
import { getToken } from './secureStore';

const getBaseUrl = () => {
    if (Platform.OS === 'web') {
        const hostname =
            typeof window !== 'undefined' && window.location?.hostname
                ? window.location.hostname
                : 'localhost';
        return `http://${hostname}:3000`;
    }
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }
    const hostIp = Constants.expoConfig?.hostUri?.split(':')[0];
    return hostIp ? `http://${hostIp}:3000` : 'http://localhost:3000';
};

export const API_URL = getBaseUrl();


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
