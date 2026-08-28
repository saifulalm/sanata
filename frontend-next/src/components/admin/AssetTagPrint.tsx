"use client";

import { useRef, useEffect } from "react";
import { Printer, Download } from "lucide-react";
import { SimpleQRCode } from "./QRCodeDisplay";

interface AssetTagData {
  toolCode: string;
  name: string;
  category: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  currentLocation?: string | null;
  currentCondition: string;
  purchaseDate?: string | null;
}

interface AssetTagPrintProps {
  tool: AssetTagData;
  toolUrl: string;
  compact?: boolean;
}

export function AssetTagPrint({ tool, toolUrl, compact = false }: AssetTagPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup diblokir. Mohon izinkan popup untuk mencetak.");
      return;
    }

    const conditionColor = {
      GOOD: "#10b981",
      FAIR: "#f59e0b",
      DAMAGED: "#ef4444",
      LOST: "#dc2626",
    }[tool.currentCondition] || "#6b7280";

    const conditionLabel = {
      GOOD: "BAIK",
      FAIR: "CUKUP",
      DAMAGED: "RUSAK",
      LOST: "HILANG",
    }[tool.currentCondition] || tool.currentCondition;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset Tag - ${tool.toolCode}</title>
          <style>
            @page {
              size: ${compact ? "2in 1in" : "3in 2in"};
              margin: 2mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              background: white;
            }
            .asset-tag {
              width: 100%;
              height: 100%;
              border: 2px solid #000;
              padding: 8px;
              display: flex;
              gap: 8px;
            }
            .qr-section {
              flex-shrink: 0;
            }
            .qr-section img {
              width: ${compact ? "50px" : "70px"};
              height: auto;
            }
            .info-section {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
            }
            .header {
              border-bottom: 1px solid #000;
              padding-bottom: 4px;
              margin-bottom: 4px;
            }
            .company {
              font-size: ${compact ? "8px" : "10px"};
              font-weight: bold;
              color: #333;
            }
            .code {
              font-size: ${compact ? "10px" : "14px"};
              font-weight: bold;
              font-family: 'Arial Black', sans-serif;
              letter-spacing: 1px;
            }
            .name {
              font-size: ${compact ? "9px" : "12px"};
              font-weight: bold;
              margin-top: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .details {
              font-size: ${compact ? "7px" : "9px"};
              color: #555;
              line-height: 1.3;
            }
            .details span {
              display: block;
            }
            .condition {
              display: inline-block;
              padding: 1px 4px;
              font-size: ${compact ? "7px" : "9px"};
              font-weight: bold;
              color: white;
              background: ${conditionColor};
              border-radius: 2px;
            }
            .footer {
              font-size: ${compact ? "6px" : "7px"};
              color: #888;
              margin-top: 4px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="asset-tag">
            <div class="qr-section">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(toolUrl)}&format=png&margin=2" alt="QR" />
            </div>
            <div class="info-section">
              <div class="header">
                <div class="company">SANATA - TOOL INVENTORY</div>
                <div class="code">${tool.toolCode}</div>
                <div class="name">${tool.name}</div>
              </div>
              <div class="details">
                <span><strong>Kategori:</strong> ${tool.category}</span>
                ${tool.brand ? `<span><strong>Merek:</strong> ${tool.brand}</span>` : ""}
                ${tool.model ? `<span><strong>Model:</strong> ${tool.model}</span>` : ""}
                ${tool.serialNumber ? `<span><strong>SN:</strong> ${tool.serialNumber}</span>` : ""}
                ${tool.currentLocation ? `<span><strong>Lokasi:</strong> ${tool.currentLocation}</span>` : ""}
                <span><strong>Kondisi:</strong> <span class="condition">${conditionLabel}</span></span>
              </div>
              <div class="footer">
                ${new Date().toLocaleDateString("id-ID")}
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      {/* Preview */}
      <div
        ref={printRef}
        className={`asset-tag-preview ${compact ? "w-48" : "w-64"} rounded-xl border border-white/10 bg-white p-3`}
      >
        <div className="flex gap-3">
          {/* QR Code */}
          <div className="flex-shrink-0">
            <SimpleQRCode data={toolUrl} size={compact ? 60 : 80} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="border-b border-black/10 pb-2">
              <p className="text-[8px] font-bold text-slate-400">SANATA - TOOL INVENTORY</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-black">{tool.toolCode}</p>
              <p className="mt-0.5 truncate text-sm font-bold text-black">{tool.name}</p>
            </div>

            <div className="mt-2 space-y-0.5">
              <p className="text-[10px] text-slate-600">
                <span className="font-semibold">Kat:</span> {tool.category}
              </p>
              {tool.brand && (
                <p className="text-[10px] text-slate-600">
                  <span className="font-semibold">Merek:</span> {tool.brand}
                </p>
              )}
              {tool.currentLocation && (
                <p className="text-[10px] text-slate-600">
                  <span className="font-semibold">Lokasi:</span> {tool.currentLocation}
                </p>
              )}
              <p className="mt-1">
                <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${
                  tool.currentCondition === "GOOD" ? "bg-emerald-500" :
                  tool.currentCondition === "FAIR" ? "bg-amber-500" : "bg-rose-500"
                }`}>
                  {tool.currentCondition === "GOOD" ? "BAIK" :
                   tool.currentCondition === "FAIR" ? "CUKUP" : "RUSAK"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={handlePrint}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-400"
        >
          <Printer size={14} /> Print Label
        </button>
      </div>

      {/* Hidden printable template */}
      <div className="hidden print:block">
        <div className="asset-tag">
          <div className="qr-section">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(toolUrl)}&format=png`} alt="QR" />
          </div>
          <div className="info-section">
            <div className="header">
              <div className="company">SANATA - TOOL INVENTORY</div>
              <div className="code">{tool.toolCode}</div>
              <div className="name">{tool.name}</div>
            </div>
            <div className="details">
              <span>Kategori: {tool.category}</span>
              {tool.brand && <span>Merek: {tool.brand}</span>}
              {tool.model && <span>Model: {tool.model}</span>}
              {tool.serialNumber && <span>SN: {tool.serialNumber}</span>}
              {tool.currentLocation && <span>Lokasi: {tool.currentLocation}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
