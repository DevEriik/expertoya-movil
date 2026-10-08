import Constants from 'expo-constants';
import { getToken } from './secureStore';
import { DeviceEventEmitter } from 'react-native';

const hostIp = Constants.expoConfig?.hostUri?.split(":")[0];
export const API_URL = process.env.EXPO_PUBLIC_API_URL || (hostIp ? `http://${hostIp}:3000` : "http://localhost:3000");

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
        // Let the fetch automatically set the Content-Type with the correct boundary
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

    // Interceptar 401 Unauthorized y 403 Forbidden para forzar el logout
    if (response.status === 401 || response.status === 403) {
        DeviceEventEmitter.emit('onUnauthorized');
    }

    return response;
};
