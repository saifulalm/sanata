"use client";

import { useState, useCallback } from "react";
import {
  getCurrentPosition,
  watchPosition,
  clearWatch,
  reverseGeocode,
  getShortLocationName,
  checkGeolocationPermission,
  isGeolocationSupported,
  type GeoCoordinates,
  type ReverseGeocodeResult,
  type GeolocationError,
  type GeolocationPermission,
} from "@/lib/geolocation";

export interface UseGpsOptions {
  enableWatch?: boolean;
  onSuccess?: (coords: GeoCoordinates) => void;
  onError?: (error: GeolocationError) => void;
}

export interface UseGpsReturn {
  // State
  coordinates: GeoCoordinates | null;
  locationName: string;
  formattedAddress: string;
  isLoading: boolean;
  error: GeolocationError | null;
  permission: GeolocationPermission;

  // Actions
  captureLocation: () => Promise<GeoCoordinates | null>;
  startWatching: () => void;
  stopWatching: () => void;
  clearLocation: () => void;
  setLocationName: (name: string) => void;

  // Helpers
  hasLocation: boolean;
  canUseGeolocation: boolean;
}

/**
 * React Hook for Geolocation with Reverse Geocoding
 *
 * Features:
 * - One-time GPS capture
 * - Continuous location watching
 * - Automatic reverse geocoding via Nominatim
 * - Permission state management
 *
 * @example
 * ```tsx
 * const { captureLocation, isLoading } = useGps({
 *   onSuccess: (coords) => console.log(coords)
 * });
 *
 * <button onClick={captureLocation}>Get Location</button>
 * ```
 */
export function useGps(options: UseGpsOptions = {}): UseGpsReturn {
  const { enableWatch = false, onSuccess, onError } = options;

  // State
  const [coordinates, setCoordinates] = useState<GeoCoordinates | null>(null);
  const [locationName, setLocationNameState] = useState<string>("");
  const [formattedAddress, setFormattedAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [permission, setPermission] = useState<GeolocationPermission>("unknown");
  const [watchId, setWatchId] = useState<number | null>(null);

  // Check if geolocation is available
  const canUseGeolocation = isGeolocationSupported();

  // Set location name
  const setLocationName = useCallback((name: string) => {
    setLocationNameState(name);
  }, []);

  // Clear location
  const clearLocation = useCallback(() => {
    setCoordinates(null);
    setLocationNameState("");
    setFormattedAddress("");
    setError(null);
  }, []);

  // Handle successful location capture
  const handleSuccess = useCallback(
    async (coords: GeoCoordinates) => {
      setCoordinates(coords);
      setError(null);

      // Auto reverse geocode
      try {
        const result = await reverseGeocode(coords.latitude, coords.longitude);
        if (result) {
          setFormattedAddress(result.displayName);
          const shortName = getShortLocationName(result);
          setLocationNameState(shortName);
        }
      } catch (err) {
        console.warn("Reverse geocoding failed:", err);
      }

      onSuccess?.(coords);
    },
    [onSuccess]
  );

  // Handle error
  const handleError = useCallback(
    (err: GeolocationError) => {
      setError(err);
      onError?.(err);
    },
    [onError]
  );

  // Capture current location (one-time)
  const captureLocation = useCallback(async (): Promise<GeoCoordinates | null> => {
    if (!canUseGeolocation) {
      handleError({
        code: "POSITION_UNAVAILABLE",
        message: "Geolocation tidak tersedia di browser ini",
      });
      return null;
    }

    setIsLoading(true);

    try {
      // Check permission first
      const perm = await checkGeolocationPermission();
      setPermission(perm);

      if (perm === "denied") {
        handleError({
          code: "PERMISSION_DENIED",
          message: "Izin akses lokasi ditolak. Silakan aktifkan di pengaturan browser.",
        });
        setIsLoading(false);
        return null;
      }

      // Get position
      const coords = await getCurrentPosition();
      await handleSuccess(coords);
      setIsLoading(false);
      return coords;
    } catch (err) {
      const ge = err as GeolocationError;
      handleError(ge);
      setIsLoading(false);
      return null;
    }
  }, [canUseGeolocation, handleSuccess, handleError]);

  // Start watching location
  const startWatching = useCallback(() => {
    if (!canUseGeolocation) {
      handleError({
        code: "POSITION_UNAVAILABLE",
        message: "Geolocation tidak tersedia di browser ini",
      });
      return;
    }

    // Clear previous watch if exists
    if (watchId !== null) {
      clearWatch();
    }

    const id = watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    setWatchId(id);
  }, [canUseGeolocation, handleSuccess, handleError, watchId]);

  // Stop watching location
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      clearWatch();
      setWatchId(null);
    }
  }, [watchId]);

  // Cleanup on unmount
  // Note: In a real hook, you'd use useEffect for cleanup

  return {
    coordinates,
    locationName,
    formattedAddress,
    isLoading,
    error,
    permission,
    captureLocation,
    startWatching,
    stopWatching,
    clearLocation,
    setLocationName,
    hasLocation: coordinates !== null,
    canUseGeolocation,
  };
}

// ============================================
// PRESET HOOKS FOR COMMON USE CASES
// ============================================

/**
 * Simple GPS capture hook for forms
 * Minimal setup, just capture and done
 */
export function useGpsCapture(onCapture?: (coords: GeoCoordinates) => void) {
  const [coords, setCoords] = useState<GeoCoordinates | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(async () => {
    setIsCapturing(true);
    setError(null);

    try {
      const result = await getCurrentPosition();
      setCoords(result);
      onCapture?.(result);
      return result;
    } catch (err) {
      const ge = err as GeolocationError;
      setError(ge.message);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [onCapture]);

  const clear = useCallback(() => {
    setCoords(null);
    setError(null);
  }, []);

  return {
    coords,
    isCapturing,
    error,
    capture,
    clear,
    hasCoords: coords !== null,
  };
}
