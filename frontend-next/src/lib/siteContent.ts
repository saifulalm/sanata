import type { LucideIcon } from "lucide-react";
import {
  Award,
  BadgeCheck,
  Building2,
        Cable,
  ClipboardList,
  Clock,
        DraftingCompass,
  Factory,
  FileCheck2,
  GraduationCap,
  Hammer,
  HardHat,
  HeartHandshake,
  Home,
  KeyRound,
  Landmark,
  Mail,
  MapPin,
  MessagesSquare,
  PenTool,
  Phone,
  Ruler,
  ShieldCheck,
  Store,
  Target,
  TrendingUp,
  Users2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

/** Tag cache Next.js untuk konten situs — di-invalidate saat admin menyimpan. */
export const SITE_CONTENT_TAG = "site-content";

export interface SiteContentItem {
  id: string;
  collection: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  icon: string | null;
  imageUrl: string | null;
  href: string | null;
  /**
   * Field pilihan & angka per koleksi — varian ilustrasi dan warna aksen hero,
   * serta ukuran lantai untuk model 3D.
   */
  meta: {
    variant?: string;
    accent?: string;
    heightM?: number;
    widthM?: number;
    depthM?: number;
    startWeek?: number;
    durationWeeks?: number;
    phone?: string;
    hours?: string;
    keywords?: string;
  } | null;
  order: number;
  isActive: boolean;
}

export interface SiteContent {
  collections: Record<string, SiteContentItem[]>;
  settings: Record<string, string>;
}

/**
 * Ikon dibatasi pada daftar tetap: nama ikon datang dari database, sehingga
 * memuatnya secara dinamis akan menarik seluruh paket lucide ke dalam bundle.
 */
const ICONS: Record<string, LucideIcon> = {
  Award,
  BadgeCheck,
  Building2,
        Cable,
  ClipboardList,
  Clock,
        DraftingCompass,
  Factory,
  FileCheck2,
  GraduationCap,
  Hammer,
  HardHat,
  HeartHandshake,
  Home,
  KeyRound,
  Landmark,
  Mail,
  MapPin,
  MessagesSquare,
  PenTool,
  Phone,
  Ruler,
  ShieldCheck,
  Store,
  Target,
  TrendingUp,
  Users2,
};

export const ICON_NAMES = Object.keys(ICONS).sort();

export function resolveIcon(name: string | null | undefined, fallback: LucideIcon = ShieldCheck): LucideIcon {
  return (name && ICONS[name]) || fallback;
}

const EMPTY: SiteContent = { collections: {}, settings: {} };

/**
 * Konten situs dipakai hampir semua halaman publik, jadi diambil sekali dan
 * ditandai dengan cache tag agar bisa direvalidasi tepat sasaran dari admin.
 * Kegagalan API tidak boleh merobohkan halaman — kembalikan payload kosong dan
 * biarkan tiap seksi memakai nilai bawaannya.
 */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const res = await fetch(`${API_URL}/site-content/public`, {
      next: { revalidate: 300, tags: [SITE_CONTENT_TAG] },
    });
    if (!res.ok) return EMPTY;
    const json = await res.json();
    return (json.data as SiteContent) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

export function collection(content: SiteContent, key: string): SiteContentItem[] {
  return content.collections[key] ?? [];
}

export function setting(content: SiteContent, key: string, fallback = ""): string {
  return content.settings[key] ?? fallback;
}
