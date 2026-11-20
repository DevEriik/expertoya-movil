import { useCallback, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface UseLocationResult {
  coords: LocationCoords | null;
  permission: LocationPermissionStatus | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<LocationPermissionStatus>;
  getCurrentLocation: () => Promise<LocationCoords | null>;
}

export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator
      ? 'granted'
      : 'denied';
  }

  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED
      ? 'granted'
      : 'denied';
  }

  const auth = await Geolocation.requestAuthorization('whenInUse');
  return auth === 'granted' ? 'granted' : 'denied';
}

export function useLocation(): UseLocationResult {
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [permission, setPermission] = useState<LocationPermissionStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    setError(null);
    const status = await requestLocationPermission();
    setPermission(status);
    return status;
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let currentPermission = permission;
      if (currentPermission !== 'granted') {
        currentPermission = await requestLocationPermission();
        setPermission(currentPermission);
      }

      if (currentPermission !== 'granted') {
        setError('Permiso de ubicación denegado');
        setLoading(false);
        return null;
      }

      if (Platform.OS === 'web') {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 10000,
            });
          },
        );
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoords(newCoords);
        setLoading(false);
        return newCoords;
      }

      const position = await new Promise<Geolocation.GeoPosition>(
        (resolve, reject) => {
          Geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 10000,
          });
        },
      );

      const newCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setCoords(newCoords);
      setLoading(false);
      return newCoords;
    } catch (err: any) {
      setError(err?.message || 'Error al obtener ubicación');
      setLoading(false);
      return null;
    }
  }, [permission]);

  return {
    coords,
    permission,
    loading,
    error,
    hasPermission: permission === 'granted',
    requestPermission,
    getCurrentLocation,
  };
}
