"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import {
  isGeolocationSupported,
  checkGeolocationPermission,
  type GeolocationPermission,
} from "@/lib/geolocation";

interface GpsStatusProps {
  compact?: boolean;
  showLabel?: boolean;
}

export function GpsStatus({ compact = false, showLabel = true }: GpsStatusProps) {
  const [permission, setPermission] = useState<GeolocationPermission>("unknown");
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function check() {
      if (!isGeolocationSupported()) {
        setPermission("unknown");
        setIsChecking(false);
        return;
      }

      const perm = await checkGeolocationPermission();
      setPermission(perm);
      setIsChecking(false);
    }

    check();
  }, []);

  if (isChecking) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <Loader2 size={12} className="animate-spin" />
        {showLabel && "Checking GPS..."}
      </span>
    );
  }

  if (!isGeolocationSupported()) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <XCircle size={12} className="text-slate-400" />
        {showLabel && "GPS Not Available"}
      </span>
    );
  }

  const config = {
    granted: {
      icon: <CheckCircle size={12} className="text-emerald-400" />,
      label: "GPS Active",
      textColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
    },
    denied: {
      icon: <XCircle size={12} className="text-rose-400" />,
      label: "GPS Blocked",
      textColor: "text-rose-400",
      bgColor: "bg-rose-500/10 border-rose-500/20",
    },
    prompt: {
      icon: <AlertTriangle size={12} className="text-amber-400" />,
      label: "GPS Permission Required",
      textColor: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
    },
    unknown: {
      icon: <MapPin size={12} className="text-slate-400" />,
      label: "GPS Unknown",
      textColor: "text-slate-400",
      bgColor: "bg-slate-500/10 border-slate-500/20",
    },
  };

  const { icon, label, textColor, bgColor } = config[permission];

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 ${textColor}`} title={label}>
        {icon}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${bgColor} ${textColor}`}
      title={permission === "denied" ? "Enable location in browser settings" : label}
    >
      {icon}
      {showLabel && <span>{label}</span>}
    </span>
  );
}
