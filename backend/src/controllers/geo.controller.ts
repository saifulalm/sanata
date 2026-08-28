/**
 * Geolocation Controller
 * Backend API for GPS and reverse geocoding
 * Uses OpenStreetMap Nominatim (free, no API key required)
 */

import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "SANATA-Construction/1.0 (Construction Site Management)";

/**
 * Rate limiter for Nominatim API
 * Enforces 1 request per second
 */
let lastRequestTime = 0;
const MIN_INTERVAL = 1000; // 1 second

async function rateLimitedFetch(url: string): Promise<globalThis.Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();

  const response = await globalThis.fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json",
    },
  });

  return response;
}

/**
 * Reverse geocode coordinates to address
 * GET /api/geo/reverse?lat=-6.2088&lon=106.8456
 */
export const reverseGeocode = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lon, zoom } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      success: false,
      message: "Parameter lat dan lon wajib diisi",
    });
  }

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lon as string);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({
      success: false,
      message: "Format koordinat tidak valid",
    });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      message: "Koordinat di luar jangkauan",
    });
  }

  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: "json",
      addressdetails: "1",
      zoom: String(zoom ?? 18),
    });

    const response = await rateLimitedFetch(
      `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`
    );

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`);
      return res.status(502).json({
        success: false,
        message: "Layanan geocoding tidak tersedia",
      });
    }

    const data = await response.json() as {
      error?: string;
      display_name?: string;
      address?: {
        road?: string;
        neighbourhood?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
        county?: string;
        state?: string;
        country?: string;
        postcode?: string;
      };
    };

    if (data.error) {
      return res.status(404).json({
        success: false,
        message: "Lokasi tidak ditemukan",
      });
    }

    const result = {
      latitude,
      longitude,
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

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memproses lokasi",
    });
  }
});

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
}

/**
 * Search for location by query
 * GET /api/geo/search?q=jakarta
 */
export const searchLocation = asyncHandler(async (req: Request, res: Response) => {
  const { q, limit } = req.query;

  if (!q || typeof q !== "string" || !q.trim()) {
    return res.status(400).json({
      success: false,
      message: "Parameter q (query) wajib diisi",
    });
  }

  try {
    const params = new URLSearchParams({
      q: q.trim(),
      format: "json",
      limit: String(limit ?? 5),
      addressdetails: "1",
    });

    const response = await rateLimitedFetch(
      `${NOMINATIM_BASE_URL}/search?${params.toString()}`
    );

    if (!response.ok) {
      console.error(`Nominatim search error: ${response.status}`);
      return res.status(502).json({
        success: false,
        message: "Layanan pencarian tidak tersedia",
      });
    }

    const data = (await response.json()) as SearchResult[];

    const results = data.map((item) => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      displayName: item.display_name,
      type: item.type,
    }));

    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Location search error:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mencari lokasi",
    });
  }
});

/**
 * Get location suggestions as user types
 * Debounced search recommended on frontend
 */
export const suggestLocations = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || typeof q !== "string" || q.length < 3) {
    return res.json({
      success: true,
      data: [],
    });
  }

  try {
    const params = new URLSearchParams({
      q: q.trim(),
      format: "json",
      limit: "3",
      addressdetails: "1",
    });

    const response = await rateLimitedFetch(
      `${NOMINATIM_BASE_URL}/search?${params.toString()}`
    );

    if (!response.ok) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const data = (await response.json()) as SearchResult[];

    const results = data.map((item) => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      displayName: item.display_name,
      type: item.type,
    }));

    return res.json({
      success: true,
      data: results,
    });
  } catch {
    return res.json({
      success: true,
      data: [],
    });
  }
});
