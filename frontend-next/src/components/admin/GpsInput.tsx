"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MapPin, Loader2, Navigation, X, Check, AlertCircle, Search, Building, Home } from "lucide-react";
import {
  getCurrentPosition,
  reverseGeocode,
  searchLocation,
  getShortLocationName,
  isGeolocationSupported,
  formatCoordinatesDecimal,
  isValidCoordinates,
  type LocationSearchResult,
  type GeolocationError,
} from "@/lib/geolocation";

interface GpsInputProps {
  value: {
    latitude?: string;
    longitude?: string;
    locationName?: string;
  };
  onChange: (value: {
    latitude?: string;
    longitude?: string;
    locationName?: string;
  }) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

type GpsState = "idle" | "loading" | "success" | "error";

export function GpsInput({
  value,
  onChange,
  error,
  disabled = false,
  required = false,
}: GpsInputProps) {
  const [gpsState, setGpsState] = useState<GpsState>("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<{
    displayName?: string;
    city?: string;
    state?: string;
  } | null>(null);

  // Location search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const lat = value.latitude;
  const lng = value.longitude;
  const locationName = value.locationName;

  const hasCoordinates = lat && lng && isValidCoordinates(parseFloat(lat), parseFloat(lng));

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search location with debounce
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocation(query, { limit: 8 });
        setSearchResults(results || []);
        setShowResults(true);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  // Handle selecting a search result
  const handleSelectResult = useCallback(async (result: LocationSearchResult) => {
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      console.error("Invalid coordinates from search result");
      return;
    }

    // Get short name from displayName
    const shortName = result.displayName?.split(",")[0]?.trim() || "Unknown Location";

    // Update form with coordinates and location name
    onChange({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      locationName: shortName,
    });

    setSearchQuery(result.displayName?.split(",")[0]?.trim() || "");
    setShowResults(false);
    setSearchResults([]);
    setGpsState("success");
    setGeocodeResult({
      displayName: result.displayName,
      city: result.city,
      state: result.state,
    });

    // Reverse geocode for more details (optional enhancement)
    setIsResolving(true);
    try {
      const details = await reverseGeocode(latitude, longitude);
      if (details) {
        setGeocodeResult(details);
      }
    } catch (err) {
      console.error("Reverse geocode failed:", err);
    } finally {
      setIsResolving(false);
    }
  }, [onChange]);

  const handleGetLocation = useCallback(async () => {
    setGpsState("loading");
    setGpsError(null);
    setGeocodeResult(null);

    try {
      if (!isGeolocationSupported()) {
        throw {
          code: "POSITION_UNAVAILABLE" as GeolocationError["code"],
          message: "Geolocation tidak tersedia di browser ini"
        };
      }

      const coords = await getCurrentPosition();
      setGpsState("success");

      const newValue = {
        latitude: coords.latitude.toString(),
        longitude: coords.longitude.toString(),
        locationName: locationName || undefined,
      };

      onChange(newValue);

      setIsResolving(true);
      try {
        const result = await reverseGeocode(coords.latitude, coords.longitude);
        if (result) {
          setGeocodeResult(result);
          const shortName = getShortLocationName(result);
          onChange({
            ...newValue,
            locationName: shortName,
          });
          setSearchQuery(shortName);
        }
      } catch {
        // Reverse geocode is optional, don't fail if it errors
      } finally {
        setIsResolving(false);
      }
    } catch (err) {
      setGpsState("error");
      const ge = err as GeolocationError;
      setGpsError(ge.message || "Gagal mendapatkan lokasi");
    }
  }, [onChange, locationName]);

  const handleClearLocation = useCallback(() => {
    setGpsState("idle");
    setGpsError(null);
    setGeocodeResult(null);
    setSearchQuery("");
    setSearchResults([]);
    onChange({
      latitude: "",
      longitude: "",
      locationName: "",
    });
  }, [onChange]);

  const handleManualInput = useCallback((field: "latitude" | "longitude", inputValue: string) => {
    if (inputValue === "" || /^-?\d*\.?\d*$/.test(inputValue)) {
      const newValue = {
        ...value,
        [field]: inputValue,
      };
      onChange(newValue);

      if (!newValue.latitude || !newValue.longitude) {
        setGpsState("idle");
        setGeocodeResult(null);
      }
    }
  }, [value, onChange]);

  const handleLocationNameChange = useCallback((inputValue: string) => {
    setSearchQuery(inputValue);
    onChange({
      ...value,
      locationName: inputValue,
    });
  }, [value, onChange]);

  // Get icon for location type
  const getLocationIcon = (type?: string) => {
    switch (type) {
      case "city":
      case "town":
      case "village":
        return <Building size={14} className="text-cyan-400" />;
      default:
        return <MapPin size={14} className="text-emerald-400" />;
    }
  };

  // Safely get display name parts
  const getDisplayNameParts = (displayName?: string) => {
    if (!displayName) return { primary: "", secondary: "" };
    const parts = displayName.split(",");
    return {
      primary: parts[0]?.trim() || "Unknown",
      secondary: parts.slice(1, 3).join(",").trim(),
    };
  };

  return (
    <div className="space-y-4">
      {/* Location Search with Autocomplete */}
      <div className="relative">
        <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-400">
          <Search size={12} />
          Cari Lokasi
          {required && <span className="ml-1 text-rose-400">*</span>}
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery.length >= 3 && setShowResults(true)}
            placeholder="Ketik nama lokasi, alamat, kota..."
            disabled={disabled}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none disabled:opacity-50"
          />
          {isSearching && (
            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-500" />
          )}
          {searchQuery && !isSearching && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div
            ref={resultsRef}
            className="absolute z-50 mt-1 w-full rounded-xl border border-white/10 bg-slate-900 shadow-xl"
          >
            <div className="max-h-64 overflow-y-auto p-1">
              {searchResults.map((result, index) => {
                const { primary, secondary } = getDisplayNameParts(result.displayName);
                return (
                  <button
                    key={`${result.lat}-${result.lon}-${index}`}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-white/10"
                  >
                    <div className="mt-0.5">{getLocationIcon(result.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">{primary}</p>
                      {secondary && (
                        <p className="truncate text-xs text-slate-500">{secondary}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {showResults && searchResults.length === 0 && searchQuery.length >= 3 && !isSearching && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/10 bg-slate-900 p-4 text-center">
            <p className="text-sm text-slate-500">Tidak ada hasil untuk "{searchQuery}"</p>
          </div>
        )}

        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <p className="mt-1 text-xs text-slate-500">Minimal 3 karakter untuk mencari</p>
        )}
      </div>

      {/* GPS Coordinates */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-medium text-slate-400">
            Koordinat GPS
            {required && <span className="ml-1 text-rose-400">*</span>}
          </label>

          {/* GPS Auto-Detect Button */}
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={disabled || gpsState === "loading"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300 transition-all hover:border-cyan-400/50 hover:bg-cyan-400/20 disabled:opacity-50"
          >
            {gpsState === "loading" ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Mendeteksi...
              </>
            ) : (
              <>
                <Navigation size={12} />
                Deteksi GPS
              </>
            )}
          </button>
        </div>

        {/* Status Badge */}
        {gpsState === "success" && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-emerald-400">
            <Check size={12} />
            <span>Lokasi berhasil dideteksi</span>
          </div>
        )}

        {gpsState === "error" && gpsError && (
          <div className="mb-2 flex items-start gap-1.5 rounded-lg border border-rose-400/30 bg-rose-400/10 p-2 text-xs text-rose-300">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Coordinates Inputs */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Latitude</label>
            <input
              type="text"
              value={lat || ""}
              onChange={(e) => handleManualInput("latitude", e.target.value)}
              placeholder="-6.2088"
              disabled={disabled}
              className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none disabled:opacity-50 ${
                error ? "border-rose-400/50" : "border-white/10 focus:border-cyan-400/40"
              }`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Longitude</label>
            <input
              type="text"
              value={lng || ""}
              onChange={(e) => handleManualInput("longitude", e.target.value)}
              placeholder="106.8456"
              disabled={disabled}
              className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none disabled:opacity-50 ${
                error ? "border-rose-400/50" : "border-white/10 focus:border-cyan-400/40"
              }`}
            />
          </div>
        </div>

        {/* Formatted Coordinates Display */}
        {hasCoordinates && lat && lng && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {formatCoordinatesDecimal(parseFloat(lat), parseFloat(lng))}
            </span>

            {gpsState === "success" && (
              <button
                type="button"
                onClick={handleClearLocation}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-400"
              >
                <X size={12} />
                Clear
              </button>
            )}
          </div>
        )}

        {/* Geocoded Address Preview */}
        {(isResolving || geocodeResult?.displayName) && (
          <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin size={10} />
              {isResolving ? "Mendeteksi nama lokasi..." : "Detail Lokasi:"}
            </div>
            {isResolving ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Loader2 size={10} className="animate-spin" />
                Memuat...
              </div>
            ) : geocodeResult?.displayName ? (
              <p className="text-xs text-slate-300 line-clamp-2">
                {geocodeResult.displayName}
              </p>
            ) : null}
          </div>
        )}

        {error && (
          <p className="mt-1 text-xs text-rose-400">{error}</p>
        )}
      </div>

      {/* Helper Text */}
      <div className="flex items-start gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3">
        <MapPin size={14} className="mt-0.5 shrink-0 text-cyan-400" />
        <div className="text-xs text-slate-400">
          <p className="font-medium text-cyan-400">💡 Tips:</p>
          <ul className="mt-1 space-y-0.5 text-slate-500">
            <li>• Ketik nama lokasi untuk mencari otomatis</li>
            <li>• Atau klik &quot;Deteksi GPS&quot; untuk lokasi saat ini</li>
            <li>• Koordinat bisa diisi manual jika diperlukan</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
