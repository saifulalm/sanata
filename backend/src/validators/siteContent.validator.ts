import { z } from "zod";
import { COLLECTION_KEYS, HERO_SCENE_ACCENTS, HERO_SCENE_VARIANTS } from "@/config/siteContent";

/**
 * Field pilihan yang tersimpan di kolom `meta`.
 *
 * Sengaja dibatasi enum, bukan string bebas: nilainya dipetakan frontend ke
 * komponen ilustrasi dan kelas gradien yang sudah ada, sehingga token asing
 * hanya akan menghasilkan slide tanpa gaya.
 */
export const collectionItemMetaSchema = z
  .object({
    variant: z.enum(HERO_SCENE_VARIANTS).optional(),
    accent: z.enum(HERO_SCENE_ACCENTS).optional(),
    // Ukuran lantai untuk model 3D. Batas atas menahan salah ketik yang bisa
    // membuat satu lantai jauh lebih besar dari sisanya dan merusak framing.
    heightM: z.number().positive().max(20).optional(),
    widthM: z.number().positive().max(200).optional(),
    depthM: z.number().positive().max(200).optional(),
    // Minggu ke-0 sah (pekerjaan yang mulai di hari pertama), jadi batasnya
    // nonnegatif — bukan positif seperti ukuran fisik.
    startWeek: z.number().int().min(0).max(520).optional(),
    durationWeeks: z.number().int().min(1).max(260).optional(),
    // Nomor disimpan apa adanya; frontend yang membuang karakter non-angka
    // saat menyusun tautan wa.me, sehingga admin bebas menulis "+62 812-...".
    phone: z.string().max(20).optional(),
    hours: z.string().max(40).optional(),
    keywords: z.string().max(200).optional(),
  })
  .strict();

export const collectionItemSchema = z.object({
  collection: z.enum(COLLECTION_KEYS as [string, ...string[]]),
  title: z.string().max(255).optional().nullable(),
  subtitle: z.string().max(255).optional().nullable(),
  body: z.string().max(5000).optional().nullable(),
  icon: z.string().max(60).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  href: z.string().max(500).optional().nullable(),
  meta: collectionItemMetaSchema.optional().nullable(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const collectionItemUpdateSchema = collectionItemSchema.partial();

/** Simpan banyak setting sekaligus — satu form admin per grup. */
export const settingsUpdateSchema = z.object({
  settings: z.array(z.object({ key: z.string().min(1).max(120), value: z.string().max(5000) })),
});

export type CollectionItemInput = z.infer<typeof collectionItemSchema>;
export type CollectionItemUpdateInput = z.infer<typeof collectionItemUpdateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
