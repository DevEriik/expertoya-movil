import * as Location from "expo-location";
import { useCallback, useState } from "react";

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface UseLocationResult {
  coords: LocationCoords | null;
  permission: Location.PermissionStatus | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<Location.PermissionStatus>;
  getCurrentLocation: () => Promise<LocationCoords | null>;
}

export function useLocation(): UseLocationResult {
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [permission, setPermission] =
    useState<Location.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    setError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermission(status);
    return status;
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let currentPermission = permission;
      if (currentPermission !== "granted") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        currentPermission = status;
        setPermission(status);
      }

      if (currentPermission !== "granted") {
        setError("Permiso de ubicación denegado");
        setLoading(false);
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newCoords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setCoords(newCoords);
      setLoading(false);
      return newCoords;
    } catch (err: any) {
      setError(err?.message || "Error al obtener ubicación");
      setLoading(false);
      return null;
    }
  }, [permission]);

  return {
    coords,
    permission,
    loading,
    error,
    hasPermission: permission === "granted",
    requestPermission,
    getCurrentLocation,
  };
}
