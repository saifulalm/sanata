/**
 * Auth Layout - Simple wrapper for login/register pages
 * No header, sidebar, or auth checks - these pages are standalone
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50">
      {children}
    </div>
  );
}
