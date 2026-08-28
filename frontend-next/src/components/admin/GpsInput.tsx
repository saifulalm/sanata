"use client";

import { useState, useCallback } from "react";
import { MapPin, Loader2, Navigation, X, Check, AlertCircle } from "lucide-react";
import {
  getCurrentPosition,
  reverseGeocode,
  getShortLocationName,
  isGeolocationSupported,
  checkGeolocationPermission,
  formatCoordinatesDecimal,
  isValidCoordinates,
  type GeoCoordinates,
  type ReverseGeocodeResult,
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
  const [geocodeResult, setGeocodeResult] = useState<ReverseGeocodeResult | null>(null);

  const lat = value.latitude;
  const lng = value.longitude;
  const locationName = value.locationName;

  const hasCoordinates = lat && lng && isValidCoordinates(parseFloat(lat), parseFloat(lng));

  const handleGetLocation = useCallback(async () => {
    setGpsState("loading");
    setGpsError(null);
    setGeocodeResult(null);

    try {
      // Check if supported
      if (!isGeolocationSupported()) {
        throw { code: "POSITION_UNAVAILABLE", message: "Geolocation tidak tersedia di browser ini" };
      }

      // Get coordinates
      const coords = await getCurrentPosition();

      setGpsState("success");

      // Update form with coordinates
      onChange({
        latitude: coords.latitude.toString(),
        longitude: coords.longitude.toString(),
        locationName: locationName || undefined,
      });

      // Reverse geocode to get location name
      setIsResolving(true);
      const result = await reverseGeocode(coords.latitude, coords.longitude);
      setIsResolving(false);

      if (result) {
        setGeocodeResult(result);
        const shortName = getShortLocationName(result);
        onChange({
          latitude: coords.latitude.toString(),
          longitude: coords.longitude.toString(),
          locationName: shortName,
        });
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
    onChange({
      latitude: "",
      longitude: "",
      locationName: "",
    });
  }, [onChange]);

  const handleManualInput = useCallback((field: "latitude" | "longitude", inputValue: string) => {
    // Allow empty or valid decimal numbers
    if (inputValue === "" || /^-?\d*\.?\d*$/.test(inputValue)) {
      const newValue = {
        ...value,
        [field]: inputValue,
      };
      onChange(newValue);

      // Clear state if coordinates cleared
      if (!newValue.latitude || !newValue.longitude) {
        setGpsState("idle");
        setGeocodeResult(null);
      }
    }
  }, [value, onChange]);

  const handleLocationNameChange = useCallback((inputValue: string) => {
    onChange({
      ...value,
      locationName: inputValue,
    });
  }, [value, onChange]);

  return (
    <div className="space-y-4">
      {/* Location Name Input */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Nama Lokasi
          {required && <span className="ml-1 text-rose-400">*</span>}
        </label>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={locationName || ""}
            onChange={(e) => handleLocationNameChange(e.target.value)}
            placeholder="Contoh: Lantai 2, Area A"
            disabled={disabled}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none disabled:opacity-50"
          />
        </div>
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
                Deteksi Otomatis
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

        {gpsState === "error" && (
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
        {hasCoordinates && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {formatCoordinatesDecimal(parseFloat(lat!), parseFloat(lng!))}
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
        {(isResolving || geocodeResult) && (
          <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin size={10} />
              {isResolving ? "Mendeteksi nama lokasi..." : "Alamat:"}
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
      <p className="text-xs text-slate-600">
        💡 Koordinat bisa diisi manual atau gunakan tombol &quot;Deteksi Otomatis&quot; untuk mendapatkan lokasi dari GPS perangkat.
      </p>
    </div>
  );
}
