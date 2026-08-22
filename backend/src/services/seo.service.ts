/**
 * Analisis SEO on-page untuk satu konten.
 *
 * Aturan di sini sengaja deterministik dan bisa dijelaskan — bukan skor ajaib.
 * Tiap pemeriksaan menyebutkan apa yang salah dan cara memperbaikinya, supaya
 * editor tahu tindakan konkretnya, bukan cuma melihat angka merah.
 */

export type CheckStatus = "good" | "warning" | "bad";

export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
}

export interface SeoAnalysis {
  score: number;
  grade: "baik" | "cukup" | "kurang";
  checks: SeoCheck[];
}

export interface SeoAnalysisInput {
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  coverImage: string | null;
  focusKeyword: string | null;
}

// Batas panjang mengikuti lebar potongan Google (bukan aturan mutlak, tapi
// pedoman yang lazim dipakai supaya judul/deskripsi tidak terpotong).
const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;
const MIN_WORDS = 300;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function occurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  // Pencocokan kata utuh, supaya "beton" tidak ikut terhitung di "betonisasi".
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (haystack.match(new RegExp(`\\b${escaped}\\b`, "gi")) ?? []).length;
}

export function analyzeSeo(input: SeoAnalysisInput): SeoAnalysis {
  const checks: SeoCheck[] = [];

  const effectiveTitle = (input.metaTitle || input.title || "").trim();
  const effectiveDesc = (input.metaDescription || input.excerpt || "").trim();
  const plainBody = stripHtml(input.body ?? "");
  const wordCount = countWords(plainBody);
  const keyword = (input.focusKeyword ?? "").trim().toLowerCase();

  // 1. Panjang judul
  if (!effectiveTitle) {
    checks.push({ id: "title", label: "Judul SEO", status: "bad", message: "Judul belum diisi." });
  } else if (effectiveTitle.length < TITLE_MIN) {
    checks.push({
      id: "title",
      label: "Judul SEO",
      status: "warning",
      message: `Judul ${effectiveTitle.length} karakter — terlalu pendek, idealnya ${TITLE_MIN}–${TITLE_MAX}.`,
    });
  } else if (effectiveTitle.length > TITLE_MAX) {
    checks.push({
      id: "title",
      label: "Judul SEO",
      status: "warning",
      message: `Judul ${effectiveTitle.length} karakter — berisiko terpotong di hasil pencarian (maks ${TITLE_MAX}).`,
    });
  } else {
    checks.push({ id: "title", label: "Judul SEO", status: "good", message: `Panjang judul pas (${effectiveTitle.length} karakter).` });
  }

  // 2. Meta description
  if (!effectiveDesc) {
    checks.push({
      id: "description",
      label: "Meta Deskripsi",
      status: "bad",
      message: "Belum ada deskripsi. Google akan mengarang cuplikan sendiri.",
    });
  } else if (effectiveDesc.length < DESC_MIN) {
    checks.push({
      id: "description",
      label: "Meta Deskripsi",
      status: "warning",
      message: `Deskripsi ${effectiveDesc.length} karakter — terlalu pendek, idealnya ${DESC_MIN}–${DESC_MAX}.`,
    });
  } else if (effectiveDesc.length > DESC_MAX) {
    checks.push({
      id: "description",
      label: "Meta Deskripsi",
      status: "warning",
      message: `Deskripsi ${effectiveDesc.length} karakter — akan terpotong (maks ${DESC_MAX}).`,
    });
  } else {
    checks.push({ id: "description", label: "Meta Deskripsi", status: "good", message: `Panjang deskripsi pas (${effectiveDesc.length} karakter).` });
  }

  // 3. Panjang konten
  if (wordCount === 0) {
    checks.push({ id: "length", label: "Panjang Konten", status: "bad", message: "Konten masih kosong." });
  } else if (wordCount < MIN_WORDS) {
    checks.push({
      id: "length",
      label: "Panjang Konten",
      status: "warning",
      message: `${wordCount} kata — artikel tipis sulit bersaing, target minimal ${MIN_WORDS} kata.`,
    });
  } else {
    checks.push({ id: "length", label: "Panjang Konten", status: "good", message: `${wordCount} kata.` });
  }

  // 4. Slug
  if (!input.slug) {
    checks.push({ id: "slug", label: "Slug URL", status: "bad", message: "Slug belum ada." });
  } else if (input.slug.length > 75) {
    checks.push({ id: "slug", label: "Slug URL", status: "warning", message: "Slug terlalu panjang, pendekkan agar mudah dibagikan." });
  } else {
    checks.push({ id: "slug", label: "Slug URL", status: "good", message: `/${input.slug}` });
  }

  // 5. Gambar sosial
  if (input.ogImage || input.coverImage) {
    checks.push({ id: "image", label: "Gambar Sosial", status: "good", message: "Gambar tersedia untuk pratinjau saat dibagikan." });
  } else {
    checks.push({
      id: "image",
      label: "Gambar Sosial",
      status: "warning",
      message: "Tanpa gambar, tautan tampil polos saat dibagikan ke WhatsApp/Facebook.",
    });
  }

  // 6. Subjudul — struktur penting untuk keterbacaan dan cuplikan
  const headingCount = (input.body.match(/<h[23][\s>]/gi) ?? []).length;
  if (headingCount === 0 && wordCount > MIN_WORDS) {
    checks.push({
      id: "headings",
      label: "Struktur Subjudul",
      status: "warning",
      message: "Artikel panjang tanpa subjudul. Pecah dengan H2/H3 agar mudah dipindai.",
    });
  } else {
    checks.push({ id: "headings", label: "Struktur Subjudul", status: "good", message: `${headingCount} subjudul digunakan.` });
  }

  // 7–9. Pemeriksaan kata kunci (hanya bila kata kunci diisi)
  if (!keyword) {
    checks.push({
      id: "keyword",
      label: "Kata Kunci Utama",
      status: "warning",
      message: "Belum ditentukan — isi agar analisis kata kunci bisa dijalankan.",
    });
  } else {
    const inTitle = occurrences(effectiveTitle.toLowerCase(), keyword) > 0;
    const inDesc = occurrences(effectiveDesc.toLowerCase(), keyword) > 0;
    const inSlug = input.slug.toLowerCase().includes(keyword.replace(/\s+/g, "-"));
    const bodyHits = occurrences(plainBody.toLowerCase(), keyword);
    const density = wordCount > 0 ? (bodyHits / wordCount) * 100 : 0;

    checks.push({
      id: "keyword-title",
      label: "Kata Kunci di Judul",
      status: inTitle ? "good" : "warning",
      message: inTitle ? "Kata kunci muncul di judul." : `"${keyword}" belum ada di judul.`,
    });

    checks.push({
      id: "keyword-meta",
      label: "Kata Kunci di Deskripsi & Slug",
      status: inDesc && inSlug ? "good" : "warning",
      message:
        inDesc && inSlug
          ? "Kata kunci ada di deskripsi dan slug."
          : `Belum ada di ${[!inDesc && "deskripsi", !inSlug && "slug"].filter(Boolean).join(" dan ")}.`,
    });

    if (bodyHits === 0) {
      checks.push({
        id: "keyword-density",
        label: "Sebaran Kata Kunci",
        status: "bad",
        message: "Kata kunci tidak muncul sama sekali di isi konten.",
      });
    } else if (density > 3) {
      checks.push({
        id: "keyword-density",
        label: "Sebaran Kata Kunci",
        status: "warning",
        message: `Kepadatan ${density.toFixed(1)}% — terlalu sering, berisiko dianggap keyword stuffing.`,
      });
    } else {
      checks.push({
        id: "keyword-density",
        label: "Sebaran Kata Kunci",
        status: "good",
        message: `Muncul ${bodyHits}× (kepadatan ${density.toFixed(1)}%).`,
      });
    }
  }

  // Skor: good = 1, warning = 0.5, bad = 0.
  const earned = checks.reduce((sum, c) => sum + (c.status === "good" ? 1 : c.status === "warning" ? 0.5 : 0), 0);
  const score = Math.round((earned / checks.length) * 100);

  return {
    score,
    grade: score >= 80 ? "baik" : score >= 50 ? "cukup" : "kurang",
    checks,
  };
}
