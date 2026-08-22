import { Prisma, type QuotationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/ApiError";
import { parsePagination, buildMeta } from "@/utils/pagination";
import { sum } from "@/utils/money";
import { resolveDocumentNumber } from "@/services/documentNumber.service";
import type {
  PaymentTerm,
  QuotationCreateInput,
  QuotationUpdateInput,
} from "@/validators/quotation.validator";

/** Bentuk rincian yang dibekukan di dalam kolom `snapshot`. */
export interface QuotationSnapshot {
  rabNumber: string;
  rabTitle: string;
  location: string | null;
  taxPct: string;
  discountPct: string;
  sections: {
    name: string;
    total: string;
    items: { description: string; unit: string; volume: string; unitPrice: string; amount: string }[];
  }[];
}

const DEFAULT_TERMS = [
  "Harga sudah termasuk material, upah, dan peralatan sesuai rincian di atas.",
  "Harga belum termasuk pekerjaan di luar lingkup yang disebutkan.",
  "Perubahan lingkup pekerjaan akan dihitung sebagai pekerjaan tambah/kurang.",
  "Jadwal pelaksanaan disepakati bersama setelah penawaran disetujui.",
].join("\n");

const DEFAULT_PAYMENT_TERMS: PaymentTerm[] = [
  { label: "Uang muka setelah kontrak ditandatangani", percent: 30 },
  { label: "Progres pekerjaan mencapai 50%", percent: 40 },
  { label: "Serah terima pekerjaan", percent: 25 },
  { label: "Masa pemeliharaan berakhir (retensi)", percent: 5 },
];


/**
 * Status kedaluwarsa tidak disimpan — dihitung saat dibaca, supaya tidak perlu
 * cron dan tidak pernah basi. Hanya penawaran terkirim yang bisa kedaluwarsa;
 * yang sudah diterima/ditolak sudah punya keputusan.
 */
export function isExpired(q: { status: QuotationStatus; validUntil: Date }): boolean {
  return q.status === "SENT" && q.validUntil.getTime() < Date.now();
}

export function serializeQuotation<T extends { status: QuotationStatus; validUntil: Date }>(q: T) {
  return { ...q, isExpired: isExpired(q) };
}

export async function listQuotations(query: {
  page?: unknown;
  pageSize?: unknown;
  search?: string;
  status?: string;
}) {
  const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>);

  const where: Prisma.QuotationWhereInput = {
    ...(query.search
      ? {
          OR: [
            { number: { contains: query.search, mode: "insensitive" } },
            { subject: { contains: query.search, mode: "insensitive" } },
            { clientName: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.status ? { status: query.status as Prisma.EnumQuotationStatusFilter["equals"] } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        rab: { select: { id: true, number: true } },
      },
    }),
    prisma.quotation.count({ where }),
  ]);

  return { items: items.map(serializeQuotation), meta: buildMeta(page, pageSize, total) };
}

export async function getQuotationById(id: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      rab: { select: { id: true, number: true, title: true } },
    },
  });
  if (!quotation) throw ApiError.notFound("Quotation not found");
  return serializeQuotation(quotation);
}

/**
 * Membuat surat penawaran dari sebuah RAB. Seluruh angka disalin ke `snapshot`
 * pada saat ini juga — perubahan RAB setelahnya tidak akan mengubah penawaran
 * yang sudah dibuat.
 */
export async function createQuotation(input: QuotationCreateInput, userId: string) {
  const rab = await prisma.rab.findUnique({
    where: { id: input.rabId },
    include: { sections: { orderBy: { order: "asc" }, include: { items: { orderBy: { order: "asc" } } } } },
  });
  if (!rab) throw ApiError.notFound("RAB not found");
  if (rab.sections.every((s) => s.items.length === 0)) {
    throw ApiError.badRequest("RAB belum memiliki item pekerjaan, tidak bisa dibuatkan penawaran");
  }

  const snapshot: QuotationSnapshot = {
    rabNumber: rab.number,
    rabTitle: rab.title,
    location: rab.location,
    taxPct: String(rab.taxPct),
    discountPct: String(rab.discountPct),
    sections: rab.sections.map((section) => ({
      name: section.name,
      total: String(sum(section.items.map((i) => i.amount))),
      items: section.items.map((item) => ({
        description: item.description,
        unit: item.unit,
        volume: String(item.volume),
        unitPrice: String(item.unitPrice),
        amount: String(item.amount),
      })),
    })),
  };

  const validUntil = input.validUntil
    ? new Date(input.validUntil)
    : new Date(Date.now() + (input.validForDays ?? 30) * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const number = await resolveDocumentNumber(
      "SPH",
      input.number,
      async (candidate, client) => Boolean(await client.quotation.findUnique({ where: { number: candidate } })),
      tx
    );

    // Jika penanda tangan dipilih dari daftar, auto-fill nama & jabatan.
    let signerName = input.signerName;
    let signerTitle = input.signerTitle;
    let signatoryId: string | null = null;
    if (input.signatoryId) {
      const signatory = await tx.signatory.findUnique({ where: { id: input.signatoryId } });
      if (signatory) {
        signatoryId = signatory.id;
        signerName = signatory.name;
        signerTitle = signatory.title;
      }
    }

    const created = await tx.quotation.create({
      data: {
        number,
        rabId: rab.id,
        clientName: input.clientName,
        clientCompany: input.clientCompany ?? null,
        clientAddress: input.clientAddress ?? null,
        attentionTo: input.attentionTo ?? null,
        subject: input.subject,
        openingNote: input.openingNote ?? null,
        closingNote: input.closingNote ?? null,
        terms: input.terms ?? DEFAULT_TERMS,
        paymentTerms: (input.paymentTerms ?? DEFAULT_PAYMENT_TERMS) as unknown as Prisma.InputJsonValue,
        validUntil,
        signerName,
        signerTitle,
        signatoryId,
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
        subtotal: rab.subtotal,
        discountAmount: rab.discountAmount,
        taxAmount: rab.taxAmount,
        total: rab.total,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        rab: { select: { id: true, number: true, title: true } },
      },
    });

    return serializeQuotation(created);
  });
}

/** Hanya teks surat yang bisa diubah; nilai penawaran tetap terkunci pada snapshot. */
export async function updateQuotation(id: string, input: QuotationUpdateInput) {
  const existing = await prisma.quotation.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Quotation not found");

  if (existing.status === "ACCEPTED" || existing.status === "REJECTED") {
    throw ApiError.badRequest(
      "Penawaran yang sudah diterima atau ditolak tidak dapat diubah. Batalkan dan buat penawaran baru bila perlu."
    );
  }

  if (input.number && input.number !== existing.number) {
    const clash = await prisma.quotation.findUnique({ where: { number: input.number } });
    if (clash) throw ApiError.conflict(`Nomor penawaran "${input.number}" sudah dipakai`);
  }

  const updated = await prisma.quotation.update({
    where: { id },
    data: {
      ...(input.number !== undefined ? { number: input.number } : {}),
      ...(input.clientName !== undefined ? { clientName: input.clientName } : {}),
      ...(input.clientCompany !== undefined ? { clientCompany: input.clientCompany } : {}),
      ...(input.clientAddress !== undefined ? { clientAddress: input.clientAddress } : {}),
      ...(input.attentionTo !== undefined ? { attentionTo: input.attentionTo } : {}),
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.openingNote !== undefined ? { openingNote: input.openingNote } : {}),
      ...(input.closingNote !== undefined ? { closingNote: input.closingNote } : {}),
      ...(input.terms !== undefined ? { terms: input.terms } : {}),
      ...(input.paymentTerms !== undefined
        ? { paymentTerms: input.paymentTerms as unknown as Prisma.InputJsonValue }
        : {}),
      ...(input.validUntil !== undefined ? { validUntil: new Date(input.validUntil) } : {}),
      ...(input.validForDays !== undefined
        ? { validUntil: new Date(Date.now() + input.validForDays * 24 * 60 * 60 * 1000) }
        : {}),
      ...(input.signerName !== undefined ? { signerName: input.signerName } : {}),
      ...(input.signerTitle !== undefined ? { signerTitle: input.signerTitle } : {}),
      ...(input.signatoryId !== undefined ? { signatoryId: input.signatoryId || null } : {}),
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      rab: { select: { id: true, number: true, title: true } },
    },
  });

  // Sync signerName/signerTitle jika penanda tangan diganti.
  if (input.signatoryId && input.signatoryId !== existing.signatoryId) {
    const signatory = await prisma.signatory.findUnique({ where: { id: input.signatoryId } });
    if (signatory) {
      await prisma.quotation.update({
        where: { id },
        data: { signerName: signatory.name, signerTitle: signatory.title },
      });
    }
  }

  return serializeQuotation(updated);
}

/** Transisi status yang diizinkan — mencegah alur mundur yang tidak masuk akal. */
const ALLOWED_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["ACCEPTED", "REJECTED", "CANCELLED", "DRAFT"],
  ACCEPTED: ["CANCELLED"],
  REJECTED: ["CANCELLED"],
  CANCELLED: [],
};

export async function updateQuotationStatus(id: string, status: QuotationStatus) {
  const existing = await prisma.quotation.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Quotation not found");

  if (existing.status === status) return serializeQuotation(existing);

  if (!ALLOWED_TRANSITIONS[existing.status].includes(status)) {
    throw ApiError.badRequest(`Status tidak dapat diubah dari ${existing.status} ke ${status}`);
  }

  const updated = await prisma.quotation.update({
    where: { id },
    data: {
      status,
      ...(status === "SENT" ? { sentAt: new Date() } : {}),
      ...(status === "ACCEPTED" || status === "REJECTED" ? { decidedAt: new Date() } : {}),
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      rab: { select: { id: true, number: true, title: true } },
    },
  });

  return serializeQuotation(updated);
}

export async function deleteQuotation(id: string) {
  const existing = await prisma.quotation.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Quotation not found");
  if (existing.status === "ACCEPTED") {
    throw ApiError.badRequest("Penawaran yang sudah diterima tidak dapat dihapus — batalkan saja agar riwayatnya tetap ada.");
  }
  await prisma.quotation.delete({ where: { id } });
}

/** Nilai bawaan untuk formulir "buat penawaran" di admin. */
export async function getQuotationDefaults(rabId: string) {
  const rab = await prisma.rab.findUnique({
    where: { id: rabId },
    select: { id: true, number: true, title: true, clientName: true, location: true, total: true },
  });
  if (!rab) throw ApiError.notFound("RAB not found");

  return {
    rab,
    defaults: {
      subject: `Penawaran Harga — ${rab.title}`,
      clientName: rab.clientName ?? "",
      terms: DEFAULT_TERMS,
      paymentTerms: DEFAULT_PAYMENT_TERMS,
      validForDays: 30,
      openingNote:
        "Sehubungan dengan permintaan penawaran yang Bapak/Ibu sampaikan, bersama ini kami mengajukan penawaran harga untuk pekerjaan sebagai berikut:",
      closingNote:
        "Demikian penawaran ini kami sampaikan. Besar harapan kami untuk dapat bekerja sama dengan Bapak/Ibu. Atas perhatiannya kami ucapkan terima kasih.",
    },
  };
}
