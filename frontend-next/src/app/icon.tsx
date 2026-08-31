import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/svg+xml";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c1829",
          borderRadius: 12,
          border: "1px solid rgba(56, 189, 248, 0.3)",
        }}
      >
        {/* Building icon */}
        <svg
          width="36"
          height="36"
          viewBox="0 0 40 40"
          style={{
            display: "flex",
          }}
        >
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <rect x="6" y="8" width="14" height="24" rx="1" fill="url(#g)" opacity="0.3" />
          <rect x="5" y="8" width="14" height="24" rx="1" fill="none" stroke="url(#g)" strokeWidth="2" />
          <rect x="20" y="14" width="14" height="18" rx="1" fill="url(#g)" opacity="0.3" />
          <rect x="19" y="14" width="14" height="18" rx="1" fill="none" stroke="url(#g)" strokeWidth="2" />
          <line x1="5" y1="14" x2="19" y2="14" stroke="url(#g)" strokeWidth="1.5" />
          <line x1="19" y1="24" x2="33" y2="24" stroke="url(#g)" strokeWidth="1.5" />
          <circle cx="15" cy="11" r="2" fill="#f59e0b" />
        </svg>
      </div>
    ),
    size
  );
}
