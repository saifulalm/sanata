import { getAdminSession } from "@/lib/adminApi";
import { getDashboardSummary } from "@/lib/adminResources";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  // Jumlah pesan baru ditampilkan sebagai lencana sidebar. Kegagalannya tidak
  // boleh menjatuhkan seluruh panel — lencana cukup disembunyikan.
  const newInquiries = await getDashboardSummary()
    .then((summary) => summary.cards.newInquiries)
    .catch(() => 0);

  return (
    <AdminShell session={session} badges={{ "/admin/inquiries": newInquiries }}>
      {children}
    </AdminShell>
  );
}
