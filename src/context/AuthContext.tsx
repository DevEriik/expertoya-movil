import React, { createContext, useContext, useEffect, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import { apiClient } from "../utils/api";
import { normalizeRole, UserRole } from "../utils/roles";
import { deleteToken, getToken, saveToken } from "../utils/secureStore";

export interface Profesional {
  estado_validado: boolean;
  ubicacion_geografica: string | null;
  calificacion_promedio: number;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  profesional?: Profesional | null;
}

interface AuthContextData {
  usuario: Usuario | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, usuario: Usuario) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
    const sub = DeviceEventEmitter.addListener("onUnauthorized", () => {
      logout();
    });
    return () => sub.remove();
  }, []);

  const loadStorageData = async () => {
    try {
      const storedToken = await getToken("auth_token");
      // Fallback para usuarios que ya tenían la app instalada con el modelo viejo
      const storedUsuario =
        (await getToken("usuario_data")) || (await getToken("user_data"));

      if (storedToken && storedUsuario) {
        setToken(storedToken);
        const parsed = JSON.parse(storedUsuario);
        setUsuario({ ...parsed, rol: normalizeRole(parsed.rol) });
      }
    } catch (error) {
      console.error("Failed to load auth data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newUsuario: Usuario) => {
    const normalizedUsuario = {
      ...newUsuario,
      rol: normalizeRole(newUsuario.rol),
    };
    setToken(newToken);
    setUsuario(normalizedUsuario);
    await saveToken("auth_token", newToken);
    await saveToken("usuario_data", JSON.stringify(normalizedUsuario));
  };

  const logout = async () => {
    try {
      const currentToken = await getToken("auth_token");
      if (currentToken) {
        await apiClient("/api/auth/logout", {
          method: "POST",
          useToken: true,
        });
      }
    } catch (e) {
      console.log("Error al desloguear del backend", e);
    } finally {
      setToken(null);
      setUsuario(null);
      await deleteToken("auth_token");
      await deleteToken("usuario_data");
      await deleteToken("user_data");
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
