/**
 * Auth Layout - Simple wrapper for login/register pages
 * No header, sidebar, or auth checks - these pages are standalone
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-charcoal-600">
      {/* Blueprint grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,173,130,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,173,130,1) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      {/* Radial glow top */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(201,173,130,0.1) 0%, rgba(201,173,130,0.03) 40%, transparent 70%)",
        }}
      />
      {/* Radial glow bottom-right */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[500px]"
        style={{
          background:
            "radial-gradient(ellipse at bottom right, rgba(201,173,130,0.06) 0%, transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}
