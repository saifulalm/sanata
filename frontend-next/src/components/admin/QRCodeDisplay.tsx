"use client";

import { useState, useEffect, useRef } from "react";
import { Download, QrCode, RefreshCw, ExternalLink } from "lucide-react";

interface QrCodeData {
  toolId: string;
  toolCode: string;
  name: string;
  url: string;
}

interface QRCodeDisplayProps {
  toolId: string;
  toolCode: string;
  toolName: string;
  apiUrl: string;
  size?: number;
}

export function QRCodeDisplay({ toolId, toolCode, toolName, apiUrl, size = 200 }: QRCodeDisplayProps) {
  const [qrData, setQrData] = useState<QrCodeData | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateQrCode();
  }, [toolId]);

  const generateQrCode = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get QR data from our API
      const response = await fetch(`${apiUrl}/api/workforce/tools/${toolId}/qrcode`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Gagal menghasilkan QR code");
      }

      const result = await response.json();
      if (result.success) {
        setQrData(result.data);

        // Generate QR code using an external service (qrcode.monster)
        // This is a free service that doesn't require API key
        const encodedUrl = encodeURIComponent(result.data.url);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}&format=png&margin=10`;
        setQrImageUrl(qrUrl);
      }
    } catch (err) {
      console.error("QR generation error:", err);
      setError("Gagal menghasilkan QR code");
    } finally {
      setLoading(false);
    }
  };

  const downloadQrCode = () => {
    if (!qrImageUrl) return;

    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `QR-${toolCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    if (qrData?.url) {
      navigator.clipboard.writeText(qrData.url);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-48 w-48 flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/5">
        <p className="mb-2 text-sm text-rose-400">Gagal generate QR</p>
        <button
          onClick={generateQrCode}
          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
        >
          <RefreshCw size={12} /> Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* QR Code */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white p-3 shadow-lg">
        {qrImageUrl && (
          <img
            src={qrImageUrl}
            alt={`QR Code for ${toolName}`}
            width={size}
            height={size}
            className="h-auto w-auto"
          />
        )}

        {/* Refresh Button */}
        <button
          onClick={generateQrCode}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white"
          title="Refresh QR Code"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Tool Info */}
      <div className="mt-3 text-center">
        <p className="font-mono text-xs text-cyan-400">{toolCode}</p>
        <p className="mt-1 text-sm font-medium text-white">{toolName}</p>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={downloadQrCode}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          <Download size={12} /> Download
        </button>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          Copy URL
        </button>
      </div>

      {/* Hidden canvas for potential future processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// Simple QR Code component using external service
interface SimpleQRCodeProps {
  data: string;
  size?: number;
  className?: string;
}

export function SimpleQRCode({ data, size = 150, className = "" }: SimpleQRCodeProps) {
  const encodedData = encodeURIComponent(data);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&format=png&margin=5`;

  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={qrUrl}
        alt="QR Code"
        width={size}
        height={size}
        className="rounded-lg"
      />
    </div>
  );
}
