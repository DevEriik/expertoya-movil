import { DeviceEventEmitter } from "react-native";
import Config from "react-native-config";
import { getToken } from "./secureStore";

const RENDER_BACKEND_URL = "https://expertoya-backend.onrender.com";

const getBaseApiUrl = (): string => {
  const candidates = [
    (import.meta as any)?.env?.VITE_API_URL,
    typeof process !== "undefined"
      ? process.env?.EXPO_PUBLIC_API_URL
      : undefined,
    typeof process !== "undefined" ? process.env?.API_URL : undefined,
    Config?.API_URL,
  ];

  const envUrl = candidates.find(
    (v): v is string => typeof v === "string" && v.trim() !== "",
  );

  if (envUrl) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  return RENDER_BACKEND_URL;
};

export const API_URL = getBaseApiUrl();

interface ApiOptions extends RequestInit {
  useToken?: boolean;
}

export const apiClient = async (endpoint: string, options: ApiOptions = {}) => {
  const { useToken = true, headers, ...restOptions } = options;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (useToken) {
    const token = await getToken("auth_token");
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const isFormData = options.body instanceof FormData;
  if (isFormData) {
    delete defaultHeaders["Content-Type"];
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
    DeviceEventEmitter.emit("onUnauthorized");
  }

  return response;
};
