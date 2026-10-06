import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveToken, getToken, deleteToken } from '../utils/secureStore';
import Constants from 'expo-constants';

interface User {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    rol: string;
}

interface AuthContextData {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    const loadStorageData = async () => {
        try {
            const storedToken = await getToken('auth_token');
            const storedUser = await getToken('user_data');
            
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Failed to load auth data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        await saveToken('auth_token', newToken);
        await saveToken('user_data', JSON.stringify(newUser));
    };

    const logout = async () => {
        setToken(null);
        setUser(null);
        await deleteToken('auth_token');
        await deleteToken('user_data');
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
