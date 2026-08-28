/**
 * Geolocation Utilities
 * Browser Geolocation API + Nominatim Reverse Geocoding
 *
 * Uses:
 * - Browser Geolocation API for GPS capture (native, no external service)
 * - OpenStreetMap Nominatim for reverse geocoding (free, 1 req/sec)
 */

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeoLocation {
  coordinates: GeoCoordinates;
  locationName?: string;
  formattedAddress?: string;
  timestamp: number;
}

export interface ReverseGeocodeResult {
  displayName: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

export type GeolocationPermission = "granted" | "denied" | "prompt" | "unknown";

export type GeolocationError = {
  code: "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "UNKNOWN";
  message: string;
};

// ============================================
// BROWSER GEOLOCATION API
// ============================================

let watchId: number | null = null;

/**
 * Check if geolocation is supported and permission status
 */
export async function checkGeolocationPermission(): Promise<GeolocationPermission> {
  if (!navigator.geolocation) {
    return "unknown";
  }

  if (!navigator.permissions) {
    // Fallback for browsers without permissions API
    return "prompt";
  }

  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state as GeolocationPermission;
  } catch {
    return "unknown";
  }
}

/**
 * Check if geolocation is available
 */
export function isGeolocationSupported(): boolean {
  return "geolocation" in navigator;
}

/**
 * Get current position (one-time)
 */
export function getCurrentPosition(
  options?: PositionOptions
): Promise<GeoCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: "POSITION_UNAVAILABLE" as GeolocationError["code"],
        message: "Geolocation tidak tersedia di browser ini",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (error) => {
        const err: GeolocationError = {
          code: error.code === 1
            ? "PERMISSION_DENIED"
            : error.code === 2
              ? "POSITION_UNAVAILABLE"
              : error.code === 3
                ? "TIMEOUT"
                : "UNKNOWN",
          message: getErrorMessage(error),
        };
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options,
      }
    );
  });
}

/**
 * Watch position continuously
 */
export function watchPosition(
  onSuccess: (coords: GeoCoordinates) => void,
  onError: (error: GeolocationError) => void,
  options?: PositionOptions
): number {
  if (!navigator.geolocation) {
    onError({
      code: "POSITION_UNAVAILABLE",
      message: "Geolocation tidak tersedia di browser ini",
    });
    return -1;
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      onSuccess({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
    },
    (error) => {
      onError({
        code: error.code === 1
          ? "PERMISSION_DENIED"
          : error.code === 2
            ? "POSITION_UNAVAILABLE"
            : error.code === 3
              ? "TIMEOUT"
              : "UNKNOWN",
        message: getErrorMessage(error),
      });
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    }
  );

  return watchId;
}

/**
 * Stop watching position
 */
export function clearWatch(): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

/**
 * Get human-readable error message
 */
function getErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case 1:
      return "Izin akses lokasi ditolak. Silakan aktifkan akses lokasi di pengaturan browser.";
    case 2:
      return "Lokasi tidak tersedia. Pastikan GPS perangkat aktif.";
    case 3:
      return "Waktu habis untuk mendapatkan lokasi. Coba lagi.";
    default:
      return "Terjadi kesalahan tidak dikenal saat mendapatkan lokasi.";
  }
}

// ============================================
// NOMINATIM REVERSE GEOCODING
// ============================================

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "SANATA-Construction/1.0 (Construction Site Management)";

/**
 * Nominatim API Rate Limiter
 * Enforces 1 request per second limit
 */
class NominatimRateLimiter {
  private lastRequestTime = 0;
  private minInterval = 1000; // 1 second

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }
}

const rateLimiter = new NominatimRateLimiter();

/**
 * Reverse geocode coordinates to address
 * Uses OpenStreetMap Nominatim (free, no API key required)
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param options - Optional settings
 * @returns Reverse geocoding result
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  options?: {
    format?: "json" | "xml";
    zoom?: number; // 0-18, level of detail
    addressdetails?: boolean;
  }
): Promise<ReverseGeocodeResult | null> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: options?.format ?? "json",
    addressdetails: String(options?.addressdetails ?? 1),
    zoom: String(options?.zoom ?? 18),
  });

  // Rate limiting - wait if needed
  await rateLimiter.wait();

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.warn("Nominatim: No results found for this location");
      return null;
    }

    return {
      displayName: data.display_name || "",
      road: data.address?.road,
      neighbourhood: data.address?.neighbourhood,
      suburb: data.address?.suburb,
      city: data.address?.city || data.address?.town || data.address?.village,
      county: data.address?.county,
      state: data.address?.state,
      country: data.address?.country,
      postcode: data.address?.postcode,
    };
  } catch (error) {
    console.error("Nominatim reverse geocoding failed:", error);
    return null;
  }
}

/**
 * Search for a location by query
 *
 * @param query - Search query (address, city, etc.)
 * @param options - Optional settings
 * @returns Array of search results
 */
export async function searchLocation(
  query: string,
  options?: {
    limit?: number;
    format?: "json" | "xml";
  }
): Promise<Array<{
  lat: string;
  lon: string;
  displayName: string;
  type: string;
}>> {
  if (!query.trim()) {
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    format: options?.format ?? "json",
    limit: String(options?.limit ?? 5),
    addressdetails: "1",
  });

  // Rate limiting
  await rateLimiter.wait();

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Nominatim search error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Nominatim search failed:", error);
    return [];
  }
}

/**
 * Format coordinates to DMS (Degrees Minutes Seconds) string
 */
export function formatCoordinatesDMS(lat: number, lon: number): string {
  const latDMS = decimalToDMS(Math.abs(lat), lat >= 0 ? "N" : "S");
  const lonDMS = decimalToDMS(Math.abs(lon), lon >= 0 ? "E" : "W");
  return `${latDMS}, ${lonDMS}`;
}

/**
 * Format coordinates to Decimal Minutes string
 */
export function formatCoordinatesDM(lat: number, lon: number): string {
  const latDM = decimalToDM(Math.abs(lat), lat >= 0 ? "N" : "S");
  const lonDM = decimalToDM(Math.abs(lon), lon >= 0 ? "E" : "W");
  return `${latDM}, ${lonDM}`;
}

/**
 * Format coordinates to Decimal string
 */
export function formatCoordinatesDecimal(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

/**
 * Get short location name from geocode result
 */
export function getShortLocationName(result: ReverseGeocodeResult): string {
  // Priority: specific to general
  return result.city
    || result.suburb
    || result.neighbourhood
    || result.road
    || result.displayName.split(",")[0]
    || "Unknown Location";
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function decimalToDMS(decimal: number, direction: string): string {
  const degrees = Math.floor(decimal);
  const minutesDecimal = (decimal - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = ((minutesDecimal - minutes) * 60).toFixed(1);

  return `${degrees}°${minutes}'${seconds}"${direction}`;
}

function decimalToDM(decimal: number, direction: string): string {
  const degrees = Math.floor(decimal);
  const minutes = ((decimal - degrees) * 60).toFixed(4);

  return `${degrees}°${minutes}'${direction}`;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(lat: number, lon: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}
