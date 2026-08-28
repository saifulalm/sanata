/**
 * Geolocation Routes
 * Public endpoints - no authentication required
 * Uses OpenStreetMap Nominatim for reverse geocoding
 */

import { Router } from "express";
import * as geoCtrl from "@/controllers/geo.controller";

const router = Router();

// NOTE: These endpoints are PUBLIC (no auth required)
// because reverse geocoding is a public service

// Reverse geocode coordinates to address
// GET /api/geo/reverse?lat=-6.2088&lon=106.8456
router.get("/reverse", geoCtrl.reverseGeocode);

// Search for location by query
// GET /api/geo/search?q=jakarta
router.get("/search", geoCtrl.searchLocation);

// Location suggestions (debounced)
// GET /api/geo/suggest?q=jakarta
router.get("/suggest", geoCtrl.suggestLocations);

export default router;
